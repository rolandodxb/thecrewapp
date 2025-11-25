import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  prompt?: string;
  userId: string;
  messages?: Array<{ role: string; content: string }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const body: RequestBody = await req.json();
    const { prompt, userId, messages } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: userId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!messages && !prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required field: messages or prompt" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured. Please set your OpenAI API key in the Supabase Edge Function secrets."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const chatMessages = messages || [
      {
        role: "system",
        content: "You are a helpful AI assistant for the Emirates Academy platform. Provide clear, concise, and helpful responses.",
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API Error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI service error", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiResult = await openaiResponse.json();
    const outputText = aiResult.choices?.[0]?.message?.content || "No response";
    const tokensUsed = aiResult.usage?.total_tokens || 0;

    const logPrompt = prompt || (messages && messages.length > 0
      ? messages.map(m => `${m.role}: ${m.content}`).join('\n')
      : 'No prompt provided');

    const { error: insertError } = await supabaseClient
      .from("ai_logs")
      .insert({
        user_id: userId,
        prompt: logPrompt,
        response: outputText,
        model: "gpt-4o-mini",
        tokens_used: tokensUsed,
      });

    if (insertError) {
      console.error("Error logging AI request:", insertError);
    }

    return new Response(
      JSON.stringify({
        output_text: outputText,
        message: outputText,
        response: outputText,
        tokens_used: tokensUsed,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});