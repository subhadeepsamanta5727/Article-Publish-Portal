/**
 * PAYMENT HISTORY PAGE
 * 
 * Dual-mode page for displaying payment records
 * Mode determined by user.role from AuthContext
 * 
 * USER MODE (role !== "admin"):
 * - Shows only current user's payments
 * - Filters: Only paid/successful transactions
 * - Displays: Payment ID, amount, date, articles, packages
 * - Actions: Download payment PDF (user-level, no admin info)
 * 
 * ADMIN MODE (role === "admin"):
 * - Shows ALL payments from all users in the system
 * - Filters: Only paid/successful transactions
 * - Displays: Same as user mode PLUS user name/email
 * - Actions: Download payment PDF with full admin details
 * 
 * Filtering:
 * - paymentId search box (optional)
 * - Backend filters to only return status === "paid"
 * 
 * Data Flow:
 * 1. Component detects user role from context
 * 2. Selects appropriate API endpoint (getPayments vs getAllPayments)
 * 3. Fetches payments with optional search filter
 * 4. Maps payment data to table rows
 * 5. User can download PDF or view details modal
 */
import { Download, Eye, Receipt, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { errorMessage } from "../lib/api";
import { downloadPaymentPdf } from "../services/articleService";
import { getPayments, getAllPayments } from "../services/paymentService";
import { useAuth } from "../context/AuthContext";

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);           // List of payment records
  const [paymentId, setPaymentId] = useState("");         // Search filter input
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState(null);                 // Selected payment for detail modal
  const [loading, setLoading] = useState(true);           // Data fetching state
  const isAdmin = user?.role === "admin";                 // Role detection

  /**
   * Fetch payments based on user role
   * 
   * USER MODE: Calls getPayments (user-level, current user only)
   * ADMIN MODE: Calls getAllPayments (system-wide, all users)
   * 
   * Both endpoints filter to only return paid/successful payments
   * Optional paymentId search parameter
   */
  const load = () => {
    setLoading(true);
    const fetchFn = isAdmin ? getAllPayments : getPayments;  // Select endpoint based on role
    fetchFn({ paymentId: paymentId || undefined })
      .then((r) => setPayments(r.data || []))
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  // Load payments when component mounts or role changes
  useEffect(() => {
    // The loader updates fetch state around an asynchronous request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  /**
   * Calculate article quantity from payment record
   * Handles two possible data structures:
   * 1. articleIds array: Count array length
   * 2. packageSummary array: Sum quantity fields
   * 
   * @param {Object} payment - Payment record
   * @returns {number} Total article quantity
   */
  const quantity = (payment) =>
    payment.articleIds?.length ||
    payment.packageSummary?.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    ) ||
    0;

  const visiblePayments = payments
    .filter((payment) => {
      if (filter === "paid") return payment.status === "paid";
      if (filter === "pending") return ["created", "pending"].includes(payment.status);
      if (filter === "failed") return ["failed", "Failed"].includes(payment.status);
      return true;
    })
    .filter((payment) => !paymentId || payment._id.toLowerCase().includes(paymentId.toLowerCase()));

  const statusStyle = (status) => ({
    paid: "bg-emerald-500",
    created: "bg-amber-500",
    pending: "bg-amber-500",
    failed: "bg-rose-500",
    Failed: "bg-rose-500",
  }[status] || "bg-slate-500");

  /**
   * Download payment PDF to user's device
   * 
   * Process:
   * 1. Fetch PDF blob from backend
   * 2. Create local blob URL
   * 3. Create temporary download link
   * 4. Trigger browser download
   * 5. Revoke blob URL to free memory
   * 
   * @param {Object} payment - Payment record to download
   */
  const download = async (payment) => {
    try {
      const blob = await downloadPaymentPdf(payment._id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payment-${payment._id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-2">
        <div>
          <p className="text-sm font-semibold text-blue-600">ACCOUNT</p>
          <h1 className="mt-1 text-3xl font-bold">{isAdmin ? "All Payments" : "Payment history"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
            <Search size={15} />
            <input className="w-36 bg-transparent outline-none placeholder:text-slate-400" placeholder="Payment ID" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} />
          </label>
          <button className="btn-primary px-3 py-2" onClick={load}>Filter</button>
        </div>
      </div>
      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 pt-1">
          {[['all', 'All payments']].map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className={`relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition ${filter === value ? "text-blue-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
              {label}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Loading payments...</p>
        ) : !visiblePayments.length ? (
        <p className="p-10 text-center text-sm text-slate-500">No payments found for this view.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[900px] grid-cols-[1.25fr_1fr_1.5fr_0.8fr_0.9fr_0.9fr_90px] items-center gap-3 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Payment ID</span><span>Created</span><span>{isAdmin ? "Customer" : "Articles"}</span><span>Quantity</span><span>Total</span><span>Status</span><span>Actions</span>
          </div>
          {visiblePayments.map((payment) => (
            <div className="grid min-w-[900px] grid-cols-[1.25fr_1fr_1.5fr_0.8fr_0.9fr_0.9fr_90px] items-center gap-3 whitespace-nowrap border-b border-slate-200 px-4 py-3 last:border-0 hover:bg-slate-50" key={payment._id}>
              <button className="truncate text-left text-sm font-semibold text-blue-600 hover:text-blue-800" onClick={() => setView(payment)}>{payment._id}</button>
              <span className="text-sm text-slate-600">{new Date(payment.paidAt || payment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700"><Receipt className="shrink-0 text-slate-400" size={17} /><span className="truncate">{isAdmin && payment.userId ? payment.userId.name : `${quantity(payment)} article${quantity(payment) === 1 ? "" : "s"}`}</span></span>
              <span className="text-sm text-slate-600">{quantity(payment)}</span>
              <span className="text-sm font-semibold text-slate-700">₹{(payment.amount / 100).toFixed(2)}</span>
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold capitalize text-white ${statusStyle(payment.status)}`}><span className="h-1.5 w-1.5 rounded-full bg-white/80" />{payment.status}</span>
              <div className="flex items-center gap-1">
                <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => setView(payment)} aria-label={`View payment ${payment._id}`}><Eye size={16} /></button>
                <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => download(payment)} aria-label={`Download payment ${payment._id}`}><Download size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      </section>
      
      {view && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">Payment details</h2>
              <button onClick={() => setView(null)}>
                <X size={20} />
              </button>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Payment ID</dt>
                <dd className="font-semibold break-all">{view._id}</dd>
              </div>
              {isAdmin && view.userId && (
                <>
                  <div>
                    <dt className="text-slate-500">User Name</dt>
                    <dd className="font-semibold">{view.userId.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">User Email</dt>
                    <dd className="font-semibold break-all">{view.userId.email}</dd>
                  </div>
                </>
              )}
              <div>
                <dt className="text-slate-500">Quantity</dt>
                <dd className="font-semibold">{quantity(view)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Amount</dt>
                <dd className="font-semibold text-blue-600">₹{(view.amount / 100).toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="font-semibold capitalize">{view.status}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Packages</dt>
                <dd className="font-semibold">
                  {(view.packageSummary || [])
                    .map(
                      (item) =>
                        `${item.packageName} · ${item.packageId?.category || "Category unavailable"}`,
                    )
                    .join(", ")}
                </dd>
              </div>
            </dl>
            <button
              className="btn-primary mt-6 w-full"
              onClick={() => download(view)}
            >
              <Download size={16} />
              Download payment PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
