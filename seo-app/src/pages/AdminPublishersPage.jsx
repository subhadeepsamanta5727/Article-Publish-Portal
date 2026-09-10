/* eslint-disable react-hooks/set-state-in-effect */
import { ArrowDownUp, Globe2, Pencil, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { errorMessage } from "../lib/api";
import {
  createAdminPublisher,
  deleteAdminPublisher,
  getAdminPublishers,
  setPublisherAvailability,
  updateAdminPublisher,
} from "../services/adminService";

const initial = {
  publisherName: "",
  category: "",
  subCategory: "",
  tag: "",
  followers: "",
  website: "",
  sampleReportLink: "",
  costPrice: "",
  margin: "",
  marginCategory: "percentage",
  currency: "INR",
};

export default function AdminPublishersPage() {
  const [form, setForm] = useState(initial);
  const [publishers, setPublishers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publisherSort, setPublisherSort] = useState("asc");

  const price = useMemo(() => {
    const cost = Number(form.costPrice) || 0;
    const margin = Number(form.margin) || 0;
    return form.marginCategory === "percentage"
      ? cost + (cost * margin) / 100
      : cost + margin;
  }, [form.costPrice, form.margin, form.marginCategory]);
  const sortedPublishers = useMemo(
    () =>
      [...publishers].sort(
        (first, second) =>
          (Number(first.price) - Number(second.price)) *
          (publisherSort === "asc" ? 1 : -1),
      ),
    [publishers, publisherSort],
  );

  const load = async () => {
    setLoading(true);
    try {
      setPublishers((await getAdminPublishers()).data || []);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const edit = (publisher) => {
    setEditingId(publisher.publisherId);
    setForm({
      publisherName: publisher.publisherName,
      category: publisher.category || "",
      subCategory: publisher.subCategory || "",
      tag: publisher.tag || "",
      followers: publisher.followers || "",
      website: publisher.website || "",
      sampleReportLink: publisher.sampleReportLink || "",
      costPrice: String(publisher.costPrice),
      margin: String(publisher.margin),
      marginCategory: publisher.marginCategory,
      currency: publisher.currency || "INR",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = () => {
    setEditingId(null);
    setForm(initial);
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        costPrice: Number(form.costPrice),
        margin: Number(form.margin),
      };
      const result = editingId
        ? await updateAdminPublisher(editingId, payload)
        : await createAdminPublisher(payload);
      toast.success(
        editingId
          ? result.message
          : `${result.message} (${result.data.publisherId})`,
      );
      cancel();
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (publisher) => {
    if (!window.confirm(`Delete ${publisher.publisherName}?`)) return;
    try {
      toast.success(
        (await deleteAdminPublisher(publisher.publisherId)).message,
      );
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const field = (name, label, type = "text") => (
    <label className="block label" key={name}>
      {label}
      <input
        required={
          name === "publisherName" || name === "costPrice" || name === "margin"
        }
        className="field"
        type={type}
        min={type === "number" ? "0" : undefined}
        value={form[name]}
        onChange={(event) => updateField(name, event.target.value)}
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-blue-600">ADMINISTRATION</p>
      <h1 className="mt-1 text-3xl font-bold">Individual publishers</h1>
      <div className="mt-8 grid gap-7 lg:grid-cols-[.9fr_1.1fr]">
        <form className="card p-6" onSubmit={submit}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Globe2 className="text-blue-600" />
              <h2 className="text-lg font-bold">
                {editingId ? "Update publisher" : "Add a publisher"}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={cancel}
                className="text-sm font-semibold text-blue-600"
              >
                Cancel
              </button>
            )}
          </div>
          {!editingId && (
            <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              Publisher ID is generated automatically when saved.
            </p>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {field("publisherName", "Publisher name")}
            {field("category", "Category")}
            {field("subCategory", "Sub-category")}
            {field("tag", "Tag")}
            {field("followers", "Followers")}
            {field("website", "Website", "url")}
            {field("sampleReportLink", "Sample report link", "url")}
            {field("costPrice", "Cost price (INR)", "number")}
            <label className="block label">
              Margin type
              <select
                className="field"
                value={form.marginCategory}
                onChange={(event) =>
                  updateField("marginCategory", event.target.value)
                }
              >
                <option value="percentage">Percentage</option>
                <option value="amount">Fixed amount</option>
              </select>
            </label>
            {field(
              "margin",
              form.marginCategory === "percentage"
                ? "Margin (%)"
                : "Margin (INR)",
              "number",
            )}
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              Selling price: <strong>INR {price.toFixed(2)}</strong>
            </div>
          </div>
          <button
            disabled={busy}
            className="btn-primary mt-6 disabled:opacity-50"
          >
            {editingId ? <Save size={17} /> : <Globe2 size={17} />}
            {busy
              ? "Saving..."
              : editingId
                ? "Update publisher"
                : "Create publisher"}
          </button>
        </form>

        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Publisher catalogue</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage individual publisher availability and pricing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPublisherSort((current) =>
                    current === "asc" ? "desc" : "asc",
                  )
                }
                className="btn-secondary px-3 py-2"
                aria-label={`Sort publishers by price ${publisherSort === "asc" ? "descending" : "ascending"}`}
              >
                <ArrowDownUp size={15} />
                Price: {publisherSort === "asc" ? "Low to high" : "High to low"}
              </button>
              <span className="text-sm font-semibold text-slate-500">
                {publishers.length} total
              </span>
            </div>
          </div>
          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading publishers...</p>
          ) : publishers.length === 0 ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No publishers created yet.
            </p>
          ) : (
            <div className="mt-5 max-h-128 space-y-3 overflow-y-auto pr-1">
              {sortedPublishers.map((publisher) => (
                <div
                  key={publisher.publisherId}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">{publisher.publisherName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {publisher.category} · {publisher.publisherId}
                      </p>
                      <p className="mt-2 font-semibold text-blue-700">
                        INR {Number(publisher.price || 0).toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${publisher.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {publisher.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => edit(publisher)}
                      className="btn-secondary px-3 py-2"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await setPublisherAvailability(
                            publisher.publisherId,
                            !publisher.isActive,
                          );
                          await load();
                        } catch (error) {
                          toast.error(errorMessage(error));
                        }
                      }}
                      className="btn-secondary px-3 py-2"
                    >
                      {publisher.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(publisher)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
