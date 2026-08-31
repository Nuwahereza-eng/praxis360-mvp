import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge, SLAPill } from "@/components/ui";
import { fmtDate, statusColor } from "@/lib/utils";
import { upvoteIssueAction } from "../new/actions";

export default async function CommunityBoard({
  searchParams,
}: {
  searchParams?: { sort?: string; category?: string };
}) {
  const s = await requireRole("STUDENT");
  const sort = searchParams?.sort === "recent" ? "recent" : "top";

  const issues = await prisma.issue.findMany({
    where: {
      isPublic: true,
      ...(searchParams?.category ? { category: searchParams.category } : {}),
    },
    include: {
      department: true,
      _count: { select: { upvotes: true, updates: true } },
      upvotes: { where: { userId: s.sub }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const sorted = sort === "top"
    ? [...issues].sort((a, b) => b._count.upvotes - a._count.upvotes)
    : issues;

  // Category chips
  const catCounts = new Map<string, number>();
  for (const i of issues) catCounts.set(i.category, (catCounts.get(i.category) ?? 0) + 1);
  const categories = Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const totalUpvotes = issues.reduce((sum, i) => sum + i._count.upvotes, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-primary via-primary to-secondary text-on-primary shadow-card">
        <div className="text-xs uppercase tracking-widest opacity-90 font-semibold">📢 Community Voice</div>
        <h1 className="text-2xl font-bold mt-1">Issues your classmates raised</h1>
        <p className="text-sm opacity-90 mt-1">
          Anonymised issues from across the university. Upvote what affects you — the loudest signals reach QA fastest.
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">🔒 Anonymous</span>
          <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">{issues.length} public issues</span>
          <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">▲ {totalUpvotes} upvotes total</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Link
            href="/student/issues/board?sort=top"
            className={`btn text-sm ${sort === "top" ? "btn-primary" : "btn-outline"}`}
          >
            🔥 Top
          </Link>
          <Link
            href="/student/issues/board?sort=recent"
            className={`btn text-sm ${sort === "recent" ? "btn-primary" : "btn-outline"}`}
          >
            🆕 Recent
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href="/student/issues" className="btn-outline text-sm">My issues</Link>
          <Link href="/student/issues/new" className="btn-primary text-sm">+ Raise an issue</Link>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/student/issues/board?sort=${sort}`}
            className={`badge ${!searchParams?.category ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
          >
            All
          </Link>
          {categories.map(([cat, n]) => (
            <Link
              key={cat}
              href={`/student/issues/board?sort=${sort}&category=${encodeURIComponent(cat)}`}
              className={`badge ${searchParams?.category === cat ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
            >
              {cat} ({n})
            </Link>
          ))}
        </div>
      )}

      {issues.length === 0 && (
        <div className="card-p text-center">
          <div className="text-lg font-semibold">No public issues yet.</div>
          <div className="text-sm text-on-surface-variant mt-1">
            Be the first — tick <em>Post to the community board</em> when raising an issue.
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((i) => {
          const hasUpvoted = i.upvotes.length > 0;
          return (
            <div key={i.id} id={i.id} className="card-p">
              <div className="flex gap-4">
                {/* Upvote column */}
                <form action={upvoteIssueAction} className="flex flex-col items-center shrink-0">
                  <input type="hidden" name="issueId" value={i.id} />
                  <button
                    className={`w-12 rounded-lg border py-2 flex flex-col items-center ${
                      hasUpvoted
                        ? "border-primary bg-primary-container text-primary font-bold"
                        : "border-outline-variant hover:bg-surface-container"
                    }`}
                    title={hasUpvoted ? "You upvoted this" : "Upvote"}
                  >
                    <span className="text-lg leading-none">▲</span>
                    <span className="text-sm font-semibold mt-0.5">{i._count.upvotes}</span>
                  </button>
                </form>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-base">{i.title}</div>
                    <Badge className={statusColor(i.status)}>{i.status}</Badge>
                    <SLAPill createdAt={i.createdAt} priority={i.priority} status={i.status} resolvedAt={i.resolvedAt} />
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    {i.category} • {i.department?.name || "Unrouted"} • Raised {fmtDate(i.createdAt)}
                  </div>
                  <p className="text-sm mt-2 line-clamp-3 whitespace-pre-line">{i.description}</p>
                  <div className="text-xs text-on-surface-variant mt-2">
                    💬 {i._count.updates} update{i._count.updates === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
