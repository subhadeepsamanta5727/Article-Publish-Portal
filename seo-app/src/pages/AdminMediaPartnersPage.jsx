/* eslint-disable react-hooks/set-state-in-effect */
import { Images, Pencil, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { errorMessage } from "../lib/api";
import {
  createAdminMediaPartner,
  deleteAdminMediaPartner,
  getAdminMediaPartners,
  updateAdminMediaPartner,
} from "../services/adminService";

const initial = { name: "", logoUrl: "", link: "", logo: null, isActive: true };

export default function AdminMediaPartnersPage() {
  const [form, setForm] = useState(initial);
  const [partners, setPartners] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setPartners((await getAdminMediaPartners()).data || []);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const edit = (partner) => {
    setEditingId(partner._id);
    setForm({ name: partner.name, logoUrl: partner.logoUrl, link: partner.link, logo: null, isActive: partner.isActive });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancel = () => { setEditingId(null); setForm(initial); };
  const chooseLogo = (event) => {
    const logo = event.target.files?.[0] || null;
    if (logo && !logo.type.startsWith("image/")) return toast.error("Please select an image file.");
    if (logo && logo.size > 5 * 1024 * 1024) return toast.error("Logo image must be smaller than 5MB.");
    setForm((current) => ({ ...current, logo, logoUrl: logo ? URL.createObjectURL(logo) : current.logoUrl }));
  };
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("link", form.link);
      payload.append("isActive", String(form.isActive));
      if (form.logo) payload.append("logo", form.logo);
      else if (form.logoUrl) payload.append("logoUrl", form.logoUrl);
      const result = editingId ? await updateAdminMediaPartner(editingId, payload) : await createAdminMediaPartner(payload);
      toast.success(result.message);
      cancel();
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (partner) => {
    if (!window.confirm(`Delete ${partner.name} from the scrolling section?`)) return;
    try {
      toast.success((await deleteAdminMediaPartner(partner._id)).message);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  const toggleActive = async (partner) => {
    try {
      await updateAdminMediaPartner(partner._id, { isActive: !partner.isActive });
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-blue-600">ADMINISTRATION</p>
      <h1 className="mt-1 text-3xl font-bold">Scrolling media section</h1>
      <p className="mt-2 text-slate-500">Control the logo, name, and destination link shown in the landing-page marquee.</p>
      <div className="mt-8 grid gap-7 lg:grid-cols-[.9fr_1.1fr]">
        <form className="card p-6" onSubmit={submit}>
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Images className="text-blue-600" /><h2 className="text-lg font-bold">{editingId ? "Update media item" : "Add media item"}</h2></div>{editingId && <button type="button" onClick={cancel} className="text-sm font-semibold text-blue-600">Cancel</button>}</div>
          <div className="mt-5 space-y-4">
            <label className="block label">Media name<input required className="field" value={form.name} onChange={(event) => updateField("name", event.target.value)} /></label>
            <label className="block label">Logo image<input className="field" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={chooseLogo} required={!editingId && !form.logoUrl} /></label>
            {form.logoUrl && <img src={form.logoUrl} alt="Selected logo preview" className="h-16 w-16 rounded-lg border border-slate-200 object-contain p-1" />}
            <label className="block label">Destination link<input required className="field" type="url" placeholder="https://..." value={form.link} onChange={(event) => updateField("link", event.target.value)} /></label>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} />Show in scrolling section</label>
          </div>
          <button disabled={busy} className="btn-primary mt-6 disabled:opacity-50">{editingId ? <Save size={17} /> : <Upload size={17} />}{busy ? "Uploading..." : editingId ? "Update media item" : "Upload media item"}</button>
        </form>
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Scrolling media items</h2><p className="mt-1 text-sm text-slate-500">Visible items appear on the public landing page.</p></div><span className="text-sm font-semibold text-slate-500">{partners.length} total</span></div>
          {loading ? <p className="mt-6 text-sm text-slate-500">Loading media items...</p> : partners.length === 0 ? <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No media items created yet.</p> : <div className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto pr-2">{partners.map((partner) => <article key={partner._id} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4"><img src={partner.logoUrl} alt={`${partner.name} logo`} className="h-12 w-12 rounded-lg border border-slate-100 object-contain p-1" /><div className="min-w-0 flex-1"><p className="font-bold">{partner.name}</p><a href={partner.link} target="_blank" rel="noreferrer" className="block truncate text-sm text-blue-600 hover:underline">{partner.link}</a><span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${partner.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{partner.isActive ? "Visible" : "Hidden"}</span></div><div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => edit(partner)} className="btn-secondary px-3 py-2"><Pencil size={15} />Edit</button><button type="button" onClick={() => toggleActive(partner)} className="btn-secondary px-3 py-2">{partner.isActive ? "Hide" : "Show"}</button><button type="button" onClick={() => remove(partner)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"><Trash2 size={15} />Delete</button></div></article>)}</div>}
        </section>
      </div>
    </div>
  );
}
