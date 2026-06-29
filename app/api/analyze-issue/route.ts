// This is a server-side API route. It runs on the server, NEVER in the
// browser, which is exactly where we want our secret Gemini API key to live.
// The browser calls this route via fetch("/api/analyze-issue"), and this
// route is the only place that actually talks to Gemini.

import { NextRequest, NextResponse } from "next/server";
import { analyzeIssueImage } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    const analysis = await analyzeIssueImage(imageBase64);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("analyze-issue error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image. Please try again." },
      { status: 500 }
    );
  }
}
