const labels = {
  draft: "Draft",
  payment_pending: "Payment pending",
  writing: "Writing",
  submitted: "Submitted",
  under_review: "Under Processing",
  accepted: "Published",
  rejected: "Failed",
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
};
const colors = {
  draft: "bg-slate-100 text-slate-600",
  payment_pending: "bg-amber-100 text-amber-700",
  writing: "bg-blue-100 text-blue-700",
  submitted: "bg-violet-100 text-violet-700",
  under_review: "bg-red-100 text-red-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-rose-100 text-rose-700",
};
export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] || colors.draft}`}
    >
      {labels[status] || status}
    </span>
  );
}
