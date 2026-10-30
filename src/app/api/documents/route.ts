import { NextResponse } from "next/server";
import { z } from "zod";
import { addDocument, deleteDocument, listDocuments } from "@/lib/storage";

export const runtime = "nodejs";
const MAX_SIZE = 2 * 1024 * 1024;

export async function GET() {
  return NextResponse.json({ documents: await listDocuments() });
}
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a Markdown file." }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".md")) return NextResponse.json({ error: "Only .md files are supported." }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File must be 2 MB or smaller." }, { status: 413 });
    const content = await file.text();
    if (!content.trim()) return NextResponse.json({ error: "The Markdown file is empty." }, { status: 400 });
    if (content.includes("\0")) return NextResponse.json({ error: "Invalid text file." }, { status: 400 });
    const safeName = file.name.replace(/[\\/]/g, "_").replace(/[^\w.\- ]/g, "").slice(0, 120) || "document.md";
    const document = await addDocument(safeName, content, file.size);
    return NextResponse.json({ document }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save the document." }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  const valid = z.string().uuid().safeParse(id);
  if (!valid.success) return NextResponse.json({ error: "Invalid document ID." }, { status: 400 });
  const deleted = await deleteDocument(valid.data);
  return deleted ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Document not found." }, { status: 404 });
}