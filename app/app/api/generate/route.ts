import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemInstruction = `You are a helpful assistant that generates detailed, creative, and engaging prompts for social media content creation based on a short input. 
    Expand on the user's idea, adding context, tone, and specific details to make it a high-quality prompt for content generation. 
    Keep the output concise but rich. Do not include any conversational filler, just the enhanced prompt.`;

    const result = await model.generateContent([
      systemInstruction,
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
