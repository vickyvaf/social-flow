import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "@/supabase/client";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

const MAX_LENGTH_CONTENT = 280;

// === HELPER FUNCTIONS FOR CONTEXTUAL GUIDANCE ===

function getBrandVoiceDescription(voice: string | undefined): string {
  const descriptions: Record<string, string> = {
    professional: "Maintain authority and expertise. Use industry terminology appropriately. Be credible and trustworthy.",
    casual: "Sound like a friend. Use conversational language. Be approachable and relatable.",
    humorous: "Inject wit and humor. Make people smile. Be entertaining while staying on message.",
    authoritative: "Lead with confidence. State facts firmly. Position as the expert in the field.",
    empathetic: "Show understanding and compassion. Connect emotionally. Acknowledge audience feelings.",
    inspirational: "Motivate and uplift. Use powerful, positive language. Encourage action and growth.",
  };
  return descriptions[voice?.toLowerCase() || ""] || "Adapt tone based on context and audience.";
}

function getToneDescription(tone: string | undefined): string {
  const descriptions: Record<string, string> = {
    friendly: "Warm, welcoming, and personable. Make readers feel valued.",
    formal: "Polished, professional, and structured. Maintain decorum.",
    playful: "Fun, energetic, and spontaneous. Don't be afraid to be quirky.",
    serious: "Focused, straightforward, and no-nonsense. Get to the point.",
    optimistic: "Positive, hopeful, and forward-looking. Highlight opportunities.",
    urgent: "Time-sensitive, action-oriented. Create momentum.",
  };
  return descriptions[tone?.toLowerCase() || ""] || "Balanced and appropriate to the message.";
}

function getContentStyleDescription(style: string | undefined): string {
  const descriptions: Record<string, string> = {
    engaging: "Hook attention immediately. Use compelling angles. Keep readers interested.",
    educational: "Teach something valuable. Break down complex ideas. Provide actionable insights.",
    promotional: "Highlight benefits and value. Create desire. Drive conversions.",
    storytelling: "Weave narratives. Use descriptive language. Create emotional connection.",
    conversational: "Write like you speak. Ask questions. Invite dialogue.",
    minimalist: "Strip to essentials. Every word counts. Maximum impact, minimum fluff.",
  };
  return descriptions[style?.toLowerCase() || ""] || "Adapt style to maximize engagement.";
}

function getCreativityGuidance(level: number): string {
  if (level <= 3) return "→ Conservative: Stick to proven formulas. Professional and safe.";
  if (level <= 5) return "→ Balanced: Mix familiar patterns with subtle creativity.";
  if (level <= 7) return "→ Creative: Experiment with unique angles and fresh perspectives.";
  if (level <= 9) return "→ Innovative: Push boundaries. Try bold, unexpected approaches.";
  return "→ Maximum Creativity: Break conventions. Be wildly original and daring.";
}

function getLengthGuidance(length: string | undefined): string {
  const guidance: Record<string, string> = {
    short: "→ Concise & punchy (1-2 sentences). Every word must earn its place.",
    medium: "→ Balanced length (2-4 sentences). Provide context without overwhelming.",
    long: "→ Comprehensive (4+ sentences). Tell the full story with rich detail.",
  };
  return guidance[length?.toLowerCase() || "medium"] || "→ Adapt length to message complexity.";
}

function getEmojiGuidance(usage: string | undefined): string {
  const guidance: Record<string, string> = {
    none: "→ No emojis. Pure text communication.",
    minimal: "→ 1-2 strategic emojis max. Use sparingly for emphasis.",
    moderate: "→ 3-5 emojis. Balance professionalism with personality.",
    heavy: "→ 5+ emojis. Express emotions freely and colorfully.",
  };
  return guidance[usage?.toLowerCase() || "moderate"] || "→ Use emojis to enhance, not distract.";
}

function getCtaGuidance(preference: string | undefined): string {
  const guidance: Record<string, string> = {
    none: "→ No call-to-action. Let content speak for itself.",
    soft: "→ Gentle suggestion. Invite without pressure (e.g., 'Thoughts?', 'What do you think?').",
    moderate: "→ Clear but friendly CTA (e.g., 'Check it out', 'Learn more').",
    strong: "→ Direct action demand (e.g., 'Don't miss this!', 'Act now').",
  };
  return guidance[preference?.toLowerCase() || "moderate"] || "→ Match CTA intensity to message urgency.";
}

