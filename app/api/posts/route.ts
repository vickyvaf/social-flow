import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initial auth check
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");

    // Calculate range
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Determine select string based on platform filter
    // If filtering by platform, use !inner to filter parent posts by child existence
    const selectStr =
      platform && platform !== "all"
        ? "*, post_distributions!inner(*)"
        : "*, post_distributions(*)";

    let query = supabase
      .from("posts")
      .select(selectStr, { count: "exact" })
      .eq("user_id", user.id)
      .range(from, to)
      .order("created_at", { ascending: false });

    // Status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Platform filter
    if (platform && platform !== "all") {
      query = query.eq("post_distributions.platform", platform);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ posts, count });
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch posts" },
      { status: 500 },
    );
  }
}
