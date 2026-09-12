import { CheckCircle2, CircleDollarSign, Clock3, FileText, MoreVertical, ShieldCheck, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import StatusBadge from "../components/ui/StatusBadge";
import { errorMessage } from "../lib/api";
import { getMyArticles } from "../services/articleService";
import { getAdminStats } from "../services/adminService";
import { useAuth } from "../context/AuthContext";
export default function DashboardPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState({ allArticles: 0, publishedArticles: 0, submittedArticles: 0, allUsers: 0, pendingPayments: 0, writingArticles: 0 });
  useEffect(() => {
    getMyArticles()
      .then((r) => setArticles(r.data))
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (user?.role === "admin") getAdminStats().then((r) => setAdminStats(r.data)).catch((e) => toast.error(errorMessage(e))); }, [user]);
  const counts = {
    total: articles.length,
    writing: articles.filter((a) =>
      ["writing", "draft", "payment_pending"].includes(a.status),
    ).length,
    submitted: articles.filter((a) =>
      ["submitted", "pending"].includes(a.status),
    ).length,
  };
  if (user?.role === "admin") {
    const displayName = user?.name?.split(" ")[0] || "there";
    const publishedRate = adminStats.allArticles ? Math.round((adminStats.publishedArticles / adminStats.allArticles) * 100) : 0;
    const adminStatusGroups = [
      { label: "Delivered", value: adminStats.publishedArticles, color: "#14b8a6" },
      { label: "In progress", value: adminStats.writingArticles, color: "#f59e0b" },
      { label: "Pending review", value: adminStats.submittedArticles, color: "#8b5cf6" },
    ];
    return (
      <div className="mx-auto max-w-[1440px] pb-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <p className="text-2xl font-bold tracking-tight">Welcome {displayName}! <span aria-hidden="true">👋</span></p>
            <p className="mt-1 text-sm text-slate-500">View your publication operations with just a glance.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm font-semibold">
              <button className="rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm">Overview</button>
              <Link className="px-4 py-2 text-slate-600 hover:text-slate-900" to="/admin/review">Review desk</Link>
              <Link className="px-4 py-2 text-slate-600 hover:text-slate-900" to="/payments">Payments</Link>
            </div>
          </div>
        </header>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {[
            [FileText, "Total articles", adminStats.allArticles, "Publication portfolio", "#14b8a6"],
            [ShieldCheck, "Delivered work", adminStats.publishedArticles, `${publishedRate}% of all articles delivered`, "#f59e0b"],
            [Users, "Total users", adminStats.allUsers, `${adminStats.pendingPayments} payments pending`, "#0ea5e9"],
          ].map(([Icon, label, value, caption, color]) => (
            <div className="card relative overflow-hidden p-5" key={label}>
              <Icon size={21} style={{ color }} />
              <p className="mt-4 text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
              <p className="mt-2 text-xs text-emerald-600">▲ {caption}</p>
              <svg className="absolute bottom-2 right-3 h-20 w-28 opacity-80" viewBox="0 0 120 70" fill="none" aria-hidden="true">
                <path d="M2 61C14 28 19 54 32 39C44 25 48 61 61 39C72 21 79 48 90 25C99 7 107 16 118 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)]">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div><h2 className="text-lg font-bold">Editorial pipeline</h2><p className="mt-1 text-xs text-slate-500">Current publication activity across the platform</p></div>
              <Link className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" to="/admin/review" aria-label="Open review desk"><MoreVertical size={19} /></Link>
            </div>
            <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>Workflow stage</span><span>Articles</span><span>Action</span>
            </div>
            {[
              ["Delivered articles", adminStats.publishedArticles, "View output", "/admin/review", "text-emerald-600"],
              ["Articles in writing", adminStats.writingArticles, "Open queue", "/admin/review", "text-amber-600"],
              ["Pending articles", adminStats.submittedArticles, "Review now", "/admin/review", "text-violet-600"],
            ].map(([label, value, action, route, color]) => (
              <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0" key={label}>
                <div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full bg-current ${color}`} /><span className="text-sm font-semibold">{label}</span></div>
                <span className="text-sm text-slate-600">{value}</span>
                <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700" to={route}>{action} <span aria-hidden="true">→</span></Link>
              </div>
            ))}
          </section>

          <aside className="space-y-5">
            <section className="card p-5">
              <div className="flex items-start justify-between"><div><h2 className="font-bold">Articles by status</h2><p className="mt-1 text-xs text-slate-500">Platform-wide breakdown</p></div><SlidersHorizontal className="text-slate-400" size={17} /></div>
              <div className="mt-6 flex items-center gap-5">
                <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#14b8a6 0 ${adminStats.allArticles ? (adminStats.publishedArticles / adminStats.allArticles) * 100 : 0}%, #f59e0b 0 ${adminStats.allArticles ? ((adminStats.publishedArticles + adminStats.writingArticles) / adminStats.allArticles) * 100 : 0}%, #8b5cf6 0 100%)` }}>
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center"><span className="text-xl font-bold">{adminStats.allArticles}</span><span className="text-[10px] text-slate-500">articles</span></div>
                </div>
                <div className="space-y-3 text-sm">{adminStatusGroups.map((group) => <div className="flex items-center gap-2" key={group.label}><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: group.color }} /><span>{group.label}</span><strong className="ml-auto">{group.value}</strong></div>)}</div>
              </div>
            </section>
            <section className="card bg-sky-50/70 p-5">
              <div className="flex items-start justify-between"><div><h2 className="font-bold">Publication progress</h2><p className="mt-1 text-xs text-slate-500">Across the article pipeline</p></div><Clock3 className="text-sky-600" size={18} /></div>
              <p className="mt-3 text-2xl font-bold">{adminStats.publishedArticles} <span className="text-sm font-medium text-slate-500">of {adminStats.allArticles} delivered</span></p>
              <div className="mt-4 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${publishedRate}%` }} /></div>
              <div className="mt-3 flex justify-between text-xs text-slate-500"><span>{publishedRate}% complete</span><Link className="font-semibold text-blue-600" to="/admin/review">Review queue <span aria-hidden="true">→</span></Link></div>
            </section>
          </aside>
        </div>
      </div>
    );
  }
  const displayName = user?.name?.split(" ")[0] || "there";
  const published = articles.filter((article) => article.status === "delivered").length;
  const completionRate = articles.length ? Math.round((published / articles.length) * 100) : 0;
  const recentArticles = [...articles]
    .sort((firstArticle, secondArticle) => new Date(secondArticle.createdAt) - new Date(firstArticle.createdAt))
    .slice(0, 5);
  const statusGroups = [
    { label: "Delivered", value: published, color: "#14b8a6" },
    { label: "In progress", value: counts.writing, color: "#f59e0b" },
    { label: "Under review", value: counts.submitted, color: "#8b5cf6" },
  ];
  return (
    <div className="mx-auto max-w-[1440px] pb-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <p className="text-2xl font-bold tracking-tight">Welcome {displayName}! <span aria-hidden="true">👋</span></p>
          <p className="mt-1 text-sm text-slate-500">View your publication spending with just a glance.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            <button className="rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm">Overview</button>
            <Link className="px-4 py-2 text-slate-600 hover:text-slate-900" to="/articles/my">My article</Link>
            <Link className="px-4 py-2 text-slate-600 hover:text-slate-900" to="/articles/new">New article</Link>
          </div>
        </div>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {[
          [CircleDollarSign, "Total articles", articles.length, "Your publication portfolio", "#14b8a6"],
          [Sparkles, "Published work", published, `${completionRate}% of your articles delivered`, "#f59e0b"],
          [CheckCircle2, "Completion rate", `${completionRate}%`, `${counts.writing} currently in progress`, "#0ea5e9"],
        ].map(([Icon, label, value, caption, color]) => (
          <div className="card relative overflow-hidden p-5" key={label}>
            <Icon size={21} style={{ color }} />
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
            <p className="mt-2 text-xs text-emerald-600">▲ {caption}</p>
            <svg className="absolute bottom-2 right-3 h-20 w-28 opacity-80" viewBox="0 0 120 70" fill="none" aria-hidden="true">
              <path d="M2 61C14 28 19 54 32 39C44 25 48 61 61 39C72 21 79 48 90 25C99 7 107 16 118 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div><h2 className="text-lg font-bold">Recent articles</h2><p className="mt-1 text-xs text-slate-500">Your latest publication activity</p></div>
            <Link className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" to="/articles/my" aria-label="More article options"><MoreVertical size={19} /></Link>
          </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading your articles...
          </p>
        ) : articles.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-semibold">Your desk is clear</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create your first article to begin the publication process.
            </p>
            <Link className="btn-primary mt-5" to="/articles/new">
              Create article
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[680px] grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_32px] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>Article</span><span>Status</span><span>Created</span><span>Article ID</span><span />
            </div>
            {recentArticles.map((article) => (
              <Link
                to={`/articles/${article.articleId}`}
                className="grid min-w-[680px] grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_32px] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0 hover:bg-slate-50"
                key={article.articleId}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {article.articleTitle ||
                      article.category?.title ||
                      "Untitled article"}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">SEO article publication</p>
                </div>
                <span><StatusBadge status={article.status} /></span>
                <span className="text-sm text-slate-600">{new Date(article.createdAt).toLocaleDateString()}</span>
                <span className="text-xs text-slate-500">{article.articleId}</span>
                <MoreVertical className="text-slate-400" size={17} />
              </Link>
            ))}
          </div>
        )}
      </section>

        <aside className="space-y-5">
          <section className="card p-5">
            <div className="flex items-start justify-between"><div><h2 className="font-bold">Articles by status</h2><p className="mt-1 text-xs text-slate-500">Total portfolio breakdown</p></div><button className="text-slate-400" aria-label="Filter status"><SlidersHorizontal size={17} /></button></div>
            <div className="mt-6 flex items-center gap-5">
              <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#14b8a6 0 ${published ? (published / Math.max(articles.length, 1)) * 100 : 0}%, #f59e0b 0 ${published + counts.writing ? ((published + counts.writing) / Math.max(articles.length, 1)) * 100 : 0}%, #8b5cf6 0 100%)` }}>
                <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center"><span className="text-xl font-bold">{articles.length}</span><span className="text-[10px] text-slate-500">articles</span></div>
              </div>
              <div className="space-y-3 text-sm">{statusGroups.map((group) => <div className="flex items-center gap-2" key={group.label}><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: group.color }} /><span>{group.label}</span><strong className="ml-auto">{group.value}</strong></div>)}</div>
            </div>
          </section>
          <section className="card bg-sky-50/70 p-5">
            <div className="flex items-start justify-between"><div><h2 className="font-bold">Publication progress</h2><p className="mt-1 text-xs text-slate-500">Across your article portfolio</p></div><Clock3 className="text-sky-600" size={18} /></div>
            <p className="mt-3 text-2xl font-bold">{published} <span className="text-sm font-medium text-slate-500">of {articles.length} delivered</span></p>
            <div className="mt-4 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${completionRate}%` }} /></div>
            <div className="mt-3 flex justify-between text-xs text-slate-500"><span>{completionRate}% complete</span><Link className="font-semibold text-blue-600" to="/articles/new">Create article <span aria-hidden="true">→</span></Link></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
