import { NextRequest, NextResponse } from "next/server";
import { getLateClient } from "@/lib/getlate";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optional: Auth check
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (authError || !user) {
        // Depending on requirements, we might want to fail here.
        // For now, proceeding but could enforce ownership check:
        // await supabase.from('posts').delete().eq('id', id).eq('user_id', user.id)
      }
    }

    const late = getLateClient();

    // 1. Delete from Late API
    try {
      // We attempt to delete from Late. If it fails (e.g. not found), we log but continue to ensure DB cleanup.
      await late.posts.deletePost({ path: { postId: id } });
    } catch (sdkError: any) {
      console.warn("SDK warning during delete (Late API):", sdkError);
    }

    // 2. Delete from Supabase
    // Using simple delete where id matches.
    // If strict ownership is needed, we should include .eq('user_id', user.id) if user is available.
    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting post (outer catch):", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to delete post",
        details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      },
      { status: 500 },
    );
  }
}
