export const NETWORK_ID = "eip155:84532" as const;
export const CHAIN_ID = 84532;
export const PRICE = "1000"; // 10 IDRX (dengan 2 decimals)
export const TOKEN_ADDRESS = "0x2a575733e45f7b65dda6f1e8e501bcad125456d7" as `0x${string}`;
export const FACILITATOR_URL = "https://x402.org/facilitator";
export const RESOURCE_DESCRIPTION = "Access to Social Flow's AI-powered content generation features via X402.";

export const X402_CONFIG = {
  NETWORK_ID,
  CHAIN_ID,
  PRICE,
  TOKEN_ADDRESS,
  FACILITATOR_URL,
  RESOURCE_DESCRIPTION,
} as const;