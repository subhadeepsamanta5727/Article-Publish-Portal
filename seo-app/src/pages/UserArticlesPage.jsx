import { Download, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import StatusBadge from "../components/ui/StatusBadge";
import { errorMessage } from "../lib/api";
import { downloadRemotePdf } from "../lib/pdfActions";
import { downloadArticlePdf, getMyArticles } from "../services/articleService";

export default function UserArticlesPage({ mode }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getMyArticles()
      .then((r) => setArticles(r.data || []))
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  const visible = articles.filter((a) =>
    mode === "draft"
      ? ["draft", "writing", "payment_pending"].includes(a.status)
      : ["submitted", "under_review", "pending", "delivered", "accepted", "rejected"].includes(
          a.status,
        ),
  );
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
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-blue-600">AUTHOR WORKSPACE</p>
      <h1 className="mt-1 text-3xl font-bold">
        {mode === "draft" ? "Draft articles" : "My articles"}
      </h1>
      <p className="mt-2 text-slate-500">
        {mode === "draft"
          ? "Continue writing articles after payment."
          : "Submitted articles and their editorial status."}
      </p>
      <section className="card mt-8 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading articles...
          </p>
        ) : !visible.length ? (
          <p className="p-10 text-center text-sm text-slate-500">
            No {mode === "draft" ? "draft" : "submitted"} articles found.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((article) => (
              <div
                className="flex flex-wrap items-center justify-between gap-4 p-5"
                key={article.articleId}
              >
                <Link
                  to={`/articles/${article.articleId}`}
                  className="flex min-w-0 items-center gap-3"
                >
                  <FileText className="shrink-0 text-blue-600" />
                  <span>
                    <span className="block truncate font-semibold">
                      {article.articleTitle || "Untitled article"}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {article.articleId} ·{" "}
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                </Link>
                <div className="flex items-center gap-3">
                  <StatusBadge status={article.status} />
                  {mode === "my" && (
                    <button
                      className="btn-secondary px-3 py-2"
                      onClick={() => download(article.articleId)}
                    >
                      <Download size={16} />
                      Download PDF
                    </button>
                  )}
                </div>
                {article.status === "delivered" && (article.deliveryNote || article.deliveryLink) && (
                  <div className="mt-3 w-full rounded-lg bg-blue-50 p-3 text-sm text-blue-950">
                    {article.deliveryNote && <p>{article.deliveryNote}</p>}
                    {article.deliveryLink && <a className="mt-1 block font-semibold underline" href={article.deliveryLink} target="_blank" rel="noreferrer">{article.deliveryLink}</a>}
                  </div>
                )}
                {article.articlePdfUrl && (
                  <div className="mt-3 flex w-full flex-wrap gap-2">
                    <button className="btn-secondary px-2 py-1 text-xs" onClick={() => downloadAttachedPdf(article)}><Download size={14} /> Download PDF</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
