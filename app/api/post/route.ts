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
    let walletAddress = "";

    if (token) {
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    // Fallback: Check for custom X-User-Id header (for Wallet users without Supabase session)
    if (!user) {
      const userIdHeader = request.headers.get("X-User-Id");
      if (userIdHeader) {
        // If it looks like an Ethereum address, resolve it to a profile ID
        if (userIdHeader.startsWith("0x")) {
          walletAddress = userIdHeader; // Capture wallet address
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("wallet_address", userIdHeader)
            .single();

          if (profile) {
            user = { id: profile.id };
          } else {
            console.error(
              "Profile not found for wallet address:",
              userIdHeader,
            );
            return NextResponse.json(
              { error: "User profile not found" },
              { status: 401 },
            );
          }
        } else {
          // Assume it's already a UUID
          user = { id: userIdHeader };
        }
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

        try {
          // Resolve wallet address if not already known
          let finalWalletAddress = walletAddress;
          if (!finalWalletAddress) {
            const { data: profile } = await supabaseClient
              .from("profiles")
              .select("wallet_address")
              .eq("id", user.id)
              .single();
            if (profile) {
              finalWalletAddress = profile.wallet_address;
            }
          }

          // 1. Insert into post_transactions
          const { error: txError } = await supabaseClient
            .from("post_transactions")
            .insert([
              {
                user_id: user.id,
                post_id: post.id,
                wallet_address:
                  finalWalletAddress ||
                  "0x0000000000000000000000000000000000000000", // Fallback to avoid constraint error
                chain_id: "84532",
                tx_hash:
                  "0xDemo" +
                  Math.random().toString(16).slice(2) +
                  Date.now().toString(16),
                amount_eth: 1000, // Cost in IDRX
                currency: "IDRX",
                status: "confirmed",
                created_at: new Date().toISOString(),
                confirmed_at: new Date().toISOString(),
              },
            ]);

          if (txError)
            console.error("Error creating post_transaction:", txError);

          // 2. Insert into credit_usage_logs
          const { error: logError } = await supabaseClient
            .from("credit_usage_logs")
            .insert([
              {
                user_id: user.id,
                action: scheduledFor ? "schedule_post" : "create_post",
                credits_used: 1000, // Cost in IDRX
              },
            ]);

          if (logError)
            console.error("Error creating credit_usage_log:", logError);
        } catch (dbError) {
          console.error("Error recording transactions:", dbError);
        }
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
