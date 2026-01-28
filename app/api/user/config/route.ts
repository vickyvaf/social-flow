import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create server-side Supabase client with service role for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    let userId: string | null = null;

    // 1. Try to get user from Authorization header (if logged in via Supabase Auth)
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    // 2. If no auth user but have wallet address, find or create profile
    if (!userId && address) {
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("wallet_address", address)
        .single();

      if (profileData) {
        userId = profileData.id;
      } else {
        // Create new profile for wallet user
        const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
          email: `${address.toLowerCase()}@wallet.local`,
          email_confirm: true,
          user_metadata: {
            wallet_address: address,
          },
        });

        if (newUser.user) {
          userId = newUser.user.id;

          // Create profile entry
          await supabaseAdmin.from("profiles").insert({
            id: userId,
            wallet_address: address,
          });
        }
      }
    }

    if (!userId) {
      // Return empty state instead of 401 to allow guest access
      return NextResponse.json({
        preferences: null,
        hasCompletedOnboarding: false,
      });
    }

    // 3. Fetch user preferences using admin client (bypasses RLS)
    const { data: preferences, error: preferencesError } = await supabaseAdmin
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (preferencesError && preferencesError.code !== "PGRST116") {
      console.error("Error fetching preferences:", preferencesError);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: preferences || null,
      hasCompletedOnboarding: !!preferences,
      userId: userId, // Return userId for client to use
    });
  } catch (error: any) {
    console.error("Error in GET /api/user/config:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences, address } = body;

    console.log("POST /api/user/config - Received:", {
      hasPreferences: !!preferences,
      address,
      bodyKeys: Object.keys(body)
    });

    let userId: string | null = null;

    // 1. If wallet address provided, prioritize that
    if (address) {
      console.log("Looking up user by wallet address:", address);

      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("wallet_address", address)
        .single();

      if (profileData) {
        userId = profileData.id;
        console.log("Found existing user by wallet:", userId);
      } else {
        // Create new user for wallet
        console.log("Creating new user for wallet:", address);
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: `${address.toLowerCase()}@wallet.local`,
          email_confirm: true,
          user_metadata: {
            wallet_address: address,
          },
        });

        if (createError) {
          console.error("Error creating user:", createError);
        }

        if (newUser?.user) {
          userId = newUser.user.id;
          console.log("Created new user:", userId);

          await supabaseAdmin.from("profiles").insert({
            id: userId,
            wallet_address: address,
          });
        }
      }
    }

    // 2. Fallback: Try to get user from Authorization header
    if (!userId) {
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const {
          data: { user },
        } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          userId = user.id;
          console.log("Found user from auth header:", userId);
        }
      }
    }

    if (!userId) {
      console.error("No userId found - address:", address, "has auth header:", !!request.headers.get("authorization"));
      return NextResponse.json(
        { error: "User authentication required. Please connect your wallet.", details: { address, hasAuthHeader: !!request.headers.get("authorization") } },
        { status: 401 }
      );
    }

    const { data, error: upsertError } = await supabaseAdmin
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting preferences:", upsertError);
      return NextResponse.json(
        { error: "Failed to save preferences", details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: data,
    });
  } catch (error: any) {
    console.error("Error in POST /api/user/config:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
