import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");
    const queryUserId = searchParams.get("userId");

    let userId: string | null = queryUserId;
    let email: string | null = null;

    // 1. Try to get user from Supabase Auth if not provided in query
    if (!userId) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;
        email = user.email || null;
      } else if (address) {
        // 2. If no auth user, try to find by wallet address in profiles table
        const { data: profileDataByWallet, error: walletError } = await supabase
          .from("profiles")
          .select("id")
          .eq("wallet_address", address)
          .single();

        if (profileDataByWallet) {
          userId = profileDataByWallet.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({
        name: "Guest",
        address: address || null,
      });
    }

    // 3. Fetch profile
    const profileRes = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      name:
        email || address?.slice(0, 6) + "..." + address?.slice(-4) || "User",
      address: address || null,
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
