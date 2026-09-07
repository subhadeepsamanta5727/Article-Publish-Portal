/* eslint-disable react-hooks/set-state-in-effect */

import {
  ArrowDown,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  FilePlus2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import SubmissionProgress from "../components/ui/SubmissionProgress";
import { errorMessage } from "../lib/api";
import { createArticle } from "../services/articleService";
import { getActivePackages, getActivePublishers } from "../services/packageService";

const initialAuthor = {
  name: "",
  email: "",
  phone: "",
};

export default function CreateArticlePage() {
  // ======================================
  // STATE
  // ======================================

  const [author, setAuthor] = useState(initialAuthor);
  const [packages, setPackages] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [selected, setSelected] = useState({});
  const [selectedPublishers, setSelectedPublishers] = useState({});
  const [expanded, setExpanded] = useState({});
  const [expandedPublishers, setExpandedPublishers] = useState({});
  const [catalogueMode, setCatalogueMode] = useState("packages");
  const [priceSort, setPriceSort] = useState("asc");
  const [quantity, setQuantity] = useState(1);

  const [step, setStep] = useState(1);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [busy, setBusy] = useState(false);

  // ======================================
  // NAVIGATION / AUTH
  // ======================================

  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  // ======================================
  // REDIRECT ADMIN
  // ======================================

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin", {
        replace: true,
      });
    }
  }, [isAdmin, navigate]);

  // ======================================
  // GET ACTIVE PACKAGES
  // ======================================

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const [packageResponse, publisherResponse] = await Promise.all([
          getActivePackages(),
          getActivePublishers(),
        ]);
        setPackages(packageResponse?.data || []);
        setPublishers(publisherResponse?.data || []);
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, []);

  // ======================================
  // SELECTED ITEMS
  // ======================================

  const items = useMemo(() => {
    return packages
      .filter((pkg) => selected[pkg._id])
      .map((pkg) => ({
        ...pkg,
        quantity,
      }));
  }, [packages, selected, quantity]);

  const publisherItems = useMemo(() => {
    return publishers
      .filter((publisher) => selectedPublishers[publisher._id])
      .map((publisher) => ({
        ...publisher,
        quantity,
      }));
  }, [publishers, selectedPublishers, quantity]);

  const catalogueItems = useMemo(() => {
    const source = catalogueMode === "packages" ? packages : publishers;
    return [...source].sort((first, second) => (Number(first.price || 0) - Number(second.price || 0)) * (priceSort === "asc" ? 1 : -1));
  }, [catalogueMode, packages, publishers, priceSort]);

  // ======================================
  // TOTAL
  // ======================================

  const total = useMemo(() => {
    const packageTotal = items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 0;

      return sum + price * itemQuantity;
    }, 0);
    return packageTotal + publisherItems.reduce((sum, item) => {
      return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
    }, 0);
  }, [items, publisherItems]);

  // ======================================
  // UPDATE AUTHOR
  // ======================================

  const updateAuthor = (field, value) => {
    setAuthor((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // ======================================
  // AUTHOR INPUT
  // ======================================

  const text = (field, label, required = false) => (
    <label className="block label" key={field}>
      {label}

      <input
        required={required}
        className="field"
        value={author[field]}
        onChange={(event) =>
          updateAuthor(field, event.target.value)
        }
      />
    </label>
  );

  // ======================================
  // TOGGLE PACKAGE
  // ======================================

  const togglePackage = (id, checked) => {
    setSelected((current) => {
      const next = {
        ...current,
      };

      if (checked) {
        next[id] = true;
      } else {
        delete next[id];
      }

      return next;
    });
  };

  const togglePublisher = (id, checked) => {
    setSelectedPublishers((current) => {
      const next = { ...current };
      if (checked) next[id] = true;
      else delete next[id];
      return next;
    });
  };

  // ======================================
  // TOGGLE PACKAGE DETAILS
  // ======================================

  const toggleExpanded = (id) => {
    setExpanded((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const togglePublisherExpanded = (id) => {
    setExpandedPublishers((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  // ======================================
  // VALIDATE AUTHOR
  // ======================================

  const validateAuthor = () => {
    const name = author.name.trim();
    const email = author.email.trim();
    const phone = author.phone.trim();

    if (!name) {
      toast.error("Please enter your full name.");
      return false;
    }

    if (!email) {
      toast.error("Please enter your email address.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (!phone) {
      toast.error("Please enter your phone number.");
      return false;
    }

    return true;
  };

  // ======================================
  // GO TO PACKAGE STEP
  // ======================================

  const handleNextStep = () => {
    if (!validateAuthor()) {
      return;
    }

    setStep(2);
  };

  // ======================================
  // SUBMIT ARTICLE
  // ======================================

  const submit = async (event) => {
    event.preventDefault();

    // Validate packages
    const selectedItems = catalogueMode === "packages" ? items : publisherItems;
    if (!selectedItems.length) {
      toast.error(catalogueMode === "packages" ? "Select at least one publication package." : "Select at least one individual publisher.");
      return;
    }

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error("Enter a quantity of at least 1.");
      return;
    }

    setBusy(true);

    try {
      const response = await createArticle({
        author: {
          name: author.name.trim(),
          email: author.email.trim(),
          phone: author.phone.trim(),
        },

        ...(catalogueMode === "packages"
          ? { packageItems: items.map((item) => ({ packageId: item._id, quantity })) }
          : { publisherItems: publisherItems.map((item) => ({ publisherId: item._id, quantity })) }),
      });

      toast.success(
        response?.message || "Article created successfully."
      );

      const articleIds = response?.data?.articleIds || [];
      const totalAmount = Number(
        response?.data?.totalAmount || total
      );

      if (!articleIds.length) {
        toast.error("Article IDs were not returned by the server.");
        return;
      }

      // Go to payment
      navigate("/checkout", {
        state: {
          articleIds,
          totalAmount,
        },
      });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  // ======================================
  // RENDER
  // ======================================

  return (
    <div className="mx-auto max-w-4xl">
      {/* ======================================
          HEADER
      ====================================== */}

      <p className="text-sm font-semibold text-blue-600">
        START A SUBMISSION
      </p>

      <h1 className="mt-1 text-3xl font-bold">
        Choose publication packages
      </h1>

      <p className="mt-2 text-slate-500">
        Enter your details, select packages and article quantity,
        then pay once.
      </p>

      {/* ======================================
          PROGRESS
      ====================================== */}

      <div className="mt-7">
        <SubmissionProgress currentStep={step} />
      </div>

      {/* ======================================
          FORM
      ====================================== */}

      <form
        className="space-y-6"
        onSubmit={submit}
      >
        {/* ======================================
            STEP 1
        ====================================== */}

        {step === 1 ? (
          <section className="card p-6">
            <h2 className="text-lg font-bold">
              Author information
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {text("name", "Full name", true)}

              {text("email", "Email address", true)}

              {text("phone", "Phone number", true)}
            </div>
          </section>
        ) : (
          /* ======================================
              STEP 2
          ====================================== */

          <section className="card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Publication options</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Check a package and use the arrow to view its
                  details.
                </p>
              </div>

              <span className="font-bold text-blue-700">
                Total: INR {total.toFixed(2)}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Publication options">
              <button
                type="button"
                role="tab"
                aria-selected={catalogueMode === "packages"}
                onClick={() => setCatalogueMode("packages")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${catalogueMode === "packages" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Publication packages
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={catalogueMode === "publishers"}
                onClick={() => setCatalogueMode("publishers")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${catalogueMode === "publishers" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Individual publishers
              </button>
            </div>

            {/* ======================================
                LOADING
            ====================================== */}

            {loadingPackages ? (
              <p className="mt-5 text-sm text-slate-500">
                Loading packages...
              </p>
            ) : catalogueItems.length === 0 ? (
              <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                No active {catalogueMode === "packages" ? "publication packages" : "individual publishers"} are available.
              </p>
            ) : (
              <>
                {/* ======================================
                    PACKAGE LIST
                ====================================== */}

                <div className="mt-5 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setPriceSort((current) => current === "asc" ? "desc" : "asc")}
                    className="btn-secondary px-3 py-2"
                    aria-label={`Sort ${catalogueMode === "packages" ? "packages" : "publishers"} by price ${priceSort === "asc" ? "descending" : "ascending"}`}
                  >
                    <ArrowDownUp size={15} />
                    Price: {priceSort === "asc" ? "Low to high" : "High to low"}
                  </button>
                </div>

                <div className="mt-3 max-h-[52vh] space-y-3 overflow-y-auto pr-2">
                  {catalogueItems.map((pkg) => {
                    const isPublisher = catalogueMode === "publishers";
                    const itemId = pkg._id;
                    const isSelected = Boolean(
                      isPublisher ? selectedPublishers[itemId] : selected[itemId]
                    );

                    const isExpanded = Boolean(
                      isPublisher ? expandedPublishers[itemId] : expanded[itemId]
                    );

                    return (
                      <div
                        key={pkg._id}
                        className={`rounded-xl border p-4 transition-colors ${
                          isSelected
                            ? "border-blue-300 bg-blue-50/50"
                            : "border-slate-200"
                        }`}
                      >
                        {/* PACKAGE HEADER */}

                        <div className="flex items-center gap-3">
                          {/* CHECKBOX */}

                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-blue-600"
                            checked={isSelected}
                            onChange={(event) =>
                              isPublisher
                                ? togglePublisher(itemId, event.target.checked)
                                : togglePackage(itemId, event.target.checked)
                            }
                          />

                          {/* PACKAGE INFO */}

                          <div className="min-w-0 flex-1">
                            <p className="font-bold">
                              {isPublisher ? pkg.publisherName : pkg.packageName}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {pkg.category}
                            </p>
                          </div>

                          {/* PRICE */}

                          <span className="font-bold text-blue-700">
                            INR{" "}
                            {Number(pkg.price || 0).toFixed(2)}
                          </span>

                          {/* EXPAND */}

                          <button
                            type="button"
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
                            onClick={() =>
                                  isPublisher ? togglePublisherExpanded(itemId) : toggleExpanded(itemId)
                            }
                            aria-label="Toggle package details"
                          >
                            {isExpanded ? (
                              <ArrowUp size={18} />
                            ) : (
                              <ArrowDown size={18} />
                            )}
                          </button>
                        </div>

                        {/* ======================================
                            PACKAGE DETAILS
                        ====================================== */}

                        {isExpanded && (
                          <div className="mt-4 border-t border-slate-200 pt-4">
                            <div className="space-y-3 text-sm text-slate-600">
                              <div>
                                  <p className="font-semibold text-slate-900">
                                    {isPublisher ? "Publisher details" : "Package details"}
                                </p>

                                <p className="mt-1">
                                  <span className="font-medium">
                                    Category:
                                  </span>{" "}
                                  {pkg.category}
                                </p>
                              </div>

                              {/* MEDIA COVERAGE */}

                              {isPublisher ? (
                                <div className="space-y-2">
                                  {pkg.website && <a href={pkg.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Publisher website</a>}
                                  {pkg.sampleReportLink && <a href={pkg.sampleReportLink} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">View sample report</a>}
                                </div>
                              ) : pkg.mediaCoverage?.length > 0 ? (
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    📰 Media Coverage & Demo Links
                                  </p>

                                  <div className="mt-2 space-y-2">
                                    {pkg.mediaCoverage.map(
                                      (media, index) => (
                                        <div
                                          key={`${pkg._id}-media-${index}`}
                                        >
                                          {media.sampleReportLink ? (
                                            <a
                                              href={
                                                media.sampleReportLink
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-2 text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                                            >
                                              {
                                                media.publisherName
                                              }

                                              <span className="text-xs">
                                                ↗
                                              </span>
                                            </a>
                                          ) : (
                                            <span className="text-slate-600">
                                              {
                                                media.publisherName
                                              }
                                            </span>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-slate-500">
                                  No media coverage details
                                  available.
                                </p>
                              )}
                            </div>

                            {/* SELECTED PACKAGE MESSAGE */}

                            {isSelected && (
                              <div className="mt-4 border-t border-slate-100 pt-4">
                                <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600">
                                  <FilePlus2 size={16} />

                                  {isPublisher ? "Publisher selected" : "Package selected"}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ======================================
                    QUANTITY
                ====================================== */}

                <label className="mt-6 block max-w-xs text-sm font-semibold">
                  Article quantity

                  <input
                    className="field mt-2"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        Number(event.target.value) || 0
                      )
                    }
                  />
                </label>
              </>
            )}
          </section>
        )}

        {/* ======================================
            NAVIGATION BUTTONS
        ====================================== */}

        <div className="sticky bottom-0 z-20 -mx-2 flex justify-between gap-3 border-t border-slate-200 bg-white/95 px-2 py-4 backdrop-blur sm:-mx-4 sm:px-4">
          {/* BACK / CANCEL */}

          {step === 1 ? (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="btn-secondary"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              <ArrowLeft size={17} />

              Back
            </button>
          )}

          {/* NEXT / SUBMIT */}

          {step === 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="btn-primary"
            >
              Choose packages

              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={
                busy ||
                loadingPackages ||
                !(catalogueMode === "packages" ? packages.length && items.length : publishers.length && publisherItems.length)
              }
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? "Creating..."
                : "Continue to payment"}

              <ArrowRight size={17} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}