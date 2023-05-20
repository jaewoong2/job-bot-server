// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://job-bot.site",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const createCompletions = async (data: string) => {
  const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
    body: data,
    headers: {
      Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return response.json();
};

const GET_PROMPT_FEEDBACK = (keyword: string = "content`s context") =>
  `Please answer in Korean.\n\nRead the job application and provide feedback in 1000 words or less with great detail on what needs to be corrected.\n\nI want "${keyword}" feedback.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const maxTokens = body.maxTokens ?? 1224;

    const response = await createCompletions(
      JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: GET_PROMPT_FEEDBACK(body.keyword),
          },
          {
            role: "user",
            content: `${body.feedback}`,
          },
        ],
        max_tokens: maxTokens,
        temperature: body.temperature * 0.01,
      })
    );

    return new Response(
      JSON.stringify({
        ...response.choices[0].message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
