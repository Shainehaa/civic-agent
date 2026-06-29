"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import IssueCard from "@/components/IssueCard";
import { getAllIssues, isOverdue } from "@/services/issueService";
import { CivicIssue, IssueStatus } from "@/types";

// Leaflet needs `window`, which doesn't exist during server rendering.
// dynamic(..., { ssr: false }) tells Next.js to only load this component
// in the browser, never attempt it on the server.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
      Loading map...
    </div>
  ),
});

type FilterValue = "All" | IssueStatus;
type ViewMode = "list" | "map";

const FILTERS: FilterValue[] = ["All", "Open", "In Progress", "Resolved"];

export default function DashboardPage() {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [filter, setFilter] = useState<FilterValue>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllIssues()
      .then(setIssues)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load issues.")
      )
      .finally(() => setIsLoading(false));
  }, []);

  const filteredIssues = useMemo(() => {
    if (filter === "All") return issues;
    return issues.filter((issue) => issue.status === filter);
  }, [issues, filter]);

  // A quick at-a-glance accountability number: how many open/in-progress
  // issues have blown past their SLA deadline.
  const overdueCount = useMemo(
    () => issues.filter(isOverdue).length,
    [issues]
  );

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-zinc-50 px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Community dashboard
          </h1>
          <Link
            href="/report"
            className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700"
          >
            Report an issue
          </Link>
        </div>

        {overdueCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-800">
            {overdueCount} issue{overdueCount === 1 ? "" : "s"} past the
            expected response window.
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-white border border-zinc-200 rounded-full p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                viewMode === "list" ? "bg-zinc-900 text-white" : "text-zinc-600"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                viewMode === "map" ? "bg-zinc-900 text-white" : "text-zinc-600"
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {isLoading && <p className="text-zinc-500">Loading issues...</p>}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!isLoading && !error && filteredIssues.length === 0 && (
          <p className="text-zinc-500">No issues match this filter yet.</p>
        )}

        {!isLoading && !error && filteredIssues.length > 0 && (
          <>
            {viewMode === "list" ? (
              <div className="space-y-3">
                {filteredIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            ) : (
              <div className="h-[500px] rounded-xl overflow-hidden border border-zinc-200">
                <MapView issues={filteredIssues} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
