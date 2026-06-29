// Same idea as analyze-issue: this keeps the Gemini key server-side.
// This route compares the "before" and "after" photos.

import { NextRequest, NextResponse } from "next/server";
import { compareResolutionImages } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { beforeBase64, afterBase64 } = await req.json();

    if (!beforeBase64 || !afterBase64) {
      return NextResponse.json(
        { error: "Both beforeBase64 and afterBase64 are required" },
        { status: 400 }
      );
    }

    const result = await compareResolutionImages(beforeBase64, afterBase64);
    return NextResponse.json(result);
  } catch (error) {
    console.error("verify-resolution error:", error);
    return NextResponse.json(
      { error: "Failed to compare images. Please try again." },
      { status: 500 }
    );
  }
}
