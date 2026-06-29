// This file talks to Google's Gemini AI model.
// We send it an image + instructions ("prompt"), and it sends back
// structured JSON we can use directly in our app.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiAnalysis, ResolutionCheck } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Strips "data:image/jpeg;base64," prefix if present, Gemini wants raw base64
function cleanBase64(base64: string): string {
  return base64.includes(",") ? base64.split(",")[1] : base64;
}

function getMimeType(base64: string): string {
  if (base64.startsWith("data:")) {
    const match = base64.match(/data:(.*?);/);
    if (match) return match[1];
  }
  return "image/jpeg"; // sensible default
}

/**
 * Sends a civic issue photo to Gemini and asks it to classify the issue.
 * Returns structured data: type, severity, danger score, description, department.
 */
export async function analyzeIssueImage(
  imageBase64: string
): Promise<GeminiAnalysis> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Analyze this civic issue image (e.g. pothole, broken streetlight, garbage dump, water leak, damaged sidewalk, etc).

Return ONLY valid JSON, no markdown formatting, no backticks, no extra text. Use exactly this shape:
{
  "issueType": "short name of the issue, e.g. Pothole",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "dangerScore": a number from 0 to 10,
  "description": "1-2 sentences describing the issue, its approximate size/scale, and the risk it poses",
  "department": "the most likely responsible government department, e.g. Roads Department, Sanitation Department, Electricity Board, Water Board"
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: getMimeType(imageBase64),
        data: cleanBase64(imageBase64),
      },
    },
  ]);

  const text = result.response.text();
  return parseJsonResponse<GeminiAnalysis>(text);
}

/**
 * Sends a "before" and "after" photo to Gemini and asks it to judge
 * whether the issue has actually been resolved.
 */
export async function compareResolutionImages(
  beforeBase64: string,
  afterBase64: string
): Promise<ResolutionCheck> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Compare these two images of the same civic issue location.
Image 1 is the "before" photo showing the reported issue.
Image 2 is the "after" photo, submitted as proof of repair.

Determine whether the issue visible in image 1 has been resolved in image 2.

Return ONLY valid JSON, no markdown formatting, no backticks, no extra text. Use exactly this shape:
{
  "confidence": a number from 0 to 100 representing how confident you are the issue is resolved,
  "explanation": "1-2 sentences explaining what changed or did not change between the photos",
  "status": "Resolved" | "Not Resolved" | "Unclear"
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: getMimeType(beforeBase64),
        data: cleanBase64(beforeBase64),
      },
    },
    {
      inlineData: {
        mimeType: getMimeType(afterBase64),
        data: cleanBase64(afterBase64),
      },
    },
  ]);

  const text = result.response.text();
  return parseJsonResponse<ResolutionCheck>(text);
}

// Gemini sometimes wraps JSON in ```json ... ``` even when told not to.
// This strips that out before parsing, so we don't crash on a stray code fence.
function parseJsonResponse<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Gemini did not return valid JSON. Raw response: ${text.slice(0, 200)}`
    );
  }
}
