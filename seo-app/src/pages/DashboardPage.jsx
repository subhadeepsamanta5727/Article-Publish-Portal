import { FilePlus2, FileText, MessageSquare, PenLine, Receipt, Send, ShieldCheck, Users } from "lucide-react";
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
    const cards = [[FileText, "All articles", adminStats.allArticles], [ShieldCheck, "Delivered articles", adminStats.publishedArticles], [MessageSquare, "Pending articles", adminStats.submittedArticles], [Users, "All users", adminStats.allUsers], [Receipt, "Pending payments", adminStats.pendingPayments], [PenLine, "Articles in writing", adminStats.writingArticles]];
    return <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold text-blue-600">ADMINISTRATION</p><h1 className="mt-1 text-3xl font-bold">Dashboard</h1><p className="mt-2 text-slate-500">Overview of articles, users, payments, and editorial progress.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([Icon, label, value]) => <div className="card p-5" key={label}><Icon className="text-blue-600" size={21} /><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold text-blue-700">{value}</p></div>)}</div></div>;
  }
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            AUTHOR WORKSPACE
          </p>
          <h1 className="mt-1 text-3xl font-bold">Your articles</h1>
          <p className="mt-2 text-slate-500">
            Manage every step of your publication.
          </p>
        </div>
        <Link className="btn-primary" to="/articles/new">
          <FilePlus2 size={18} />
          New article
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          [FileText, counts.total, "All articles"],
          [PenLine, counts.writing, "In progress"],
          [Send, counts.submitted, "Under review"],
        ].map(([Icon, count, label]) => (
          <div className="card p-5" key={label}>
            <Icon className="text-indigo-600" size={20} />
            <p className="mt-5 text-3xl font-bold">{count}</p>
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <section className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="font-bold">Recent articles</h2>
          <span className="text-sm text-slate-500">
            {articles.length} total
          </span>
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading your articles…
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
          <div className="divide-y divide-slate-100">
            {articles.map((article) => (
              <Link
                to={`/articles/${article.articleId}`}
                className="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-slate-50"
                key={article.articleId}
              >
                <div>
                  <p className="font-semibold">
                    {article.articleTitle ||
                      article.category?.title ||
                      "Untitled article"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {article.articleId} ·{" "}
                    {new Date(article.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={article.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
