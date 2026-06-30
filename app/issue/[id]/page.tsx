"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  getIssueById,
  saveResolutionResult,
  updateIssueStatus,
} from "@/services/issueService";
import { CivicIssue, IssueStatus, ResolutionCheck } from "@/types";
import { fileToCompressedBase64 } from "@/lib/imageCompression";

const severityColor: Record<string, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
};

const statusColor: Record<string, string> = {
  Open: "bg-zinc-100 text-zinc-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
};

export default function IssueDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [issue, setIssue] = useState<CivicIssue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // State specifically for the resolution-verification flow
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [result, setResult] = useState<ResolutionCheck | null>(null);

  // State for manually changing the status (the citizen-driven update path)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    getIssueById(id)
      .then((data) => {
        if (!data) {
          setLoadError("Issue not found.");
        } else {
          setIssue(data);
        }
      })
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Failed to load issue.")
      )
      .finally(() => setIsLoading(false));
  }, [id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      fileToCompressedBase64(file)
        .then(setAfterImage)
        .catch(() =>
          setVerifyError("Could not process that image. Please try a different one.")
        );
    },
  });

  async function handleVerify() {
    if (!issue || !afterImage) return;
    setIsVerifying(true);
    setVerifyError(null);

    try {
      const response = await fetch("/api/verify-resolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beforeBase64: issue.imageBase64,
          afterBase64: afterImage,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Verification failed");
      }

      const check: ResolutionCheck = await response.json();
      setResult(check);

      const isResolved = check.status === "Resolved" && check.confidence >= 70;
      await saveResolutionResult(
        issue.id,
        afterImage,
        check.confidence,
        isResolved
      );

      // Reflect the update locally without needing to refetch
      setIssue({
        ...issue,
        resolutionImageBase64: afterImage,
        resolutionConfidence: check.confidence,
        resolvedAt: Date.now(),
        status: isResolved ? "Resolved" : "In Progress",
      });
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleStatusChange(newStatus: IssueStatus) {
    if (!issue || newStatus === issue.status) return;
    setIsUpdatingStatus(true);
    setStatusError(null);

    try {
      await updateIssueStatus(issue.id, newStatus);
      // Reflect the change locally, including a new audit trail entry,
      // so the page updates instantly without needing a refetch.
      setIssue({
        ...issue,
        status: newStatus,
        statusHistory: [
          ...(issue.statusHistory ?? []),
          {
            status: newStatus,
            changedAt: Date.now(),
            source: "citizen",
            note: "Manually updated by a citizen",
          },
        ],
      });
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : "Failed to update status."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] bg-zinc-50 px-6 py-12">
        <p className="text-zinc-500 text-center">Loading...</p>
      </main>
    );
  }

  if (loadError || !issue) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] bg-zinc-50 px-6 py-12">
        <p className="text-red-600 text-center">
          {loadError || "Issue not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-zinc-50 px-6 py-12">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={issue.imageBase64}
            alt={issue.issueType}
            className="rounded-lg max-h-64 w-full object-cover"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-medium text-zinc-900">
              {issue.issueType}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                severityColor[issue.severity]
              }`}
            >
              {issue.severity}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                statusColor[issue.status]
              }`}
            >
              {issue.status}
            </span>
          </div>

          <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
            <label className="text-sm text-zinc-500">Update status:</label>
            <select
              value={issue.status}
              disabled={isUpdatingStatus}
              onChange={(e) =>
                handleStatusChange(e.target.value as IssueStatus)
              }
              className="text-sm border border-zinc-300 rounded-lg px-2 py-1 bg-white disabled:opacity-50"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            {isUpdatingStatus && (
              <span className="text-xs text-zinc-400">Saving...</span>
            )}
          </div>
          {statusError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {statusError}
            </p>
          )}

          <p className="text-zinc-600">{issue.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm border-t border-zinc-100 pt-4">
            <div>
              <p className="text-zinc-400">Danger score</p>
              <p className="font-medium text-zinc-900">
                {issue.dangerScore}/10
              </p>
            </div>
            <div>
              <p className="text-zinc-400">Department</p>
              <p className="font-medium text-zinc-900">{issue.department}</p>
            </div>
            <div>
              <p className="text-zinc-400">Location</p>
              <p className="font-medium text-zinc-900">
                {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
              </p>
            </div>
            <div>
              <p className="text-zinc-400">Reported</p>
              <p className="font-medium text-zinc-900">
                {new Date(issue.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {issue.status !== "Resolved" && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <h2 className="font-medium text-zinc-900">
              Upload proof of resolution
            </h2>
            <p className="text-sm text-zinc-500">
              Take a photo of the same location now. The AI will compare it
              against the original report.
            </p>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-300 hover:border-zinc-400"
              }`}
            >
              <input {...getInputProps()} />
              {afterImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={afterImage}
                  alt="After repair"
                  className="max-h-48 mx-auto rounded-lg"
                />
              ) : (
                <p className="text-zinc-500 text-sm">
                  Drag a photo here, or click to choose one
                </p>
              )}
            </div>

            {verifyError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {verifyError}
              </p>
            )}

            <button
              onClick={handleVerify}
              disabled={!afterImage || isVerifying}
              className="w-full py-3 rounded-lg bg-zinc-900 text-white font-medium disabled:bg-zinc-300 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
            >
              {isVerifying ? "Comparing photos..." : "Verify resolution"}
            </button>
          </div>
        )}

        {result && (
          <div
            className={`rounded-xl border p-6 space-y-2 ${
              result.status === "Resolved"
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-900">
                Resolution confidence: {result.confidence}%
              </span>
              <span className="font-medium text-zinc-900">
                {result.status}
              </span>
            </div>
            <p className="text-sm text-zinc-600">{result.explanation}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-3">
          <h2 className="font-medium text-zinc-900">Status history</h2>
          <p className="text-sm text-zinc-500">
            A transparent log of every change to this issue, and how it happened.
          </p>
          <ul className="space-y-2">
            {(issue.statusHistory ?? []).length === 0 && (
              <li className="text-sm text-zinc-400 pt-1">
                No history recorded for this issue yet.
              </li>
            )}
            {(issue.statusHistory ?? [])
              .slice()
              .reverse()
              .map((change, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm border-t border-zinc-100 pt-2"
                >
                  <div>
                    <span className="font-medium text-zinc-900">
                      {change.status}
                    </span>
                    <span className="text-zinc-400 ml-2">
                      {change.source === "ai-verification"
                        ? "verified by AI"
                        : "updated by citizen"}
                    </span>
                    {change.note && (
                      <span className="text-zinc-400 ml-2">
                        — {change.note}
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-400 whitespace-nowrap ml-3">
                    {new Date(change.changedAt).toLocaleString()}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
