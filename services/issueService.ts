// This file handles all reading/writing to Firestore for civic issues.
// Keeping this logic separate from the UI components makes it reusable
// and easier to test.

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CivicIssue, GeminiAnalysis, Severity, StatusChange } from "@/types";

const ISSUES_COLLECTION = "issues";

// How long each severity level gets before it's considered "overdue".
// This is what makes the dashboard feel accountable without needing
// any background job or scheduled function — we just compute it on read.
const SLA_HOURS: Record<Severity, number> = {
  Critical: 48,
  High: 168, // 7 days
  Medium: 336, // 14 days
  Low: 720, // 30 days
};

function computeSlaDeadline(severity: Severity, createdAt: number): number {
  const hours = SLA_HOURS[severity];
  return createdAt + hours * 60 * 60 * 1000;
}

/**
 * Saves a newly analyzed issue to Firestore.
 * Computes the SLA deadline at write time based on severity.
 *
 * Wrapped with a timeout: if the Firestore write doesn't resolve within
 * 10 seconds, we throw a clear error instead of leaving the UI stuck on
 * a spinner forever with no feedback. This also helps surface what's
 * actually going wrong (e.g. blocked network request, hung connection)
 * since some Firestore failure modes don't reject cleanly.
 */
export async function saveIssue(
  analysis: GeminiAnalysis,
  imageBase64: string,
  latitude: number,
  longitude: number
): Promise<string> {
  const createdAt = Date.now();

  const initialChange: StatusChange = {
    status: "Open",
    changedAt: createdAt,
    source: "citizen",
    note: "Reported by citizen",
  };

  const issueData = {
    ...analysis,
    status: "Open" as const,
    imageBase64,
    latitude,
    longitude,
    createdAt,
    slaDeadline: computeSlaDeadline(analysis.severity, createdAt),
    statusHistory: [initialChange],
  };

  const writePromise = addDoc(collection(db, ISSUES_COLLECTION), issueData);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () =>
        reject(
          new Error(
            "Saving timed out after 10 seconds. This usually means the browser couldn't reach Firestore — check your network connection or Firestore configuration."
          )
        ),
      10000
    );
  });

  const docRef = await Promise.race([writePromise, timeoutPromise]);
  return docRef.id;
}

/**
 * Fetches all issues, newest first.
 */
export async function getAllIssues(): Promise<CivicIssue[]> {
  const q = query(collection(db, ISSUES_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CivicIssue);
}

/**
 * Fetches a single issue by its Firestore document ID.
 */
export async function getIssueById(id: string): Promise<CivicIssue | null> {
  const docRef = doc(db, ISSUES_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as CivicIssue;
}

/**
 * Manually updates an issue's status (e.g. a citizen marking it
 * "In Progress" after seeing repair crews on site). Every change is
 * appended to statusHistory rather than overwriting it, so the full
 * timeline stays visible for transparency.
 */
export async function updateIssueStatus(
  id: string,
  status: CivicIssue["status"]
): Promise<void> {
  const docRef = doc(db, ISSUES_COLLECTION, id);
  const change: StatusChange = {
    status,
    changedAt: Date.now(),
    source: "citizen",
    note: "Manually updated by a citizen",
  };
  await updateDoc(docRef, {
    status,
    statusHistory: arrayUnion(change),
  });
}

/**
 * Saves the resolution verification result onto an existing issue.
 * Logged as an "ai-verification" sourced change, distinct from manual
 * citizen updates, so the audit trail shows exactly how each status
 * change happened.
 */
export async function saveResolutionResult(
  id: string,
  resolutionImageBase64: string,
  confidence: number,
  isResolved: boolean
): Promise<void> {
  const docRef = doc(db, ISSUES_COLLECTION, id);
  const newStatus: CivicIssue["status"] = isResolved
    ? "Resolved"
    : "In Progress";
  const change: StatusChange = {
    status: newStatus,
    changedAt: Date.now(),
    source: "ai-verification",
    note: `Resolution confidence: ${confidence}%`,
  };
  await updateDoc(docRef, {
    resolutionImageBase64,
    resolutionConfidence: confidence,
    resolvedAt: Date.now(),
    status: newStatus,
    statusHistory: arrayUnion(change),
  });
}

/**
 * Returns true if an open issue has passed its SLA deadline.
 * This is the "accountability" signal shown on the dashboard —
 * computed live on every read, no scheduled job required.
 */
export function isOverdue(issue: CivicIssue): boolean {
  if (issue.status === "Resolved") return false;
  return Date.now() > issue.slaDeadline;
}
