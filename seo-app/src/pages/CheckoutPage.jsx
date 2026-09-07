import { ArrowLeft, CreditCard, PackageCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { errorMessage } from "../lib/api";
import { createOrder, verifyPayment } from "../services/paymentService";

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const articleIds = state?.articleIds || [];
  const total = Number(state?.totalAmount || 0);
  
  const pay = async () => {
    setBusy(true);
    try {
      if (!(await loadRazorpay())) {
        throw new Error("Payment window failed to load. Please try again.");
      }
      
      const order = (await createOrder(articleIds)).data;
      
      if (!order?.keyId || !order?.orderId) {
        throw new Error("Payment order could not be created. Please try again.");
      }
      
      new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "SEO",
        description: `Payment for ${order.totalArticles} article${order.totalArticles === 1 ? "" : "s"}`,
        order_id: order.orderId,
        handler: async (payment) => {
          try {
            const verified = await verifyPayment({
              razorpayOrderId: payment.razorpay_order_id,
              razorpayPaymentId: payment.razorpay_payment_id,
              razorpaySignature: payment.razorpay_signature,
            });
            toast.success("Payment successful! Redirecting...");
            navigate("/articles/drafts", { replace: true });
          } catch (error) {
            toast.error(errorMessage(error) || "Payment verification failed. Please contact support.");
          }
        },
        theme: { color: "#2563eb" },
      }).open();
    } catch (error) {
      const msg = errorMessage(error) || "Payment initialization failed";
      toast.error(msg);
      console.error("Payment error:", error);
    }
    finally { setBusy(false); }
  };
  if (!articleIds.length) return <div className="mx-auto max-w-xl card p-8 text-center"><h1 className="text-2xl font-bold">No checkout is ready</h1><p className="mt-2 text-slate-500">Select packages before continuing to payment.</p><Link className="btn-primary mt-6" to="/articles/new">Choose packages</Link></div>;
  return <div className="mx-auto max-w-3xl"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600" to="/articles/new"><ArrowLeft size={16} /> Back to package selection</Link><div className="card mt-5 p-6 sm:p-8"><PackageCheck className="text-blue-600" size={30} /><p className="mt-5 text-sm font-semibold text-blue-600">CHECKOUT</p><h1 className="mt-1 text-3xl font-bold">Review your publication order</h1><p className="mt-2 text-slate-500">One secure payment unlocks all {articleIds.length} article submissions.</p><div className="mt-7 rounded-xl bg-slate-50 p-5"><div className="flex justify-between text-sm"><span>Article quantity</span><span className="font-semibold">{articleIds.length}</span></div><div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg"><span className="font-bold">Total</span><span className="font-bold text-blue-700">₹{total.toFixed(2)}</span></div><p className="mt-3 text-xs text-slate-500">The backend recalculates the final amount before Razorpay opens.</p></div><button disabled={busy} onClick={pay} className="btn-primary mt-6 w-full"><CreditCard size={18} />{busy ? "Preparing payment..." : `Pay ₹${total.toFixed(2)}`}</button></div></div>;
}
