// This file defines the "shape" of data we work with throughout the app.
// TypeScript uses these to catch mistakes before you even run the code.

export type Severity = "Low" | "Medium" | "High" | "Critical";

export type IssueStatus = "Open" | "In Progress" | "Resolved";

// What Gemini gives us back after analyzing an uploaded photo
export interface GeminiAnalysis {
  issueType: string;
  severity: Severity;
  dangerScore: number; // 0-10
  description: string;
  department: string;
}

// One entry in an issue's audit trail — who changed the status, when, and how
export type ChangeSource = "citizen" | "ai-verification";

export interface StatusChange {
  status: IssueStatus;
  changedAt: number;
  source: ChangeSource;
  note?: string; // e.g. "Resolution confidence: 92%"
}

// What gets saved to Firestore for each reported issue
export interface CivicIssue {
  id: string;
  issueType: string;
  severity: Severity;
  dangerScore: number;
  description: string;
  department: string;
  status: IssueStatus;
  imageBase64: string; // we store the photo directly as base64 (no Storage bucket needed)
  latitude: number;
  longitude: number;
  createdAt: number; // stored as a timestamp (milliseconds) for easy math
  slaDeadline: number; // computed at creation time based on severity
  resolutionImageBase64?: string;
  resolutionConfidence?: number;
  resolvedAt?: number;
  statusHistory: StatusChange[]; // transparency log of every status change
}

// What Gemini gives us back when comparing before/after photos
export interface ResolutionCheck {
  confidence: number; // 0-100
  explanation: string;
  status: "Resolved" | "Not Resolved" | "Unclear";
}
