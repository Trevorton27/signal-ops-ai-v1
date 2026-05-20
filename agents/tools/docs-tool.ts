import { embedText } from "@/lib/embeddings";
import { searchKnowledge } from "@/lib/vector-search";
import type { KnowledgeChunk } from "../state";

export async function searchDocs(query: string, topK = 5): Promise<KnowledgeChunk[]> {
  const embedding = await embedText(query);
  const results = await searchKnowledge(embedding, topK);
  return results.map((r) => ({
    id: r.id,
    sourcePath: r.sourcePath,
    chunkIndex: r.chunkIndex,
    content: r.content,
    similarity: r.similarity,
  }));
}
