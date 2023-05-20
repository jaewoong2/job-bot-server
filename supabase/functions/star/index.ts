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

const PROMPT_WRITE_STAR =
  "First. consider you are junior applicant for some position in korea.\n I will send you an experience written in the STAR technique.\n Then, you reconstruct the contents written with the STAR technique in the following way. okay? and write by korean.\n \n ``` \n [A title of 10 characters or less that is important for the experience]\n [Write around 700 words about the motivation and strengths of applying for the job based on the experience] \n ```\n \n When writing, please write about the competencies that are important to the job and write the competency-centered based on your experience that you have those competencies.\n \n Overall, only use Based on the experience written in the STAR method, write about minimum 700 words about the motivation and strengths of applying, and describe the competencies required for the job, focusing on the experience that you have such competencies. ok?";

serve(async (req) => {
  try {
    const body = await req.json();
    const maxTokens = body.maxTokens ?? 1224;

    const response = await createCompletions(
      JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: PROMPT_WRITE_STAR,
          },
          {
            role: "user",
            content: `
            Situation: ${body.situation}
            Task: ${body.task}
            Action: ${body.action}
            Result: ${body.result}
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
        origin: "https://job-bot.site",
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
