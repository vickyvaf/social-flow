import { NextRequest, NextResponse } from "next/server";
import { getLateClient } from "@/lib/getlate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, platform, scheduledFor } = body;

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const accountIdCookieName = `${platform}_account_id`;
    const accountId = request.cookies.get(accountIdCookieName)?.value;

    if (!accountId) {
      return NextResponse.json(
        { error: `Not authenticated with ${platform}` },
        { status: 401 },
      );
    }

    const late = getLateClient();

    try {
      const payload: any = {
        content,
        platforms: [{ platform: platform as any, accountId: accountId }],
      };

      if (scheduledFor) {
        payload.scheduledFor = scheduledFor;
      } else {
        payload.publishNow = true;
      }

      const { data: post } = await late.posts.createPost({
        body: payload,
      });

      return NextResponse.json({ success: true, result: post });
    } catch (lateError: any) {
      console.error("Late API Error:", lateError);
      return NextResponse.json(
        {
          error: lateError.message || `Failed to post to ${platform} via Late`,
          details: lateError.details || lateError,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Unsupported platform" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error posting content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
