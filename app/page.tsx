import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center bg-zinc-50 px-6">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Civic Agent
        </h1>
        <p className="text-lg text-zinc-600">
          Report a civic issue with one photo. AI identifies it, rates its
          severity, writes the report, and tracks it until it&apos;s resolved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/report"
            className="px-6 py-3 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors"
          >
            Report an issue
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg border border-zinc-300 text-zinc-900 font-medium hover:bg-zinc-100 transition-colors"
          >
            View dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
