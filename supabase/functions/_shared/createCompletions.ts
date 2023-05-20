export const createCompletions = async (data: string) => {
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
