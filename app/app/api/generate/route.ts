import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
  try {
    const { prompt, platform, systemInstruction } = await req.json();

    if (!prompt || !systemInstruction) {
      return NextResponse.json(
        { error: "Prompt and System Instruction are required" },
        { status: 400 },
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      systemInstruction,
      "IMPORTANT: Detect the language of the 'User Input'. The 'Enhanced Prompt' or generated content MUST be in the SAME language as the 'User Input'.",
      `Target Platform: ${platform}`,
      `User Input: ${prompt}\n\nEnhanced Prompt:`,
    ]);

    const response = result.response;
    const text = response.text();

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content", rawError: error },
      { status: 500 },
    );
  }
}
