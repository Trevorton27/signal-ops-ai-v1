import OpenAI from "openai";
import { getEnv } from "./env";

let _client: OpenAI | null = null;

function getClient() {
  if (!_client) {
    _client = new OpenAI({ apiKey: getEnv().OPENAI_API_KEY });
  }
  return _client;
}

export async function embedText(text: string): Promise<number[]> {
  const client = getClient();
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, " "),
  });
  return response.data[0].embedding;
}
