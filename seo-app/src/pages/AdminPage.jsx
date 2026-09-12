/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
/**
 * ADMIN PAGE - Article Review Dashboard
 *
 * Admin editorial desk for managing article submissions
 * Admin-only page for reviewing and approving/rejecting articles
 *
 * Workflow:
 * 1. User submits article (status: "pending")
 * 2. Admin views article in this dashboard
 * 3. Admin reviews content and can:
 *    - Deliver article → "delivered"
 *    - Reject article → "Failed"
 *    - Change back to "writing" if revisions needed
 * 4. Admin can download the article content PDF
 *
 * Filtering Capabilities:
 * - Search by article ID
 * - Filter by author name
 * - Filter by status (draft, submitted, pending, delivered, Failed)
 * - Filter by date range
 *
 * Preview Modal:
 * - Shows full article details including title, abstract, keywords, content
 * - Displays article images and reference links
 * - Shows author information
 * - Provides status update dropdown
 * - Provides PDF download button
 */
import { Copy, Download, Eye, Mail, Plus, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import StatusBadge from "../components/ui/StatusBadge";
import { errorMessage } from "../lib/api";
import { downloadRemotePdf } from "../lib/pdfActions";
import {
  downloadAdminArticle,
  getAdminArticle,
  getAdminArticles,
  setArticleStatus,
  deliverArticle,
} from "../services/adminService";

export default function AdminPage() {
  const [articles, setArticles] = useState([]); // List of articles for admin review
  const [filter, setFilter] = useState(""); // Article ID search filter
  const [authorName, setAuthorName] = useState(""); // Author name filter
  const [statusFilter, setStatusFilter] = useState("pending"); // Status filter (default: pending)
  const [fromDate, setFromDate] = useState(""); // Date range start filter
  const [loading, setLoading] = useState(true); // Articles list loading state
  const [preview, setPreview] = useState(null); // Selected article for preview modal
  const [previewLoading, setPreviewLoading] = useState(false); // Preview modal loading state
  const [shareArticle, setShareArticle] = useState(null);
  const [articleShare, setArticleShare] = useState(null);
  const [shareForm, setShareForm] = useState({
    note: "",
    links: [""],
    file: null,
  });

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
  const load = async (overrides = {}) => {
    setLoading(true);
    try {
      const r = await getAdminArticles({
        articleId: filter || undefined,
        limit: 50,
        authorName: authorName || undefined,
        status: overrides.status ?? (statusFilter || undefined),
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
   * Changes workflow status through pending, delivered, or Failed.
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

  const openSharePopup = (article) => {
    setShareArticle(article);
    setShareForm({
      note: article.deliveryNote || "",
      links: article.deliveryLinks?.length
        ? article.deliveryLinks
        : [article.deliveryLink || ""],
      file: null,
    });
  };

  const shareArticleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(articleShare.text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const shareArticleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(articleShare.title)}&body=${encodeURIComponent(articleShare.text)}`;
  };

  const copyArticleShare = async () => {
    await navigator.clipboard.writeText(articleShare.text);
    toast.success("Article details copied");
  };

  const nativeShareArticle = async () => {
    if (!navigator.share)
      return toast.error("Native sharing is not supported in this browser");
    try {
      await navigator.share({
        title: articleShare.title,
        text: articleShare.text,
      });
    } catch (error) {
      if (error.name !== "AbortError") toast.error("Unable to share article");
    }
  };

  const submitShare = async (event) => {
    event.preventDefault();
    try {
      await deliverArticle(shareArticle.articleId, {
        deliveryNote: shareForm.note,
        deliveryLinks: shareForm.links.filter((link) => link.trim()),
        file: shareForm.file,
      });
      toast.success("Article delivered successfully");
      setShareArticle(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
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
      const articleDetailsResponse = await getAdminArticle(article.articleId);
      const shareDetails = articleDetailsResponse.data || article;
      const generatedPdf = await downloadAdminArticle(shareDetails.articleId);
      const generatedBlob = new Blob([generatedPdf.data || generatedPdf], {
        type: "application/pdf",
      });
      const title = shareDetails.articleTitle || shareDetails.articleId;
      const imageUrls = (shareDetails.images || []).filter(Boolean);
      const packagePublishers =
        shareDetails.packageId?.mediaCoverage
          ?.map((publisher) => publisher.publisherName)
          .filter(Boolean) || [];
      const articleDetails = [
        `Article ID: ${shareDetails.articleId}`,
        `Article title: ${title}`,
        shareDetails.author?.name || shareDetails.authorName
          ? `Author: ${shareDetails.author?.name || shareDetails.authorName}`
          : null,
        shareDetails.packageId?.packageName
          ? `Chosen package: ${shareDetails.packageId.packageName}`
          : null,
        packagePublishers.length
          ? `Package publishers: ${packagePublishers.join(", ")}`
          : null,
        shareDetails.publisherId?.publisherName
          ? `Chosen publisher: ${shareDetails.publisherId.publisherName}`
          : null,
        shareDetails.refLink ? `Reference link: ${shareDetails.refLink}` : null,
        imageUrls.length
          ? `Attached image links:\n${imageUrls.join("\n")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");
      const files = [
        new File([generatedBlob], `${shareDetails.articleId}-article.pdf`, {
          type: "application/pdf",
        }),
      ];

      if (shareDetails.articlePdfUrl) {
        const attachedResponse = await fetch(shareDetails.articlePdfUrl);
        if (!attachedResponse.ok)
          throw new Error("Attached PDF could not be loaded");
        const attachedBlob = new Blob([await attachedResponse.blob()], {
          type: "application/pdf",
        });
        files.push(
          new File([attachedBlob], `${shareDetails.articleId}-attached.pdf`, {
            type: "application/pdf",
          }),
        );
      }

      const fileSummary = `Shared files: ${files.map((file) => file.name).join(", ")}`;

      if (navigator.share && navigator.canShare?.({ files })) {
        await navigator.share({
          title: `Article PDFs: ${title}`,
          text: `${articleDetails}\n${fileSummary}`,
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
        toast.success(
          "PDF files downloaded. This browser does not support direct file sharing.",
        );
      }
    } catch (error) {
      toast.error(
        error.message || "Unable to prepare article PDFs for sharing",
      );
    }
  };

  const downloadAttachedPdf = async (article) => {
    try {
      await downloadRemotePdf(
        article.articlePdfUrl,
        `${article.articleId}-attached.pdf`,
      );
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
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 pt-1">
          {[["", "All articles"], ["pending", "Active"], ["delivered", "Delivered"], ["Failed", "Unfulfilled"]].map(([value, label]) => (
            <button
              key={label}
              className={`relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition ${statusFilter === value ? "text-blue-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-blue-600" : "text-slate-500 hover:text-slate-800"}`}
              onClick={() => {
                setStatusFilter(value);
                load({ status: value });
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
          <label className="label">
            Article ID
            <input
              className="field"
              value={filter}
              placeholder="Search by article ID"
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </label>
          <label className="label">
            Author
            <input
              className="field"
              value={authorName}
              placeholder="Author name"
              onChange={(e) => setAuthorName(e.target.value)}
            />
          </label>
          <label className="label">
            Status
            <select
              className="field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="payment_pending">Payment pending</option>
              <option value="writing">Writing</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending delivery</option>
              <option value="delivered">Delivered</option>
              <option value="Failed">Failed</option>
            </select>
          </label>
          <label className="label">
            Submission date
            <input
              className="field"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="Submission date"
            />
          </label>
          <button className="btn-secondary w-full sm:w-auto" onClick={load}>
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
            <div className="grid min-w-[1120px] grid-cols-[1.1fr_1.2fr_1.5fr_0.9fr_0.9fr_1.1fr_1.2fr] items-center gap-3 whitespace-nowrap border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Article ID</span><span>Submitted</span><span>Article</span><span>Author</span><span>Cost</span><span>Status</span><span>Actions</span>
            </div>
            {articles.map((a) => (
              <div className="grid h-14 min-w-[1120px] grid-cols-[1.1fr_1.2fr_1.5fr_0.9fr_0.9fr_1.1fr_1.2fr] items-center gap-3 overflow-hidden whitespace-nowrap border-b border-slate-200 px-4 last:border-0 hover:bg-slate-50" key={a.articleId}>
                <button className="min-w-0 truncate text-left text-sm font-semibold leading-none text-blue-600 hover:text-blue-800" onClick={() => viewArticle(a.articleId)}>{a.articleId}</button>
                <span className="min-w-0 truncate text-sm leading-none text-slate-600">{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "--"}</span>
                <span className="min-w-0 truncate text-sm font-semibold leading-none text-slate-700" title={a.articleTitle || "Untitled article"}>{a.articleTitle || "Untitled article"}</span>
                <span className="min-w-0 truncate text-sm leading-none text-slate-600" title={a.author?.email || a.userId?.email}>{a.author?.name || a.userId?.name || "--"}</span>
                <span className="min-w-0 truncate text-sm font-medium leading-none text-slate-700">₹{(Number(a.packageCostPrice || 0) + Number(a.publisherCostPrice || 0)).toFixed(2)}</span>
                <span className="min-w-0"><StatusBadge status={a.status} /></span>
                <div className="flex flex-nowrap items-center gap-1 overflow-visible">
                  {["writing", "submitted", "pending"].includes(a.status) && <select className="max-w-[120px] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" value="" onChange={(e) => { if (!e.target.value) return; if (e.target.value === "delivered") openSharePopup(a); else update(a.articleId, e.target.value); }} aria-label={`Update ${a.articleId} status`}>
                    <option value="" disabled>Update</option><option value="delivered" disabled={a.status !== "pending"}>Delivered</option><option value="Failed">Failed</option>
                  </select>}
                  <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" disabled={previewLoading} onClick={() => viewArticle(a.articleId)} aria-label={`View ${a.articleId}`} title="View article"><Eye size={16} /></button>
                  <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => downloadArticle(a)} aria-label={`Download ${a.articleId}`} title="Download article PDF"><Download size={16} /></button>
                  <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => shareByChannel(a)} aria-label={`Share ${a.articleId}`} title="Share article"><Share2 size={16} /></button>
                </div>
              </div>
            ))}
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
                      <a
                        key={image}
                        href={image}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={image}
                          alt={`Uploaded article image ${index + 1}`}
                          className="h-40 w-full rounded-xl border border-slate-200 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </section>
              )}
              {preview.refLink && (
                <section>
                  <h3 className="font-bold">Reference link</h3>
                  <a
                    className="mt-2 block break-all text-blue-700 underline"
                    href={preview.refLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {preview.refLink}
                  </a>
                </section>
              )}
              {preview.articlePdfUrl && (
                <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <h3 className="font-bold text-blue-950">
                    Attached article PDF
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      className="btn-primary px-3 py-2 text-sm"
                      onClick={() => downloadAttachedPdf(preview)}
                    >
                      <Download size={15} /> Download PDF
                    </button>
                    <button
                      className="btn-secondary px-3 py-2 text-sm"
                      onClick={() => shareAttachedPdf(preview)}
                    >
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
      {articleShare && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-600">
                  SHARE ARTICLE
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  Share {articleShare.article.articleId}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setArticleShare(null)}
                aria-label="Close share options"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 whitespace-pre-line text-slate-600">
              {articleShare.text}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="btn-primary"
                onClick={shareArticleWhatsApp}
              >
                <span className="font-bold">WA</span>WhatsApp
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={shareArticleEmail}
              >
                <Mail size={16} />
                Email
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={copyArticleShare}
              >
                <Copy size={16} />
                Copy details
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={nativeShareArticle}
              >
                <Share2 size={16} />
                More options
              </button>
              <button
                type="button"
                className="btn-secondary sm:col-span-2"
                onClick={() => {
                  setArticleShare(null);
                  viewArticle(articleShare.article.articleId);
                }}
              >
                <Eye size={16} />
                Open article
              </button>
            </div>
          </div>
        </div>
      )}
      {shareArticle && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={submitShare}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-600">DELIVERY</p>
                <h2 className="mt-1 text-xl font-bold">
                  Share {shareArticle.articleId}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setShareArticle(null)}
                aria-label="Close delivery popup"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="label">
                Note{" "}
                <textarea
                  className="field min-h-24"
                  value={shareForm.note}
                  onChange={(event) =>
                    setShareForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Optional delivery note"
                />
              </label>
              <div>
                <p className="label">Links</p>
                <div className="mt-1 space-y-2">
                  {shareForm.links.map((link, index) => (
                    <div className="flex gap-2" key={`delivery-link-${index}`}>
                      <input
                        className="field mt-0"
                        type="url"
                        value={link}
                        onChange={(event) =>
                          setShareForm((current) => ({
                            ...current,
                            links: current.links.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item,
                            ),
                          }))
                        }
                        placeholder="https://example.com/delivered-article"
                      />
                      <button
                        type="button"
                        className="btn-secondary shrink-0 px-3"
                        onClick={() =>
                          setShareForm((current) => ({
                            ...current,
                            links: current.links.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          }))
                        }
                        aria-label="Remove link"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-secondary mt-2 px-3 py-2 text-sm"
                  onClick={() =>
                    setShareForm((current) => ({
                      ...current,
                      links: [...current.links, ""],
                    }))
                  }
                >
                  <Plus size={15} />
                  Add link
                </button>
              </div>
              <label className="label">
                File{" "}
                <input
                  className="field"
                  type="file"
                  accept=".sheet,.csv,.xls,.xlsx,.pdf,.doc,.docx,.txt,.zip"
                  onChange={(event) =>
                    setShareForm((current) => ({
                      ...current,
                      file: event.target.files?.[0] || null,
                    }))
                  }
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Optional. Maximum 25 MB.
                </span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShareArticle(null)}
              >
                Cancel
              </button>
              <button className="btn-primary" type="submit">
                <Share2 size={16} />
                Deliver article
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
