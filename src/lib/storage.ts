import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type DocumentRecord = {
  id: string; name: string; storedName: string; uploadedAt: string; size: number;
};

const root = path.join(process.cwd(), "data");
const docsDir = path.join(root, "documents");
const indexPath = path.join(root, "documents.json");

export async function ensureStorage() {
  await fs.mkdir(docsDir, { recursive: true });
  try { await fs.access(indexPath); } catch { await fs.writeFile(indexPath, "[]", "utf8"); }
}
export async function listDocuments(): Promise<DocumentRecord[]> {
  await ensureStorage();
  try { return JSON.parse(await fs.readFile(indexPath, "utf8")) as DocumentRecord[]; }
  catch { return []; }
}
async function saveDocuments(docs: DocumentRecord[]) {
  await fs.writeFile(indexPath, JSON.stringify(docs, null, 2), "utf8");
}
export async function addDocument(name: string, content: string, size: number) {
  await ensureStorage();
  const id = crypto.randomUUID();
  const storedName = `${id}.md`;
  await fs.writeFile(path.join(docsDir, storedName), content, "utf8");
  const docs = await listDocuments();
  const record = { id, name, storedName, uploadedAt: new Date().toISOString(), size };
  docs.unshift(record);
  await saveDocuments(docs);
  return record;
}
export async function readDocument(doc: DocumentRecord) {
  await ensureStorage();
  return fs.readFile(path.join(docsDir, doc.storedName), "utf8");
}
export async function deleteDocument(id: string) {
  const docs = await listDocuments();
  const target = docs.find(d => d.id === id);
  if (!target) return false;
  await fs.rm(path.join(docsDir, target.storedName), { force: true });
  await saveDocuments(docs.filter(d => d.id !== id));
  return true;
}