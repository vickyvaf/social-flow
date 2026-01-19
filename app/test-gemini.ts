import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("No API key found in behavior environment");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("API Error:", data.error);
      return;
    }

    if (data.models) {
      console.log("Available Models:");
      data.models.forEach((m: any) => {
        if (m.supportedGenerationMethods?.includes("generateContent")) {
          console.log(`- ${m.name}`);
        }
      });
    } else {
      console.log("No models found or unexpected response:", data);
    }
  } catch (error) {
    console.error("Global error:", error);
  }
}

listModels();
