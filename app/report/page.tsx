"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadForm from "@/components/UploadForm";
import { saveIssue } from "@/services/issueService";
import { GeminiAnalysis } from "@/types";

// Tracks which "stage" of the flow we're in: still uploading, showing the
// AI's result for confirmation, or actively saving to the database.
type Stage = "upload" | "review" | "saving";

export default function ReportPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("upload");
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  function handleAnalysisComplete(
    result: GeminiAnalysis,
    image: string,
    lat: number,
    lng: number
  ) {
    setAnalysis(result);
    setImageBase64(image);
    setLocation({ lat, lng });
    setStage("review");
  }

  async function handleConfirm() {
    if (!analysis || !location) return;
    setStage("saving");
    setError(null);

    try {
      const id = await saveIssue(
        analysis,
        imageBase64,
        location.lat,
        location.lng
      );
      router.push(`/issue/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save issue.");
      setStage("review");
    }
  }

  const severityColor: Record<string, string> = {
    Low: "bg-green-100 text-green-800",
    Medium: "bg-amber-100 text-amber-800",
    High: "bg-orange-100 text-orange-800",
    Critical: "bg-red-100 text-red-800",
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-zinc-50 px-6 py-12">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Report a civic issue
        </h1>

        {stage === "upload" && (
          <UploadForm onAnalysisComplete={handleAnalysisComplete} />
        )}

        {(stage === "review" || stage === "saving") && analysis && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageBase64}
              alt="Reported issue"
              className="rounded-lg max-h-56 mx-auto"
            />

            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-zinc-900">
                {analysis.issueType}
              </span>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  severityColor[analysis.severity]
                }`}
              >
                {analysis.severity}
              </span>
            </div>

            <p className="text-sm text-zinc-600">{analysis.description}</p>

            <div className="flex justify-between text-sm text-zinc-500 border-t border-zinc-100 pt-3">
              <span>Danger score: {analysis.dangerScore}/10</span>
              <span>{analysis.department}</span>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStage("upload")}
                disabled={stage === "saving"}
                className="flex-1 py-3 rounded-lg border border-zinc-300 font-medium hover:bg-zinc-50 disabled:opacity-50"
              >
                Retake
              </button>
              <button
                onClick={handleConfirm}
                disabled={stage === "saving"}
                className="flex-1 py-3 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-700 disabled:opacity-50"
              >
                {stage === "saving" ? "Submitting..." : "Submit report"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
