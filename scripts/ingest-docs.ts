import { PrismaClient } from "@prisma/client";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const KNOWLEDGE_BASE_DIR = join(process.cwd(), "knowledge-base");
const CHUNK_SIZE = 500; // approximate tokens (~2000 chars)

function chunkText(text: string, chunkSize = 2000): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + para).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, " "),
  });
  return response.data[0].embedding;
}

async function main() {
  const files = getAllMarkdownFiles(KNOWLEDGE_BASE_DIR);
  console.log(`Found ${files.length} markdown files`);

  let totalChunks = 0;

  for (const filePath of files) {
    const sourcePath = relative(process.cwd(), filePath);
    const content = readFileSync(filePath, "utf-8");
    const chunks = chunkText(content);

    console.log(`  Processing ${sourcePath} → ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embedText(chunk);
      const vectorStr = `[${embedding.join(",")}]`;

      // Upsert using raw query to handle pgvector type
      await prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" (id, "sourcePath", "chunkIndex", content, embedding, "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${sourcePath},
          ${i},
          ${chunk},
          ${vectorStr}::vector,
          NOW()
        )
        ON CONFLICT ("sourcePath", "chunkIndex")
        DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding
      `;

      totalChunks++;
    }
  }

  console.log(`\nIngested ${totalChunks} chunks from ${files.length} files`);
}

main()
  .catch((e) => {
    console.error("Ingest failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
