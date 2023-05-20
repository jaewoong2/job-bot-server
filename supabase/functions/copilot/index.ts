import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import cors from "https://deno.land/x/edge_cors/src/cors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://job-bot.site",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const createCompletions = async (data: string) => {
  console.log(data);
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

const PROMPT_WRITE_INTRODUCE = `
# 사용자가 지원서를 보고 문장이 이어지도록, 지원서 작성을 도와주는 자동완성 제공 (30자 제공).
# 제한: 30자의 글자 수만 사용
# 제한: 문장이 반복되지 않도록 할 것
# 제한: 구체적으로 작성 할 것
`;

serve(async (req, ...res) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const maxTokens = body.maxTokens || 120;

    const response = await createCompletions(
      JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: PROMPT_WRITE_INTRODUCE,
          },
          {
            role: "user",
            content: `
            # Question: ${body.title}
            # Job Postion: ${body.position}
            # Answer: ${body.content}
          `,
          },
        ],
        max_tokens: maxTokens,
        temperature: body.temperature * 0.01,
      })
    );

    console.log(response);

    return cors(
      req,
      new Response(
        JSON.stringify({
          ...response.choices[0].message,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      ),
      {
        ...corsHeaders,
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
