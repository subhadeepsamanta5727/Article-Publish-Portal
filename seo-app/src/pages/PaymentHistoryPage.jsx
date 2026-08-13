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
import { Download, Eye, Receipt, X } from "lucide-react";
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
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-red-600">ACCOUNT</p>
      <h1 className="mt-1 text-3xl font-bold">
        {isAdmin ? "All Payments" : "Payment history"}
      </h1>
      <p className="mt-2 text-slate-500">
        {isAdmin
          ? "View all user payments and package details."
          : "View article quantities and package details."}
      </p>
      {/* Search/Filter Section */}
      <div className="card mt-8 flex flex-wrap items-end gap-3 p-4">
        <label className="text-xs font-semibold text-slate-500">
          Payment ID
          <input
            className="field mt-1"
            placeholder="Search payment ID"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
          />
        </label>
        <button className="btn-primary" onClick={load}>
          Filter
        </button>
      </div>

      {/* Payment Records List */}
      {loading ? (
        <p className="p-10 text-center text-sm text-slate-500">
          Loading payments...
        </p>
      ) : !payments.filter((p) => p.status === "paid").length ? (
          <p className="p-10 text-center text-sm text-slate-500">
            No successful payments found.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments
              .filter((p) => p.status === "paid")
              .map((payment) => (
              <div
                className="flex flex-wrap items-center justify-between gap-4 p-5"
                key={payment._id}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <Receipt className="text-red-600" />
                    <div>
                      <p className="font-semibold">Payment ID: {payment._id}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(
                          payment.paidAt || payment.createdAt,
                        ).toLocaleString()}{" "}
                        · Quantity: {quantity(payment)}
                      </p>
                      <p className="text-sm font-semibold text-red-600">
                        Amount: ₹{(payment.amount / 100).toFixed(2)}
                      </p>
                      {isAdmin && payment.userId && (
                        <p className="text-sm text-slate-500">
                          User: {payment.userId.name} ({payment.userId.email})
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(payment.packageSummary || []).map((item) => (
                      <span
                        className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                        key={`${payment._id}-${item.packageName}`}
                      >
                        {item.packageName} ·{" "}
                        {item.packageId?.category || "Category unavailable"}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary px-3 py-2"
                    onClick={() => setView(payment)}
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    className="btn-secondary px-3 py-2"
                    onClick={() => download(payment)}
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      
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
                <dd className="font-semibold text-red-600">₹{(view.amount / 100).toFixed(2)}</dd>
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
