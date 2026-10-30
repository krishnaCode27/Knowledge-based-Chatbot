import { listDocuments, readDocument } from "./storage";

export type SourceChunk = { documentId: string; fileName: string; heading: string; content: string; score: number };

function chunksFromMarkdown(text: string, docId: string, fileName: string): SourceChunk[] {
  const lines = text.split(/\r?\n/);
  let heading = "Introduction";
  let buffer: string[] = [];
  const chunks: SourceChunk[] = [];
  const flush = () => {
    const content = buffer.join("\n").trim();
    if (content) chunks.push({ documentId: docId, fileName, heading, content, score: 0 });
    buffer = [];
  };
  for (const line of lines) {
    const h = line.match(/^#{1,6}\s+(.+)/);
    if (h) { flush(); heading = h[1].trim(); }
    else {
      buffer.push(line);
      if (buffer.join("\n").length > 1100) flush();
    }
  }
  flush();
  return chunks;
}
export async function retrieve(query: string, limit = 5): Promise<SourceChunk[]> {
  const docs = await listDocuments();
  const terms = query.toLowerCase().match(/[a-z0-9]{2,}/g) ?? [];
  if (!terms.length) return [];
  const results: SourceChunk[] = [];
  for (const doc of docs) {
    const text = await readDocument(doc);
    for (const chunk of chunksFromMarkdown(text, doc.id, doc.name)) {
      const haystack = `${chunk.heading} ${chunk.content}`.toLowerCase();
      const hits = terms.reduce((n, term) => n + (haystack.includes(term) ? 1 : 0), 0);
      const phraseBonus = haystack.includes(query.toLowerCase()) ? 2 : 0;
      const score = hits / terms.length + phraseBonus;
      if (score > 0) results.push({ ...chunk, score });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}