export async function POST(req: Request) {
  try {
    const { prompt, platform, systemInstruction, address } = await req.json();

    if (!prompt || !systemInstruction) {
      return NextResponse.json(
        { error: "Prompt and System Instruction are required" },
        { status: 400 },
      );
    }

    // 1. Get user ID
    let userId: string | null = null;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
    } else if (address) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("wallet_address", address)
        .single();
      if (profileData) {
        userId = profileData.id;
      }
    }

    // 2. Fetch user preferences
    const { data: preferences } = userId
      ? await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single()
      : { data: null };

    // 3. Build sophisticated, context-rich prompting system
    let enhancedSystemInstruction = systemInstruction;
    const contextParts: string[] = [];

    if (preferences) {
      // === BRAND IDENTITY & VOICE ===
      contextParts.push(`🎯 BRAND IDENTITY & POSITIONING:
Brand Name: ${preferences.brand_name || "N/A"}
Industry/Niche: ${preferences.niche || "General"}
Target Audience: ${preferences.target_audience || "General audience"}

📢 BRAND VOICE & TONE GUIDELINES:
Primary Voice: ${preferences.brand_voice || "Professional"}
- ${getBrandVoiceDescription(preferences.brand_voice)}

Tone: ${preferences.tone || "Friendly"}
- ${getToneDescription(preferences.tone)}

Content Style: ${preferences.content_style || "Engaging"}
- ${getContentStyleDescription(preferences.content_style)}`);

      // === STRATEGIC KEYWORDS & HASHTAGS ===
      if (preferences.keywords && preferences.keywords.length > 0) {
        contextParts.push(
          `🔑 STRATEGIC KEYWORDS (naturally integrate these):
${preferences.keywords.map((k: string) => `• ${k}`).join("\n")}`
        );
      }

      if (preferences.preferred_hashtags && preferences.preferred_hashtags.length > 0) {
        contextParts.push(
          `#️⃣ PREFERRED HASHTAGS (select relevant ones):
${preferences.preferred_hashtags.map((h: string) => `• ${h}`).join("\n")}`
        );
      }

      if (preferences.avoid_topics && preferences.avoid_topics.length > 0) {
        contextParts.push(
          `🚫 TOPICS TO AVOID (never mention):
${preferences.avoid_topics.map((t: string) => `• ${t}`).join("\n")}`
        );
      }

      // === CONTENT GENERATION PARAMETERS ===
      const creativityLevel = preferences.creativity_level || 7;
      contextParts.push(`⚙️ GENERATION PARAMETERS:
Creativity Level: ${creativityLevel}/10
${getCreativityGuidance(creativityLevel)}

Post Length: ${preferences.post_length || "medium"}
${getLengthGuidance(preferences.post_length)}

Emoji Usage: ${preferences.emoji_usage || "moderate"}
${getEmojiGuidance(preferences.emoji_usage)}

Call-to-Action Style: ${preferences.call_to_action_preference || "moderate"}
${getCtaGuidance(preferences.call_to_action_preference)}`);
    }

    // Combine all context with clear instructions
    if (contextParts.length > 0) {
      enhancedSystemInstruction = `${systemInstruction}

═══════════════════════════════════════════════════════════
📋 USER PROFILE & CONTENT GUIDELINES
═══════════════════════════════════════════════════════════

${contextParts.join("\n\n")}

═══════════════════════════════════════════════════════════
🎨 CONTENT CREATION INSTRUCTIONS
═══════════════════════════════════════════════════════════

1. STRICTLY FOLLOW the brand voice, tone, and style guidelines above
2. NATURALLY INTEGRATE strategic keywords without forcing them
3. SELECT appropriate hashtags from the preferred list (if provided)
4. NEVER mention or reference any avoided topics
5. MATCH the specified creativity level, length, emoji usage, and CTA style
6. CREATE content that resonates with the target audience
7. ENSURE authenticity - sound like the brand, not a generic AI

Remember: Your goal is to create content that perfectly embodies this brand's unique voice and connects with their specific audience.`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const lengthConstraint = `Max with ${MAX_LENGTH_CONTENT} char length.`;

    const result = await model.generateContent([
      enhancedSystemInstruction,
      "LANGUAGE RULE: Detect the language of the 'User Input'. Generate content in the EXACT SAME language.",
      "OUTPUT FORMAT: Generate ONLY the final content. No explanations, no variations, no conversational filler. Just the polished, ready-to-post content.",
      lengthConstraint,
      `Platform: ${platform}`,
      `User Input: ${prompt}\n\nGenerated Content:`,
    ]);

    const response = result.response;
    const text = response.text();

    // Credit deduction removed from generation

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content", rawError: error },
      { status: 500 },
    );
  }
}
