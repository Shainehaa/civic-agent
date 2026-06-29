import Link from "next/link";
import { CivicIssue } from "@/types";
import { isOverdue } from "@/services/issueService";

interface IssueCardProps {
  issue: CivicIssue;
}

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

export default function IssueCard({ issue }: IssueCardProps) {
  const overdue = isOverdue(issue);

  return (
    <Link
      href={`/issue/${issue.id}`}
      className="block bg-white rounded-xl border border-zinc-200 p-4 hover:border-zinc-400 transition-colors"
    >
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={issue.imageBase64}
          alt={issue.issueType}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-zinc-900">{issue.issueType}</span>
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
            {overdue && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                Overdue
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 line-clamp-2">
            {issue.description}
          </p>
          <p className="text-xs text-zinc-400">{issue.department}</p>
        </div>
      </div>
    </Link>
  );
}
