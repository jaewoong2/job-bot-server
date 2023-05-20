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

const GET_PROMPT_WRITE_INTRODUCE = (job: string) => `
Provide users with ratings and feedback on ${job} of job applications based on the following criteria. Don't give scores easily. Do score the score tightly.
#  Identify the key competencies of ${job} and assess whether they appear well in the application. (up to 30 points)
## if don't have express any experience about ${job}'s competencies, minus 10 points
# Evaluate whether your job application is organized specifically and systematically. (up to 30 points)
## if do not written in detail, minus 10 points
#  Evaluate whether your job application don't contains any grammatical errors and follows the correct spelling and grammar rules. (up to 20 points)
## single error minus 5 points
# Evaluate whether the job application is written in context of the text. (up to 20 points)
And you should answer in Korean and don't write the title.
Show Total Score.
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
            content: GET_PROMPT_WRITE_INTRODUCE(body.job),
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
