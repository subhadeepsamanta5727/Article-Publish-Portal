import { Mail, MessageSquareText, Paperclip, Send } from "lucide-react";
import { useState } from "react";
import PublicPageLayout from "../components/layout/PublicPageLayout";
import api from "../lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [attachment, setAttachment] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [busy, setBusy] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus({ type: "", message: "" });
    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("phone", form.phone);
    payload.append("message", form.message);
    if (attachment) payload.append("attachment", attachment);
    try {
      await api.post("/contact", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm({ name: "", phone: "", message: "" });
      setAttachment(null);
      event.target.reset();
      setStatus({ type: "success", message: "Thanks. Your message has been sent to our team." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "We could not send your message. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicPageLayout
      eyebrow="Contact"
      title="Let’s talk about your next publication."
      intro="Reach the ReleaseMYPR team for account help, package questions, payment support, or an update on an active submission."
    >
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <form onSubmit={submitForm} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <MessageSquareText className="text-teal-700" size={24} />
            <h2 className="mt-0 text-xl font-bold text-slate-900">Send us a message</h2>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Name
              <input name="name" required value={form.name} onChange={updateField} className="field" placeholder="Your full name" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Phone number
              <input name="phone" required type="tel" value={form.phone} onChange={updateField} className="field" placeholder="Your phone number" />
            </label>
          </div>
          <label className="mt-5 block text-sm font-bold text-slate-700">
            Message
            <textarea name="message" required rows="6" value={form.message} onChange={updateField} className="field resize-y" placeholder="How can we help?" />
          </label>
          <label className="mt-5 block text-sm font-bold text-slate-700">
            Attachment <span className="font-normal text-slate-500">(optional)</span>
            <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 text-sm font-normal text-slate-600">
              <Paperclip size={17} className="text-teal-700" />
              <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(event) => setAttachment(event.target.files?.[0] || null)} className="min-w-0 flex-1 text-xs" />
            </span>
          </label>
          {status.message && (
            <p className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${status.type === "success" ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700"}`} role="status">
              {status.message}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full sm:w-auto">
            <Send size={16} /> {busy ? "Sending..." : "Send message"}
          </button>
        </form>
        <aside className="h-fit rounded-2xl border border-teal-200 bg-teal-50 p-6">
          <Mail className="text-teal-700" size={24} />
          <h2 className="mt-4 text-xl font-bold text-slate-900">Email support</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">You can also reach us directly for account, payment, or publishing questions.</p>
          <a href="mailto:hello@seo-portal.com" className="mt-4 inline-block font-bold text-teal-700">hello@seo-portal.com</a>
          <h3 className="mt-8">Please do not send</h3>
          <p className="text-sm leading-6 text-slate-600">Passwords, card numbers, CVV codes, or one-time passwords.</p>
        </aside>
      </div>
    </PublicPageLayout>
  );
}
