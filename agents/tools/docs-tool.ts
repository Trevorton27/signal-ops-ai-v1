import { embedText } from "@/lib/embeddings";
import { searchKnowledge } from "@/lib/vector-search";
import { rerankChunks } from "@/lib/reranker";
import type { KnowledgeChunk } from "../state";

export async function searchDocs(query: string, topK = 5): Promise<KnowledgeChunk[]> {
  const embedding = await embedText(query);

  // Phase 4: Fetch more candidates (15) and rerank to get better top-5
  const candidates = await searchKnowledge(embedding, Math.max(topK * 3, 15));
  const candidateChunks: KnowledgeChunk[] = candidates.map((r) => ({
    id: r.id,
    sourcePath: r.sourcePath,
    chunkIndex: r.chunkIndex,
    content: r.content,
    similarity: r.similarity,
  }));

  // Rerank via HuggingFace cross-encoder (falls back to original order if key absent)
  const reranked = await rerankChunks(query, candidateChunks);

  return reranked.slice(0, topK);
}
