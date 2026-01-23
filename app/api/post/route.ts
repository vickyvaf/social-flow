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

    const {
      data: { user },
    } = token
      ? await supabaseClient.auth.getUser(token)
      : await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Credit Check
    const { data: creditData, error: creditError } = await supabaseClient
      .from("user_credits")
      .select("credits_remaining")
      .eq("user_id", user.id)
      .maybeSingle();

    if (creditError || !creditData || creditData.credits_remaining <= 0) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: "You have run out of credits. Please top up to continue.",
        },
        { status: 403 },
      );
    }

    const platformPayloads = [];
    for (const p of platformsToProcess) {
      const accountIdCookieName = `${p}_account_id`;
      const accountId = request.cookies.get(accountIdCookieName)?.value;

      if (!accountId) {
        return NextResponse.json(
          { error: `Not authenticated with ${p}` },
          { status: 401 },
        );
      }
      platformPayloads.push({ platform: p as any, accountId: accountId });
    }

    const late = getLateClient();

    try {
      const payload: any = {
        content,
        platforms: platformPayloads,
      };

      if (scheduledFor) {
        payload.scheduledFor = scheduledFor;
      } else {
        payload.publishNow = true;
      }

      // 1. Deduct Credit IMMEDIATELY
      const { error: updateError } = await supabaseClient.rpc("deduct_credit", {
        p_user_id: user.id,
      });

      // If RPC fails (e.g. not defined), fallback to manual update
      if (updateError) {
        console.warn(
          "RPC deduct_credit failed, falling back to manual update",
          updateError,
        );
        const { data: currentCredits } = await supabaseClient
          .from("user_credits")
          .select("credits_remaining")
          .eq("user_id", user.id)
          .maybeSingle();

        if (currentCredits) {
          await supabaseClient
            .from("user_credits")
            .update({ credits_remaining: currentCredits.credits_remaining - 1 })
            .eq("user_id", user.id);
        }
      }

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
        external_id: postData._id,
        external_user_id: postData.userId,
        title: postData.title || "",
        content: postData.content,
        media_items: postData.mediaItems || [],
        platforms: postData.platforms || [],
        scheduled_for: postData.scheduledFor || null,
        timezone: postData.timezone || "UTC",
        status: postData.status || (scheduledFor ? "scheduled" : "published"),
        tags: postData.tags || [],
        hashtags: postData.hashtags || [],
        mentions: postData.mentions || [],
        visibility: postData.visibility || "public",
        crossposting_enabled: postData.crosspostingEnabled ?? true,
        metadata: postData.metadata || {},
        publish_attempts: postData.publishAttempts || 0,
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

      // 3. Deduct Credit (MOVED to before external call)
      // This block is now handled earlier

      return NextResponse.json({ success: true, result: postResult });
    } catch (lateError: any) {
      console.error("Late API Error:", lateError);

      // REFUND CREDIT if Late API fails
      try {
        console.log("Refunding credit due to API failure...");
        // Attempts to refund via RPC usually, but for simplicity here we just increment manually
        // or effectively 'undo' the deduction.
        // Ideally we have a 'refund_credit' RPC, but manual is fine for now as fallback.

        const { data: currentCredits } = await supabaseClient
          .from("user_credits")
          .select("credits_remaining")
          .eq("user_id", user.id)
          .maybeSingle();

        if (currentCredits) {
          await supabaseClient
            .from("user_credits")
            .update({ credits_remaining: currentCredits.credits_remaining + 1 })
            .eq("user_id", user.id);
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
