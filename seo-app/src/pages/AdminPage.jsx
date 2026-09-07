/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
/**
 * ADMIN PAGE - Article Review Dashboard
 *
 * Admin editorial desk for managing article submissions
 * Admin-only page for reviewing and approving/rejecting articles
 *
 * Workflow:
 * 1. User submits article (status: "submitted")
 * 2. Admin views article in this dashboard
 * 3. Admin reviews content and can:
 *    - Approve article → "Published"
 *    - Reject article → "Failed"
 *    - Change back to "writing" if revisions needed
 * 4. Admin can download the article content PDF
 *
 * Filtering Capabilities:
 * - Search by article ID
 * - Filter by author name
 * - Filter by status (draft, submitted, under_review, published, failed)
 * - Filter by date range
 *
 * Preview Modal:
 * - Shows full article details including title, abstract, keywords, content
 * - Displays article images and reference links
 * - Shows author information
 * - Provides status update dropdown
 * - Provides PDF download button
 */
import { Download, Eye, Share2, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";
import StatusBadge from "../components/ui/StatusBadge";
import { errorMessage } from "../lib/api";
import { downloadRemotePdf } from "../lib/pdfActions";
import {
  downloadAdminArticle,
  getAdminArticle,
  getAdminArticles,
  setArticleStatus,
} from "../services/adminService";

export default function AdminPage() {
  const [articles, setArticles] = useState([]); // List of articles for admin review
  const [filter, setFilter] = useState(""); // Article ID search filter
  const [authorName, setAuthorName] = useState(""); // Author name filter
  const [statusFilter, setStatusFilter] = useState("submitted"); // Status filter (default: submitted)
  const [fromDate, setFromDate] = useState(""); // Date range start filter
  const [loading, setLoading] = useState(true); // Articles list loading state
  const [preview, setPreview] = useState(null); // Selected article for preview modal
  const [previewLoading, setPreviewLoading] = useState(false); // Preview modal loading state
  const [deliveryDrafts, setDeliveryDrafts] = useState({});

  /**
   * Fetch articles based on active filters
   * Passes all filter parameters to backend for server-side filtering/pagination
   *
   * Filters applied:
   * - articleId: Exact or partial match
   * - authorName: Partial match
   * - status: Enum match
   * - fromDate/toDate: Date range (using same date for both for "today" filter)
   * - limit: 50 articles per fetch
   */
  const load = async () => {
    setLoading(true);
    try {
      const r = await getAdminArticles({
        articleId: filter || undefined,
        limit: 50,
        authorName: authorName || undefined,
        status: statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: fromDate || undefined,
      });
      setArticles(r.data.articles);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  // Load articles on component mount
  useEffect(() => {
    load();
  }, []);

  /**
   * Update article status
   * Changes workflow status (submitted → published/failed/under_review)
   * Triggers data reload to reflect status change in list
   *
   * @param {string} id - Article ID
   * @param {string} status - New status value
   */
  const update = async (id, status, details = {}) => {
    try {
      const r = await setArticleStatus(id, status, details);
      toast.success(r.message);
      load(); // Refresh list after status change
      if (status === "pending") await viewArticle(id);
      if (status === "delivered") {
        setPreview(null);
      }
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const deliveryDetailsFor = (article) => ({
    deliveryNote: deliveryDrafts[article.articleId]?.deliveryNote ?? article.deliveryNote ?? "",
    deliveryLink: deliveryDrafts[article.articleId]?.deliveryLink ?? article.deliveryLink ?? "",
  });

  const submitDelivery = (article) => {
    const details = deliveryDetailsFor(article);
    if (!details.deliveryNote.trim()) {
      toast.error("Delivery note is required");
      return;
    }
    update(article.articleId, "delivered", details);
  };

  /**
   * Load full article details into preview modal
   * Fetches complete article data including content, images, and author info
   *
   * @param {string} id - Article ID to load
   */
  const viewArticle = async (id) => {
    setPreviewLoading(true);
    try {
      const r = await getAdminArticle(id);
      setPreview(r.data); // Store in state to display in modal
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setPreviewLoading(false);
    }
  };

  /**
   * Download the article content PDF for editorial review
   * PDF includes: article content, images, and reference link
   *
   * Process:
   * 1. Fetch PDF blob from backend
   * 2. Create object URL
   * 3. Trigger browser download
   * 4. Clean up object URL
   *
   * @param {string} id - Article ID to download
   */
  const downloadArticle = async (article) => {
    try {
      const blob = await downloadAdminArticle(article.articleId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${article.articleId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (article.articlePdfUrl) {
        await downloadAttachedPdf(article);
        toast.success("Article PDFs download started");
      } else {
        toast.success("Article PDF download started");
      }
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const shareByChannel = async (article) => {
    try {
      const generatedPdf = await downloadAdminArticle(article.articleId);
      const generatedBlob = new Blob([generatedPdf.data || generatedPdf], { type: "application/pdf" });
      const title = article.articleTitle || article.articleId;
      const articleDetails = [
        `Article: ${title}`,
        `Article ID: ${article.articleId}`,
        article.author?.name || article.authorName ? `Author: ${article.author?.name || article.authorName}` : null,
        article.category?.title || article.category ? `Category: ${article.category?.title || article.category}` : null,
        article.status ? `Status: ${article.status}` : null,
        article.refLink ? `Reference: ${article.refLink}` : null,
      ].filter(Boolean).join("\n");
      const files = [new File([generatedBlob], `${article.articleId}.pdf`, { type: "application/pdf" })];

      if (article.articlePdfUrl) {
        const attachedResponse = await fetch(article.articlePdfUrl);
        if (!attachedResponse.ok) throw new Error("Attached PDF could not be loaded");
        const attachedBlob = new Blob([await attachedResponse.blob()], { type: "application/pdf" });
        files.push(new File([attachedBlob], `${article.articleId}-attached.pdf`, { type: "application/pdf" }));
      }

      if (navigator.share && navigator.canShare?.({ files })) {
        await navigator.share({
          title: `Article PDFs: ${title}`,
          text: `${articleDetails}\n\nAttached PDF files: ${files.map((file) => file.name).join(", ")}`,
          files,
        });
      } else {
        files.forEach((file) => {
          const url = URL.createObjectURL(file);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        });
        toast.success("PDF files downloaded. This browser does not support direct file sharing.");
      }
    } catch (error) {
      toast.error(error.message || "Unable to prepare article PDFs for sharing");
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

  const shareAttachedPdf = async (article) => {
    await shareByChannel(article);
  };

  return (
    <>
      <div>
        <p className="text-sm font-semibold text-blue-600">EDITORIAL DESK</p>
        <h1 className="mt-1 text-3xl font-bold">Review submissions</h1>
        <p className="mt-2 text-slate-500">
          Preview, download, and move articles through the editorial process.
        </p>
      </div>
      <div className="card mt-8 overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <input
            className="field mt-0 max-w-sm"
            value={filter}
            placeholder="Search by article ID"
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <input
            className="field mt-0 max-w-xs"
            value={authorName}
            placeholder="Author name"
            onChange={(e) => setAuthorName(e.target.value)}
          />
          <select
            className="field mt-0 max-w-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="payment_pending">Payment pending</option>
            <option value="writing">Writing</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Processing</option>
            <option value="pending">Pending delivery</option>
            <option value="delivered">Delivered</option>
            <option value="accepted">Published</option>
            <option value="rejected">Failed</option>
          </select>
          <label className="text-xs font-semibold text-slate-500">
            Submission date
            <input
              className="field mt-1 max-w-[170px]"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="Submission date"
            />
          </label>
          <button className="btn-secondary" onClick={load}>
            Search
          </button>
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading submissions…
          </p>
        ) : articles.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            No submitted articles found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Article</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Cost_Price</th>
                  <th className="p-4">Submitted</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Decision</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((a) => (
                  <Fragment key={a.articleId}>
                  <tr>
                    <td className="p-4">
                      <p className="font-semibold">
                        {a.articleTitle || "Untitled article"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {a.articleId}
                      </p>
                    </td>
                    <td className="p-4 text-slate-600">
                      {a.author?.name || a.userId?.name}
                      <br />
                      <span className="text-xs text-slate-400">
                        {a.author?.email || a.userId?.email}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      ₹{(Number(a.packageCostPrice || 0) + Number(a.publisherCostPrice || 0)).toFixed(2)}
                    </td>
                    <td className="p-4 text-slate-500">
                      {a.submittedAt
                        ? new Date(a.submittedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="p-4">
                        {["writing", "submitted", "under_review", "pending"].includes(a.status) ? (
                        <select
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                          defaultValue=""
                          onChange={(e) => {
                            if (!e.target.value) return;
                            if (e.target.value === "delivered") update(a.articleId, "delivered", deliveryDetailsFor(a));
                            else update(a.articleId, e.target.value);
                          }}
                        >
                          <option value="" disabled>
                            Update status
                          </option>
                          <option value="pending" disabled={a.status === "pending"}>Pending</option>
                          <option value="delivered" disabled={a.status !== "pending"}>Delivered</option>
                          <option value="rejected">Failed</option>
                        </select>
                      ) : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn-secondary px-2 py-1.5 text-xs"
                          disabled={previewLoading}
                          onClick={() => viewArticle(a.articleId)}
                          aria-label={`View ${a.articleId}`}
                          title="View article"
                        >
                          <Eye size={14} />
                        
                        </button>
                        <button
                          className="btn-secondary px-2 py-1.5 text-xs"
                          onClick={() => downloadArticle(a)}
                          aria-label={`Download article PDF for ${a.articleId}`}
                          title="Download article PDF"
                        >
                          <Download size={14} />
                        
                        </button>
                        <button
                          className="btn-secondary px-2 py-1.5 text-xs"
                          onClick={() => shareByChannel(a)}
                          aria-label={`Share ${a.articleId}`}
                          title="Share article"
                        >
                          <Share2 size={14} />
                        
                        </button>
                      </div>
                    </td>
                  </tr>
                  {(a.status === "pending" || a.deliveryNote || a.deliveryLink) && (
                    <tr>
                      <td colSpan={7} className="px-4 pb-4">
                        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-950">
                          {a.status === "pending" ? (
                            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                              <label className="label">Delivery note<input required className="field" value={deliveryDetailsFor(a).deliveryNote} onChange={(e) => setDeliveryDrafts((current) => ({ ...current, [a.articleId]: { ...deliveryDetailsFor(a), deliveryNote: e.target.value } }))} /></label>
                              <label className="label">Article link<input type="url" className="field" value={deliveryDetailsFor(a).deliveryLink} onChange={(e) => setDeliveryDrafts((current) => ({ ...current, [a.articleId]: { ...deliveryDetailsFor(a), deliveryLink: e.target.value } }))} /></label>
                              <button className="btn-primary" onClick={() => submitDelivery(a)}>Delivered</button>
                            </div>
                          ) : (
                            <><span className="font-semibold">Delivery details: </span>{a.deliveryNote && <span>{a.deliveryNote}</span>}{a.deliveryLink && <a className="ml-2 break-all font-semibold text-blue-700 underline" href={a.deliveryLink} target="_blank" rel="noreferrer">{a.deliveryLink}</a>}</>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {preview && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between border-b border-slate-100 bg-white p-5">
              <div>
                <p className="text-xs font-semibold text-blue-600">
                  ARTICLE PREVIEW
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {preview.articleTitle || "Untitled article"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {preview.articleId} · {preview.author?.name}
                </p>
              </div>
              <button
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setPreview(null)}
                aria-label="Close preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={preview.status} />
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {preview.category?.title}
                </span>
              </div>
              {preview.abstract && (
                <section>
                  <h3 className="font-bold">Abstract</h3>
                  <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">
                    {preview.abstract}
                  </p>
                </section>
              )}
              <section>
                <h3 className="font-bold">Article content</h3>
                <div className="mt-2 whitespace-pre-wrap leading-8 text-slate-700">
                  {preview.content || "No article content is available."}
                </div>
              </section>
              {preview.images?.length > 0 && (
                <section>
                  <h3 className="font-bold">Uploaded images</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {preview.images.map((image, index) => (
                      <a key={image} href={image} target="_blank" rel="noreferrer">
                        <img src={image} alt={`Uploaded article image ${index + 1}`} className="h-40 w-full rounded-xl border border-slate-200 object-cover" />
                      </a>
                    ))}
                  </div>
                </section>
              )}
              {preview.refLink && (
                <section>
                  <h3 className="font-bold">Reference link</h3>
                  <a className="mt-2 block break-all text-blue-700 underline" href={preview.refLink} target="_blank" rel="noreferrer">
                    {preview.refLink}
                  </a>
                </section>
              )}
              {preview.articlePdfUrl && (
                <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <h3 className="font-bold text-blue-950">Attached article PDF</h3>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button className="btn-primary px-3 py-2 text-sm" onClick={() => downloadAttachedPdf(preview)}>
                      <Download size={15} /> Download PDF
                    </button>
                    <button className="btn-secondary px-3 py-2 text-sm" onClick={() => shareAttachedPdf(preview)}>
                      <Share2 size={15} /> Share PDF
                    </button>
                  </div>
                </section>
              )}
            </div>
            <div className="flex justify-end border-t border-slate-100 p-5">
              <button
                disabled={!preview?.articleId}
                onClick={() => downloadArticle(preview)}
                className="btn-primary"
              >
                <Download size={17} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
