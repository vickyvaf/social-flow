"use client";

import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || ""; // Replace with your client ID

export const client = createThirdwebClient({
  clientId: clientId,
});
