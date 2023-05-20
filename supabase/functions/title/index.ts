import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import cors from "https://deno.land/x/edge_cors/src/cors.ts";

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

const GET_PROMPT_TITLE = (job: string) => `
너는 지원서를 읽고 소제목을 만들어주는 GPT야.  
-----
소제목 만드는 방법:
1. 간결하게: 너무 긴 소제목은 읽기 어렵고 복잡하게 만들 수 있으므로, 가능한 한 간결하게 작성하는 것이 좋습니다.
2. 핵심 단어 사용: 소제목에서는 해당 섹션의 중요한 키워드를 활용하는 것이 좋습니다. 이는 독자가 지원서의 중요한 부분을 빠르게 파악할 수 있도록 돕습니다.
-----
해야할 일 : [${job}에 지원하는 지원자가 입력한 지원서를 보고 키워드 를 통한 간결한 소제목 5개 생성]
`;

serve(async (req, ...res) => {
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
            content: GET_PROMPT_TITLE(body.job),
          },
          {
            role: "user",
            content: `
            ${body.content}
          `,
          },
        ],
        max_tokens: maxTokens,
        temperature: body.temperature * 0.01,
      })
    );

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
