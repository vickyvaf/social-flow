import { createThirdwebClient } from "thirdweb";
import { facilitator, settlePayment } from "thirdweb/x402";
import { arbitrumSepolia } from "thirdweb/chains";

const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY || "",
});
const thirdwebX402Facilitator = facilitator({
  client,
  serverWalletAddress: process.env.SERVER_WALLET_ADDRESS || "",
});

export async function GET(request: Request) {
  const paymentData =
    request.headers.get("PAYMENT-SIGNATURE") ||
    request.headers.get("X-PAYMENT");

  const result = await settlePayment({
    resourceUrl: "https://api.example.com/premium-content",
    method: "GET",
    paymentData,
    payTo: process.env.SERVER_WALLET_ADDRESS || "",
    network: arbitrumSepolia,
    price: "$0.01",
    facilitator: thirdwebX402Facilitator,
  });

  if (result.status === 200) {
    return Response.json({ data: "premium content" });
  } else {
    // Return the response body from settlePayment directly, along with status and headers
    // settlePayment returns a stringified body in case of non-200
    // We need to parse it if it's JSON or return as is.
    // However, Response.json expects an object.
    // Let's inspect what settlePayment returns on failure.
    // Usually it returns a JSON object for 402 details.

    // The user snippet used:
    // return Response.json(result.responseBody, { ... })
    // Assuming result.responseBody is an object.

    return Response.json(result.responseBody, {
      status: result.status,
      headers: result.responseHeaders as HeadersInit,
    });
  }
}
