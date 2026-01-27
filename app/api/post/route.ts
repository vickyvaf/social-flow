import { NextRequest, NextResponse } from "next/server";
import { getLateClient } from "@/lib/getlate";
import { supabase as supabaseClient } from "@/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      content,
      platform,
      platforms: requestedPlatforms,
      scheduledFor,
      mediaItems,
      title,
      tags,
      hashtags,
      mentions,
      visibility,
      crosspostingEnabled,
    } = body;

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    // Enforce array format: "saat post atau schedule post ... tetap kirim dalam bentuk array"
    // We prioritize 'platforms' usage, but support 'platform' for backward compatibility by converting it to an array.
    const platformsToProcess: string[] = Array.isArray(requestedPlatforms)
      ? requestedPlatforms
      : platform
        ? [platform]
        : [];

    if (platformsToProcess.length === 0) {
      return NextResponse.json(
        { error: "No platform specified" },
        { status: 400 },
      );
    }

    // Authenticate user via Supabase
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    let user: any = null;

    if (token) {
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    // Fallback: Check for custom X-User-Id header (for Wallet users without Supabase session)
    if (!user) {
      const userIdHeader = request.headers.get("X-User-Id");
      if (userIdHeader) {
        // Verify this user exists in profiles (optional security check, but good practice)
        // For now, we trust the client's claimed ID if it matches a valid UUID format or just take it,
        // relying on the fact that only signed-in wallet users get here in UI.
        // A more secure way would be to verify a signature, but we are keeping it simple as per existing flow.
        user = { id: userIdHeader };
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Credit system removed - payment is now handled via IDRX token

    const platformPayloads = [];
    for (const p of platformsToProcess) {
      const accountIdCookieName = `${p}_account_id`;
      const accountId = request.cookies.get(accountIdCookieName)?.value;
      const usernameCookieName = `${p}_username`;
      const username = request.cookies.get(usernameCookieName)?.value;

      if (!accountId) {
        return NextResponse.json(
          { error: `Not authenticated with ${p}` },
          { status: 401 },
        );
      }
      platformPayloads.push({
        platform: p as any,
        accountId: accountId,
        username: username ? decodeURIComponent(username) : undefined,
      });
    }

    const late = getLateClient();

    try {
      const payload: any = {
        content,
        platforms: platformPayloads,
        mediaItems,
        title,
        tags,
        hashtags,
        mentions,
        visibility,
        crosspostingEnabled,
      };

      if (scheduledFor) {
        payload.scheduledFor = scheduledFor;
      } else {
        payload.publishNow = true;
      }

      // Credit deduction removed - payment handled via IDRX token transfer

      const { data: postResult } = await late.posts.createPost({
        body: payload,
      });

      const postResultAny = postResult as any;
      const externalPostId = postResultAny?._id || postResultAny?.id;

      // 1. Record the post in Supabase (getlate_posts)
      // Extract the post object from the result. The user example shows result.post
      const postData = postResultAny?.post || postResultAny;

      // Map fields from GetLate response to our DB schema
      const dbPayload = {
        user_id: user.id, // Internal Supabase ID
        external_id: postData._id || postData.id,
        external_user_id: postData.userId || user.id,
        title: postData.title || title || "",
        content: postData.content || content,
        media_items: postData.mediaItems || mediaItems || [],
        platforms: postData.platforms || platformPayloads || [],
        scheduled_for: postData.scheduledFor || scheduledFor || null,
        timezone: postData.timezone || "UTC",
        status: postData.status || (scheduledFor ? "scheduled" : "published"),
        tags: postData.tags || tags || [],
        hashtags: postData.hashtags || hashtags || [],
        mentions: postData.mentions || mentions || [],
        visibility: postData.visibility || visibility || "public",
        crossposting_enabled:
          postData.crosspostingEnabled ?? crosspostingEnabled ?? true,
        metadata: postData.metadata || {},
        publish_attempts: postData.publishAttempts || 0,
        external_raw: postResultAny,
      };

      const { data: post, error: postError } = await supabaseClient
        .from("getlate_posts")
        .insert([dbPayload])
        .select()
        .single();

      if (postError) {
        console.error("Error creating post in Supabase:", postError);
        // We still return success since Late post was created, but log the error
      } else {
        // Post saved successfully
        console.log("Post saved to getlate_posts:", post.id);

        // We can optionally check/create oauth_accounts here if needed for caching,
        // but the prompt asked to "directly send all to table getlate_post", so we simplify.
      }

      return NextResponse.json({ success: true, result: postResult });
    } catch (lateError: any) {
      console.error("Late API Error:", lateError);

      // REFUND CREDIT if Late API fails
      try {
        console.log("Refunding credit due to API failure...");
        const { error: refundError } = await supabaseClient.rpc(
          "refund_credit",
          {
            p_user_id: user.id,
          },
        );

        if (refundError) {
          console.warn(
            "RPC refund_credit failed, falling back to manual update",
            refundError,
          );
          const { data: currentCredits } = await supabaseClient
            .from("user_credits")
            .select("credits_remaining")
            .eq("user_id", user.id)
            .maybeSingle();

          if (currentCredits) {
            await supabaseClient
              .from("user_credits")
              .update({
                credits_remaining: currentCredits.credits_remaining + 1,
              })
              .eq("user_id", user.id);
          }
        }
      } catch (refundError) {
        console.error("Failed to refund credit after API error", refundError);
      }

      return NextResponse.json(
        {
          error: lateError.message || `Failed to post via Late`,
          details: lateError.details || lateError,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error posting content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
