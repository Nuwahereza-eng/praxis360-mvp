import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge, PageHero, SLAPill } from "@/components/ui";
import { Icon } from "@/components/icons";
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

  const catCounts = new Map<string, number>();
  for (const i of issues) catCounts.set(i.category, (catCounts.get(i.category) ?? 0) + 1);
  const categories = Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const totalUpvotes = issues.reduce((sum, i) => sum + i._count.upvotes, 0);

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Community voice"
        title="Issues your classmates raised"
        subtitle="Anonymised issues from across the university. Upvote what affects you — the loudest signals reach QA fastest."
        icon={Icon.Community}
        chips={[
          { icon: Icon.Shield, label: "Anonymous" },
          { icon: Icon.Flag, label: `${issues.length} public issues` },
          { icon: Icon.ArrowUp, label: `${totalUpvotes} upvotes total` },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-outline-variant p-0.5 bg-surface-container-lowest">
          <Link
            href="/student/issues/board?sort=top"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              sort === "top" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <Icon.Flame className="w-4 h-4" strokeWidth={2} />
            Top
          </Link>
          <Link
            href="/student/issues/board?sort=recent"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              sort === "recent" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <Icon.Clock className="w-4 h-4" strokeWidth={2} />
            Recent
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href="/student/issues" className="btn-outline text-sm inline-flex items-center gap-1.5">
            <Icon.MyIssues className="w-4 h-4" strokeWidth={2} />
            My issues
          </Link>
          <Link href="/student/issues/new" className="btn-primary text-sm inline-flex items-center gap-1.5">
            <Icon.Plus className="w-4 h-4" strokeWidth={2} />
            Raise an issue
          </Link>
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
        <div className="card-p text-center py-10">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary-container text-primary grid place-items-center mb-3">
            <Icon.Community className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="text-lg font-semibold">No public issues yet</div>
          <div className="text-sm text-on-surface-variant mt-1">
            Be the first — tick <em>Post to the community board</em> when raising an issue.
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((i) => {
          const hasUpvoted = i.upvotes.length > 0;
          return (
            <div key={i.id} id={i.id} className="card-p hover:shadow-md transition">
              <div className="flex gap-4">
                <form action={upvoteIssueAction} className="flex flex-col items-center shrink-0">
                  <input type="hidden" name="issueId" value={i.id} />
                  <button
                    className={`w-14 rounded-lg border py-2 flex flex-col items-center transition ${
                      hasUpvoted
                        ? "border-primary bg-primary-container text-primary font-bold"
                        : "border-outline-variant hover:border-primary hover:bg-surface-container"
                    }`}
                    title={hasUpvoted ? "You upvoted this" : "Upvote"}
                    aria-label={hasUpvoted ? "Remove upvote" : "Upvote"}
                  >
                    <Icon.ArrowUp className="w-5 h-5" strokeWidth={2.5} />
                    <span className="text-sm font-semibold mt-0.5">{i._count.upvotes}</span>
                  </button>
                </form>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-base">{i.title}</div>
                    <Badge className={statusColor(i.status)}>{i.status}</Badge>
                    <SLAPill createdAt={i.createdAt} priority={i.priority} status={i.status} resolvedAt={i.resolvedAt} />
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1 inline-flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Icon.Filter className="w-3 h-3" strokeWidth={2} />
                      {i.category}
                    </span>
                    <span aria-hidden>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon.Departments className="w-3 h-3" strokeWidth={2} />
                      {i.department?.name || "Unrouted"}
                    </span>
                    <span aria-hidden>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon.Calendar className="w-3 h-3" strokeWidth={2} />
                      {fmtDate(i.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm mt-2 line-clamp-3 whitespace-pre-line text-on-surface">{i.description}</p>
                  <div className="text-xs text-on-surface-variant mt-2 inline-flex items-center gap-1">
                    <Icon.Chat className="w-3.5 h-3.5" strokeWidth={2} />
                    {i._count.updates} update{i._count.updates === 1 ? "" : "s"}
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
