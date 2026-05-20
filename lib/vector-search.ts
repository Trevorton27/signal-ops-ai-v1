import { prisma } from "./db";

export interface KnowledgeChunkResult {
  id: string;
  sourcePath: string;
  chunkIndex: number;
  content: string;
  similarity: number;
}

export async function searchKnowledge(
  embedding: number[],
  topK = 5
): Promise<KnowledgeChunkResult[]> {
  const vectorStr = `[${embedding.join(",")}]`;

  const results = await prisma.$queryRaw<KnowledgeChunkResult[]>`
    SELECT
      id,
      "sourcePath",
      "chunkIndex",
      content,
      1 - (embedding <=> ${vectorStr}::vector) AS similarity
    FROM "KnowledgeChunk"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${topK}
  `;

  return results;
}
