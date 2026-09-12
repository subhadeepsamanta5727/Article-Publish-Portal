import { Download, Eye, FileText, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { errorMessage } from "../lib/api";
import { downloadRemotePdf } from "../lib/pdfActions";
import { downloadArticlePdf, getMyArticles } from "../services/articleService";

export default function UserArticlesPage({ mode }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    getMyArticles()
      .then((r) => setArticles(r.data || []))
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  const scopedArticles = articles.filter((article) =>
    mode === "draft"
      ? ["draft", "writing", "payment_pending"].includes(article.status)
      : true,
  );
  const visible = scopedArticles.filter((article) => {
    if (mode === "my" && filter === "delivered") return article.status === "delivered";
    if (mode === "my" && filter === "pending") return ["submitted", "pending"].includes(article.status);
    if (mode === "my" && filter === "failed") return ["Failed", "failed"].includes(article.status);
    if (filter === "writing") return ["writing", "draft"].includes(article.status);
    if (filter === "payment_pending") return article.status === "payment_pending";
    return true;
  });
  const tabs = mode === "my"
    ? [["all", "My article"], ["delivered", "Delivered"], ["pending", "Pending"], ["failed", "Failed"]]
    : [["all", "All drafts"], ["writing", "Writing (in progress)"], ["payment_pending", "Payment pending"]];
  const download = async (id) => {
    try {
      const blob = await downloadArticlePdf(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const downloadAttachedPdf = async (article) => {
    try {
      await downloadRemotePdf(article.articlePdfUrl, `${article.articleId}-attached.pdf`);
      toast.success("Attached PDF download started");
    } catch (e) {
      toast.error(e.message || "Unable to download attached PDF");
    }
  };
  const statusLabel = (status) => {
    const labels = {
      draft: "Draft",
      payment_pending: "Payment pending",
      writing: "Writing",
      submitted: "Submitted",
      pending: "Pending",
      delivered: "Delivered",
      Failed: "Failed",
    };
    const colors = {
      draft: "bg-slate-500",
      payment_pending: "bg-amber-500",
      writing: "bg-blue-500",
      submitted: "bg-violet-500",
      pending: "bg-violet-500",
      delivered: "bg-emerald-500",
      Failed: "bg-rose-500",
    };
    return [labels[status] || status, colors[status] || "bg-slate-500"];
  };
  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-2">
        <div>
          <p className="text-sm font-semibold text-blue-600">AUTHOR WORKSPACE</p>
          <h1 className="mt-1 text-3xl font-bold">{mode === "draft" ? "Draft articles" : "My articles"}</h1>
        </div>
        <p className="pb-1 text-sm text-slate-500">{visible.length} article{visible.length === 1 ? "" : "s"}</p>
      </div>
      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 pt-1">
          {tabs.map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className={`relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition ${filter === value ? "text-blue-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
              {label}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading articles...
          </p>
        ) : !visible.length ? (
          <p className="p-10 text-center text-sm text-slate-500">No articles found for this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[820px] grid-cols-[1.15fr_0.9fr_1.65fr_1.1fr_0.8fr_80px] items-center gap-3 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Article ID</span><span>Created</span><span>Article</span><span>Status</span><span>Attached PDF</span><span>Actions</span>
            </div>
            {visible.map((article) => (
              <div
                className="grid min-w-[820px] grid-cols-[1.15fr_0.9fr_1.65fr_1.1fr_0.8fr_80px] items-center gap-3 whitespace-nowrap border-b border-slate-200 px-4 py-3 last:border-0 hover:bg-slate-50"
                key={article.articleId}
              >
                <Link to={`/articles/${article.articleId}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800">{article.articleId}</Link>
                <span className="text-sm text-slate-600">{new Date(article.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                <Link
                  to={`/articles/${article.articleId}`}
                  className="flex min-w-0 items-center gap-2"
                >
                  <FileText className="shrink-0 text-slate-400" size={17} />
                  <span className="truncate text-sm font-semibold text-slate-700">{article.articleTitle || "Untitled article"}</span>
                </Link>
                <span className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-white ${statusLabel(article.status)[1]}`}><span className="h-1.5 w-1.5 rounded-full bg-white/80" />{statusLabel(article.status)[0]}</span>
                {article.articlePdfUrl ? <button className="inline-flex w-fit items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50" onClick={() => downloadAttachedPdf(article)}><Download size={13} /> Download</button> : <span className="text-sm text-slate-400">--</span>}
                <div className="flex items-center justify-end gap-1">
                  {mode === "draft" && <Link className="rounded-md p-2 text-slate-500 hover:bg-slate-100" to={`/articles/${article.articleId}`} aria-label={`Edit ${article.articleId}`}><Pencil size={16} /></Link>}
                  {mode === "my" && <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => download(article.articleId)} aria-label={`Download ${article.articleId}`}><Download size={16} /></button>}
                  <Link className="rounded-md p-2 text-slate-400 hover:bg-slate-100" to={`/articles/${article.articleId}`} aria-label={`View ${article.articleId}`}><Eye size={17} /></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
