import { FileText, LockKeyhole, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";
import PublicPageLayout from "../components/layout/PublicPageLayout";

const legalPages = [
  {
    to: "/privacy-policy",
    icon: LockKeyhole,
    title: "Privacy Policy",
    text: "How ReleaseMYPR collects, uses, and protects account and publishing information.",
  },
  {
    to: "/terms-of-service",
    icon: FileText,
    title: "Terms of Service",
    text: "The rules and responsibilities that apply when you use the platform.",
  },
  {
    to: "/payment-policy",
    icon: ReceiptText,
    title: "Payment Policy",
    text: "Payment processing, successful orders, cancellations, and refund guidance.",
  },
];

export default function LegalPage() {
  return (
    <PublicPageLayout
      eyebrow="Legal"
      title="Policies for a clear publishing relationship."
      intro="Review the policies that explain how ReleaseMYPR handles your information, account, content, and payments."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {legalPages.map(({ to, icon: Icon, title, text }) => (
          <Link
            key={to}
            to={to}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <Icon size={21} />
            </span>
            <h2 className="mt-5 text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            <span className="mt-4 inline-block text-sm font-bold text-teal-700">Read policy</span>
          </Link>
        ))}
      </div>
      <p className="mt-10 text-sm leading-6 text-slate-600">
        Questions about these policies can be sent to <a href="mailto:hello@seo-portal.com">hello@seo-portal.com</a>.
      </p>
    </PublicPageLayout>
  );
}
