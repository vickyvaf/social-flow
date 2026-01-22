import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

const MAX_LENGTH_CONTENT = 280;

export async function POST(req: Request) {
  try {
    const { prompt, platform, systemInstruction } = await req.json();

    if (!prompt || !systemInstruction) {
      return NextResponse.json(
        { error: "Prompt and System Instruction are required" },
        { status: 400 },
      );
    }

    // 1. Credit Check Removed

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const lengthConstraint = `Max with ${MAX_LENGTH_CONTENT} char length.`;

    const result = await model.generateContent([
      systemInstruction,
      "IMPORTANT: Detect the language of the 'User Input'. The 'Enhanced Prompt' or generated content MUST be in the SAME language as the 'User Input'.",
      "STRICT OUTPUT RULES: 1. Do NOT include any conversational filler (e.g., 'Okay', 'Here is', 'Sure'). 2. Output ONLY the generated content. 3. Generate a SINGLE best option. Do NOT provide multiple options or variations. 4. Do NOT use markdown lists or bullet points unless explicitly asked.",
      lengthConstraint,
      `Target Platform: ${platform}`,
      `User Input: ${prompt}\n\nEnhanced Prompt:`,
    ]);

    const response = result.response;
    const text = response.text();

    // 2. Deduct Credit Removed

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content", rawError: error },
      { status: 500 },
    );
  }
}
