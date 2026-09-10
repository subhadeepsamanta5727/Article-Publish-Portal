/* eslint-disable react-hooks/set-state-in-effect */
import { MessageSquareQuote, Pencil, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { errorMessage } from "../lib/api";
import {
  createAdminTestimonial,
  deleteAdminTestimonial,
  getAdminTestimonials,
  updateAdminTestimonial,
} from "../services/adminService";

const initial = { name: "", role: "", company: "", avatar: "", quote: "", isActive: true };

export default function AdminTestimonialsPage() {
  const [form, setForm] = useState(initial);
  const [testimonials, setTestimonials] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setTestimonials((await getAdminTestimonials()).data || []);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const edit = (testimonial) => {
    setEditingId(testimonial._id);
    setForm({ name: testimonial.name, role: testimonial.role, company: testimonial.company || "", avatar: testimonial.avatar || "", quote: testimonial.quote, isActive: testimonial.isActive });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancel = () => { setEditingId(null); setForm(initial); };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = editingId
        ? await updateAdminTestimonial(editingId, form)
        : await createAdminTestimonial(form);
      toast.success(result.message);
      cancel();
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (testimonial) => {
    if (!window.confirm(`Delete ${testimonial.name}'s testimonial?`)) return;
    try {
      toast.success((await deleteAdminTestimonial(testimonial._id)).message);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const toggleActive = async (testimonial) => {
    try {
      await updateAdminTestimonial(testimonial._id, { isActive: !testimonial.isActive });
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-blue-600">ADMINISTRATION</p>
      <h1 className="mt-1 text-3xl font-bold">Testimonials</h1>
      <p className="mt-2 text-slate-500">Manage the testimonials shown on the public landing page.</p>
      <div className="mt-8 grid gap-7 lg:grid-cols-[.9fr_1.1fr]">
        <form className="card p-6" onSubmit={submit}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><MessageSquareQuote className="text-blue-600" /><h2 className="text-lg font-bold">{editingId ? "Update testimonial" : "Add a testimonial"}</h2></div>
            {editingId && <button type="button" onClick={cancel} className="text-sm font-semibold text-blue-600">Cancel</button>}
          </div>
          <div className="mt-5 space-y-4">
            <label className="block label">Name<input required className="field" value={form.name} onChange={(event) => updateField("name", event.target.value)} /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block label">Role<input required className="field" value={form.role} onChange={(event) => updateField("role", event.target.value)} /></label><label className="block label">Company<input className="field" value={form.company} onChange={(event) => updateField("company", event.target.value)} /></label></div>
            <label className="block label">Profile photo URL<input className="field" type="url" placeholder="https://..." value={form.avatar} onChange={(event) => updateField("avatar", event.target.value)} /></label>
            <label className="block label">Quote<textarea required maxLength={500} rows={5} className="field resize-y" value={form.quote} onChange={(event) => updateField("quote", event.target.value)} /></label>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} />Show on landing page</label>
          </div>
          <button disabled={busy} className="btn-primary mt-6 disabled:opacity-50">{editingId ? <Save size={17} /> : <MessageSquareQuote size={17} />}{busy ? "Saving..." : editingId ? "Update testimonial" : "Add testimonial"}</button>
        </form>
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Published testimonials</h2><p className="mt-1 text-sm text-slate-500">Inactive entries stay saved but are hidden from visitors.</p></div><span className="text-sm font-semibold text-slate-500">{testimonials.length} total</span></div>
          {loading ? <p className="mt-6 text-sm text-slate-500">Loading testimonials...</p> : testimonials.length === 0 ? <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No testimonials created yet.</p> : <div className="mt-5 space-y-3">{testimonials.map((testimonial) => <article key={testimonial._id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{testimonial.name}</p><p className="text-sm text-slate-500">{testimonial.role}{testimonial.company ? ` at ${testimonial.company}` : ""}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${testimonial.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{testimonial.isActive ? "Visible" : "Hidden"}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">“{testimonial.quote}”</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => edit(testimonial)} className="btn-secondary px-3 py-2"><Pencil size={15} />Edit</button><button type="button" onClick={() => toggleActive(testimonial)} className="btn-secondary px-3 py-2">{testimonial.isActive ? "Hide" : "Show"}</button><button type="button" onClick={() => remove(testimonial)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"><Trash2 size={15} />Delete</button></div></article>)}</div>}
        </section>
      </div>
    </div>
  );
}
