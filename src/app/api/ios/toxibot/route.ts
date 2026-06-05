import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      userProfile?: {
        age?: string;
        conditions?: string;
        medications?: string;
        allergies?: string;
        notes?: string;
        isPremium?: boolean;
      };
      userId?: string;
    };

    const { messages, userProfile, userId } = body;
    if (!messages?.length) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400, headers: CORS_HEADERS });
    }

    const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "API key not set" }, { status: 503, headers: CORS_HEADERS });
    }

    // Check and update message limits for non-premium users
    if (userId && !userProfile?.isPremium) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('toxibot_messages_today, toxibot_last_reset, is_premium')
        .eq('id', userId)
        .single();

      if (profile) {
        const today = new Date().toISOString().split('T')[0];
        const lastReset = profile.toxibot_last_reset;
        const messagesUsed = lastReset === today ? (profile.toxibot_messages_today ?? 0) : 0;

        if (messagesUsed >= 3 && !profile.is_premium) {
          return NextResponse.json(
            { error: "daily_limit_reached", messagesUsed: 3, limit: 3 },
            { status: 429, headers: CORS_HEADERS }
          );
        }

        // Increment counter
        await supabase
          .from('profiles')
          .update({
            toxibot_messages_today: messagesUsed + 1,
            toxibot_last_reset: today,
          })
          .eq('id', userId);
      }
    }

    // Build system prompt with health profile context
    const profileContext = userProfile ? [
      userProfile.age ? `Age: ${userProfile.age}` : null,
      userProfile.conditions ? `Medical conditions: ${userProfile.conditions}` : null,
      userProfile.medications ? `Current medications: ${userProfile.medications}` : null,
      userProfile.allergies ? `Allergies: ${userProfile.allergies}` : null,
      userProfile.notes ? `Personal notes: ${userProfile.notes}` : null,
    ].filter(Boolean).join('\n') : '';

    const systemPrompt = `You are ToxiBot, a friendly and knowledgeable AI assistant for ToxiClear AI, a medication safety platform. You help users understand drug interactions, pharmacology, and medication safety.

Your personality:
- Warm, approachable, and encouraging
- Use plain English, avoid unnecessary jargon
- Be conversational but accurate
- Use emojis sparingly to keep things friendly (1-2 per response max)

Your capabilities:
- Answer questions about drug interactions, side effects, pharmacology
- Explain medical concepts at any level (basic to pre-med)
- Help users understand their medications
- Suggest they use ToxiClear AI's Check or Learn features for specific interaction checks
- Reference the user's health profile when relevant

Your limits:
- NEVER diagnose conditions
- NEVER tell users to stop or change their medications without consulting a doctor
- ALWAYS recommend consulting a healthcare professional for personal medical decisions
- Do NOT trigger interaction checks yourself — suggest the user use the Check tab instead

${profileContext ? `User's health profile:\n${profileContext}` : ''}

Always end responses that touch on personal health decisions with a brief disclaimer to consult a healthcare professional.`;

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite-preview-06-17",
      systemInstruction: systemPrompt,
    });

    // Convert messages to Gemini format
    const historyMessages = messages.slice(0, -1);
    // Gemini requires history to start with a user message — drop leading assistant messages
    const firstUserIndex = historyMessages.findIndex(m => m.role === 'user');
    const trimmedHistory = firstUserIndex > 0 ? historyMessages.slice(firstUserIndex) : historyMessages;
    const geminiHistory = trimmedHistory.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
    });

    const result = await chat.sendMessage(lastMessage.content);
    const responseText = result.response.text();

    return NextResponse.json({ response: responseText }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[toxibot]", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
