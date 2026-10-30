import { NextResponse } from "next/server";
import { z } from "zod";
import { retrieve } from "@/lib/retrieval";
import { answerWithGemini } from "@/lib/ai";

export const runtime = "nodejs";
const schema = z.object({ message: z.string().trim().min(1).max(8000) });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Please enter a message (up to 8,000 characters)." }, { status: 400 });
    const message = parsed.data.message;
    const sources = await retrieve(message);
    const aiAnswer = await answerWithGemini(message, sources);
    const answer = aiAnswer ?? (sources.length
      ? `I found relevant information in your knowledge base:\n\n${sources.map(s => `**${s.heading}**\n${s.content}`).join("\n\n")}\n\n*Configure GEMINI_API_KEY and GEMINI_MODEL to enable AI-generated synthesis.*`
      : "I couldn't find a matching answer in your uploaded Markdown documents. Add relevant documents to your Knowledge Base, or configure Gemini to enable general AI responses.");
    return NextResponse.json({
      answer, sources: sources.map(s => ({ documentId: s.documentId, fileName: s.fileName, heading: s.heading })),
      found: sources.length > 0, answerSource: aiAnswer ? "gemini" : "knowledge_base"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}