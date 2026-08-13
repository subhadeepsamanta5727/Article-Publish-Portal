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
 * 4. Admin can download article PDF with full details
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
import { Download, Eye, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import StatusBadge from "../components/ui/StatusBadge";
import { errorMessage } from "../lib/api";
import {
  downloadAdminArticle,
  getAdminArticle,
  getAdminArticles,
  setArticleStatus,
} from "../services/adminService";

export default function AdminPage() {
  const [articles, setArticles] = useState([]);          // List of articles for admin review
  const [filter, setFilter] = useState("");              // Article ID search filter
  const [authorName, setAuthorName] = useState("");      // Author name filter
  const [statusFilter, setStatusFilter] = useState("submitted");  // Status filter (default: submitted)
  const [fromDate, setFromDate] = useState("");          // Date range start filter
  const [loading, setLoading] = useState(true);          // Articles list loading state
  const [preview, setPreview] = useState(null);          // Selected article for preview modal
  const [previewLoading, setPreviewLoading] = useState(false);  // Preview modal loading state

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
  const update = async (id, status) => {
    try {
      const r = await setArticleStatus(id, status);
      toast.success(r.message);
      load();  // Refresh list after status change
    } catch (e) {
      toast.error(errorMessage(e));
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
      setPreview(r.data);  // Store in state to display in modal
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setPreviewLoading(false);
    }
  };

  /**
   * Download article PDF with full admin details
   * PDF includes: content, images, reference link, payment details
   * 
   * Process:
   * 1. Fetch PDF blob from backend
   * 2. Create object URL
   * 3. Trigger browser download
   * 4. Clean up object URL
   * 
   * @param {string} id - Article ID to download
   */
  const downloadArticle = async (id) => {
    try {
      const blob = await downloadAdminArticle(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF download started");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <div>
        <p className="text-sm font-semibold text-red-600">EDITORIAL DESK</p>
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
          <input className="field mt-0 max-w-xs" value={authorName} placeholder="Author name" onChange={(e) => setAuthorName(e.target.value)} />
          <select className="field mt-0 max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="payment_pending">Payment pending</option><option value="writing">Writing</option><option value="submitted">Submitted</option><option value="under_review">Under Processing</option><option value="accepted">Published</option><option value="rejected">Failed</option></select>
          <label className="text-xs font-semibold text-slate-500">Submission date<input className="field mt-1 max-w-[170px]" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="Submission date" /></label>
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
                  <th className="p-4">Submitted</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Decision</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((a) => (
                  <tr key={a.articleId}>
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
                      {a.submittedAt
                        ? new Date(a.submittedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="p-4">
                      {["writing", "submitted", "under_review"].includes(a.status) ? (
                        <select
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                          defaultValue=""
                          onChange={(e) =>
                            e.target.value &&
                            update(a.articleId, e.target.value)
                          }
                        >
                          <option value="" disabled>
                            Update status
                          </option>
                          {a.status === "submitted" && (
                            <option value="under_review">
                              Under Processing
                            </option>
                          )}
                          <option value="accepted">Published</option>
                          <option value="rejected">Failed</option>
                        </select>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn-secondary px-3 py-2"
                          disabled={previewLoading}
                          onClick={() => viewArticle(a.articleId)}
                          aria-label={`View ${a.articleId}`}
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button
                          className="btn-primary px-3 py-2"
                          onClick={() => downloadArticle(a.articleId)}
                          aria-label={`Download ${a.articleId}`}
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
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
                <p className="text-xs font-semibold text-red-600">
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
            </div>
            <div className="flex justify-end border-t border-slate-100 p-5">
              <button
                disabled={!preview?.articleId}
                onClick={() => downloadArticle(preview.articleId)}
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
