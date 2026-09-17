/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
/**
 * ARTICLE EDITOR PAGE
 * 
 * Main workspace for users to create, edit, and publish articles
 * Supports multiple images and reference links with responsive layout
 * 
 * Workflow:
 * 1. User creates article (auto-generated articleId)
 * 2. User enters title, keywords, abstract in draft mode
 * 3. User uploads multiple images (auto-compressed to 1200px width, 0.75 quality)
 * 4. User adds reference link URL
 * 5. User generates AI content or writes manually
 * 6. User saves draft (status: "writing")
 * 7. User pays for submission via Razorpay
 * 8. After payment: status transitions to "payment_pending" → "writing"
 * 9. User submits article (status: "submitted")
 * 
 * Layout Features:
 * - Images and reference link fields: Side-by-side on desktop (md:grid-cols-2)
 * - Images and reference link fields: Stacked on mobile
 * - Image preview grid with delete buttons
 * - Responsive form inputs with Tailwind
 * 
 * Field Mapping (IMPORTANT - matches backend Article model):
 * - Form state: images (array of URLs), refLink (string)
 * - Backend model: images (array), refLink (string)
 * - Note: NOT imageUrl/resourceLink (old field names)
 */
import { Download, Edit3, Save, Send, WalletCards, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import StatusBadge from "../components/ui/StatusBadge";
import { errorMessage } from "../lib/api";
import { downloadRemotePdf } from "../lib/pdfActions";
import {
  getArticle,
  downloadArticlePdf,
  submitArticle,
  updateArticle,
  generateArticleContent,
  uploadArticleFile,
} from "../services/articleService";
import { createOrder, verifyPayment } from "../services/paymentService";

/**
 * Dynamically load Razorpay payment gateway script
 * Ensures script is loaded only once and returns loading status
 * 
 * @returns {Promise<boolean>} True if Razorpay loaded successfully
 */
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function ArticleEditorPage() {
  const { articleId } = useParams();
  const [article, setArticle] = useState(null);      // Full article data from backend
  const [form, setForm] = useState({
    articleTitle: "",                                  // Article title
    keywords: "",                                      // Comma-separated keywords
    content: "",                                       // Full article body text
    images: [],                                        // Array of image URLs (IMPORTANT: array, not singular)
    refLink: "",                                       // Reference/source link URL
    articlePdfUrl: "",                                 // Optional completed article PDF URL
  });
  const [busy, setBusy] = useState(false);            // Saving/payment in progress
  const [generating, setGenerating] = useState(false); // AI content generation in progress
  const [previewOpen, setPreviewOpen] = useState(false); // Preview modal open state

  /**
   * Fetch article data from backend and populate form
   * Called on component mount and after payment
   * 
   * Syncs backend article fields with frontend form state:
   * - articleTitle: Direct sync
   * - keywords: Convert array to comma-separated string
   * - content: Direct sync
   * - images: Array of URLs (CRITICAL: must be array, not single URL)
   * - refLink: Direct sync
   */
  const refresh = async () => {
    try {
      const r = await getArticle(articleId);
      setArticle(r.data);
      setForm({
        articleTitle: r.data.articleTitle || "",
        keywords: (r.data.keywords || []).join(", "),  // Join array to comma-separated
        content: r.data.content || "",
        images: r.data.images || [],                    // IMPORTANT: Array from backend
        refLink: r.data.refLink || "",                  // IMPORTANT: Not resourceLink
        articlePdfUrl: r.data.articlePdfUrl || "",
      });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  /**
   * Compress image file to reduce file size
   * Uses Canvas API to resize and reduce quality
   * 
   * @param {File} file - Image file to compress
   * @param {number} maxWidth - Maximum width in pixels (default 1200)
   * @param {number} quality - JPEG quality 0-1 (default 0.75)
   * @returns {Promise<string>} Base64 data URL of compressed image
   * 
   * Process:
   * 1. Read file as Data URL
   * 2. Create Image and wait for load
   * 3. Calculate new dimensions maintaining aspect ratio
   * 4. Draw to canvas at new size
   * 5. Convert canvas to blob as JPEG
   * 6. Read blob back as Data URL
   */
  const compressImage = (file, maxWidth = 1200, quality = 0.75) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const ratio = Math.min(1, maxWidth / image.width);
          const width = Math.round(image.width * ratio);
          const height = Math.round(image.height * ratio);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context unavailable"));
            return;
          }
          ctx.drawImage(image, 0, 0, width, height);
          if (canvas.toBlob) {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Image compression failed"));
                  return;
                }
                const compressedReader = new FileReader();
                compressedReader.onerror = reject;
                compressedReader.onloadend = () => resolve(compressedReader.result);
                compressedReader.readAsDataURL(blob);
              },
              "image/jpeg",
              quality,
            );
          } else {
            try {
              resolve(canvas.toDataURL("image/jpeg", quality));
            } catch (error) {
              reject(error);
            }
          }
        };
        image.onerror = reject;
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  // Initial load on component mount
  useEffect(() => {
    refresh();
  }, [articleId]);

  /**
   * Save article to backend
   * Updates all fields: title, keywords, content, images, refLink
   * Converts comma-separated keywords to array
   * 
   * Backend updates Article document and returns updated record
   */
  const save = async () => {
    const r = await updateArticle(articleId, {
      ...form,
      keywords: form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),  // Convert comma-separated to array, trim whitespace, filter empty
    });
    setArticle(r.data);
    toast.success(r.message);
  };

  /**
   * Initiate Razorpay payment process
   * 
   * Steps:
   * 1. Load Razorpay script
   * 2. Create payment order (backend calculates amount)
   * 3. Open Razorpay modal
   * 4. User completes payment
   * 5. On success: verify payment signature with backend
   * 6. Refresh article (status updated to payment_pending → writing)
   * 7. On failure: show error and retry
   */
  const pay = async () => {
    setBusy(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        throw new Error("Payment window failed to load. Please try again.");
      }
      
      const response = await createOrder([articleId]);
      const order = response.data;
      
      if (!order?.keyId || !order?.orderId) {
        throw new Error("Payment order could not be created. Please try again.");
      }
      
      new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ReleaseMYPR",
        description: `Publication fee for ${articleId}`,
        order_id: order.orderId,
        handler: async (payment) => {
          try {
            await verifyPayment({
              razorpayOrderId: payment.razorpay_order_id,
              razorpayPaymentId: payment.razorpay_payment_id,
              razorpaySignature: payment.razorpay_signature,
            });
            toast.success("Payment successful!");
            refresh();  // Reload article with updated status
          } catch (e) {
            toast.error(errorMessage(e) || "Payment verification failed. Please contact support.");
          }
        },
        theme: { color: "#2563eb" },  // Brand red color
      }).open();
    } catch (e) {
      const msg = errorMessage(e) || "Payment initialization failed";
      toast.error(msg);
      console.error("Payment error:", e);
    } finally {
      setBusy(false);
    }
  };

  /**
   * Save draft with loading state
   * Used for "Save" button in form
   */
  const saveDraft = async () => {
    setBusy(true);
    try {
      await save();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  /**
   * Generate article content using AI (Gemini)
   * 
   * Validation:
   * - Title and keywords required
   * - Prevent multiple simultaneous requests
   * 
   * Process:
   * 1. Show "Generating..." toast
   * 2. Call backend AI generation endpoint
   * 3. Receive generated content
   * 4. Update form state with generated content
   * 5. Show success/error message
   */
  const generateContent = async () => {
    if (!form.articleTitle.trim()) {
      toast.error("Please enter an article title");
      return;
    }
    if (!form.keywords.trim()) {
      toast.error("Please enter keywords");
      return;
    }

    // Prevent multiple requests
    if (generating) {
      toast.error("Please wait for content generation to complete");
      return;
    }

    setGenerating(true);
    let toastId;
    try {
      toastId = toast.loading("Generating article with AI (max 45 seconds)...");
      const response = await generateArticleContent(articleId, {
        title: form.articleTitle,
        keywords: form.keywords,
        resourceLink: form.refLink || undefined,
      });

      if (response.data?.content) {
        setForm({ ...form, content: response.data.content });
        toast.dismiss(toastId);
        toast.success("Article generated successfully!");
      } else {
        toast.dismiss(toastId);
        toast.error("No content was generated. Please try again.");
      }
    } catch (error) {
      toast.dismiss(toastId);
      const errorMsg = errorMessage(error);
      if (errorMsg.includes("took too long")) {
        toast.error("Generation took too long. Try simpler keywords.");
      } else {
        toast.error(errorMsg || "Failed to generate article content");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await downloadArticlePdf(articleId);
      const blob = response;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${form.articleTitle || "article"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to download PDF");
    }
  };

  const dataUrlToBlob = (dataUrl) => {
    const [header, encoded] = dataUrl.split(",");
    const mime = header.match(/data:(.*?);/)?.[1] || "image/jpeg";
    const bytes = atob(encoded);
    return new Blob([Uint8Array.from(bytes, (character) => character.charCodeAt(0))], { type: mime });
  };

  const uploadFile = async (file) => (await uploadArticleFile(articleId, file)).data;

  const downloadAttachedPdf = async () => {
    try {
      await downloadRemotePdf(article.articlePdfUrl, `${article.articleId}-attached.pdf`);
      toast.success("Attached PDF download started");
    } catch (error) {
      toast.error(error.message || "Unable to download attached PDF");
    }
  };


  const submit = async () => {
    setBusy(true);
    try {
      await save();
      const r = await submitArticle(articleId);
      toast.success(r.message);
      await refresh();
      setPreviewOpen(true);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  if (!article) return <p className="text-slate-500">Loading article…</p>;
  const canEdit =
    article.paymentStatus === "paid" &&
    !["submitted", "pending", "delivered"].includes(article.status);
  const articlePrice = Number(article.packagePrice || 0).toFixed(2);
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {article.articleId} · {article.category?.title}
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            {article.articleTitle || "Your article workspace"}
          </h1>
        </div>
        <StatusBadge status={article.status} />
      </div>
        {article.status === "Failed" && (
          <section className="card mt-7 border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            This article was marked Failed by the admin. You can edit it and submit it again for review.
          </section>
        )}
      {previewOpen && (
        <section className="card mt-7 border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Submission preview</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your article has been submitted. Use these actions to download the PDF or return to edit mode.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownloadPdf}
              >
                <Download size={17} />
                Download PDF
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setPreviewOpen(false)}
              >
                <Edit3 size={17} />
                Edit article
              </button>
            </div>
          </div>
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm font-semibold text-slate-500">Title</p>
              <p className="mt-1 text-slate-700">{article.articleTitle || "Untitled article"}</p>
            </div>
            {article.images && article.images.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-500">Images</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {article.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Article image ${idx + 1}`}
                      className="h-32 w-full rounded-lg border object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
            {article.refLink && (
              <div>
                <p className="text-sm font-semibold text-slate-500">Reference link</p>
                <a
                  href={article.refLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  {article.refLink}
                </a>
              </div>
            )}
            {article.articlePdfUrl && (
              <div>
                <p className="text-sm font-semibold text-slate-500">Attached article PDF</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={downloadAttachedPdf}><Download size={15} /> Download PDF</button>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">Content preview</p>
                <p className="mt-1 text-slate-700 whitespace-pre-line">
                  {article.content || "No content written yet."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
      {article.paymentStatus !== "paid" ? (
        <section className="card mt-7 border-amber-200 bg-amber-50 p-6">
          <div className="flex gap-4">
            <WalletCards className="mt-1 text-amber-700" />
            <div>
              <h2 className="font-bold">Complete the publication payment</h2>
              <p className="mt-1 text-sm text-amber-800">
                Pay ₹{articlePrice} to unlock the writing and submission workspace.
              </p>
              <button
                disabled={busy}
                onClick={pay}
                className="btn-primary mt-4"
              >
                Pay ₹{articlePrice}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="card mt-7 p-6">
            <div className="grid gap-5">
              <label className="label">
                Article title
                <input
                  disabled={!canEdit}
                  className="field"
                  value={form.articleTitle}
                  onChange={(e) =>
                    setForm({ ...form, articleTitle: e.target.value })
                  }
                />
              </label>
              <label className="label">
                Keywords{" "}
                <span className="font-normal text-slate-400">
                  (comma separated)
                </span>
                <input
                  disabled={!canEdit}
                  className="field"
                  value={form.keywords}
                  onChange={(e) =>
                    setForm({ ...form, keywords: e.target.value })
                  }
                />
              </label>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="label">
                  Article images
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      disabled={!canEdit}
                      className="field"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const input = e.currentTarget;
                        const files = input.files;
                        if (!files) return;
                        try {
                          const uploaded = [];
                          for (let i = 0; i < files.length; i++) {
                            const file = files[i];
                            const compressedImage = await compressImage(file, 1200, 0.75);
                            const result = await uploadFile(dataUrlToBlob(compressedImage));
                            uploaded.push(result.url);
                          }
                          setForm({ ...form, images: [...form.images, ...uploaded] });
                          await refresh();
                        } catch {
                          toast.error("Unable to read or compress the images.");
                        } finally {
                          input.value = "";
                        }
                      }}
                    />
                  </div>
                  {form.images.length > 0 && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {form.images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={img}
                            alt={`Article preview ${idx + 1}`}
                            className="max-h-48 rounded-xl border object-contain"
                          />
                          <button
                            type="button"
                            disabled={!canEdit}
                            className="btn-secondary absolute -right-2 -top-2 p-1 text-xs"
                            onClick={() =>
                              setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </label>
                <label className="label">
                  Completed article PDF
                  <input
                    disabled={!canEdit}
                    className="field"
                    type="file"
                    accept="application/pdf"
                    onChange={async (e) => {
                      const file = e.currentTarget.files?.[0];
                      if (!file) return;
                      try {
                        const result = await uploadFile(file);
                        setForm({ ...form, articlePdfUrl: result.url });
                        toast.success("Article PDF uploaded");
                      } catch (error) {
                        toast.error(errorMessage(error));
                      } finally {
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  {form.articlePdfUrl && (
                    <a className="mt-2 block text-sm text-blue-700 underline" href={form.articlePdfUrl} target="_blank" rel="noreferrer">
                      View uploaded PDF
                    </a>
                  )}
                </label>
                <label className="label">
                  Reference link
                  <input
                    disabled={!canEdit}
                    className="field"
                    type="url"
                    placeholder="https://example.com/resource"
                    value={form.refLink}
                    onChange={(e) =>
                      setForm({ ...form, refLink: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="label">
                Article content
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={generating || !form.articleTitle || !form.keywords || !canEdit}
                    onClick={generateContent}
                    className="btn-primary flex-1"
                    title={generating ? "Generating article content..." : "Generate article with AI (max 45 seconds)"}
                  >
                    <Sparkles size={16} />
                    {generating ? "Generating (45s max)..." : "Generate with AI"}
                  </button>
                </div>
                <textarea
                  disabled={!canEdit}
                  rows="15"
                  className="field leading-7"
                  placeholder="Write your article here…"
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </label>
            </div>
          </section>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            {previewOpen && (
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="btn-secondary"
              >
                Close preview
              </button>
            )}
            {["submitted", "pending", "delivered"].includes(
              article.status,
            ) && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownloadPdf}
              >
                <Download size={17} />
                Download PDF
              </button>
            )}
            {canEdit && (
              <>
                <button
                  disabled={busy}
                  onClick={saveDraft}
                  className="btn-secondary"
                >
                  <Save size={17} />
                  Save draft
                </button>
                <button
                  disabled={busy}
                  onClick={submit}
                  className="btn-primary"
                >
                  <Send size={17} />
                  Submit article
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
