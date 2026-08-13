/* eslint-disable react-hooks/set-state-in-effect */

import {
  ArrowDown,
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
import { getActivePackages } from "../services/packageService";

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
  const [selected, setSelected] = useState({});
  const [expanded, setExpanded] = useState({});
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
        const response = await getActivePackages();

        setPackages(response?.data || []);
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

  // ======================================
  // TOTAL
  // ======================================

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 0;

      return sum + price * itemQuantity;
    }, 0);
  }, [items]);

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

  // ======================================
  // TOGGLE PACKAGE DETAILS
  // ======================================

  const toggleExpanded = (id) => {
    setExpanded((current) => ({
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
    if (!items.length) {
      toast.error("Select at least one publication package.");
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

        packageItems: items.map((item) => ({
          packageId: item._id,
          quantity,
        })),
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

      <p className="text-sm font-semibold text-red-600">
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
                <h2 className="text-lg font-bold">
                  Publication packages
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Check a package and use the arrow to view its
                  details.
                </p>
              </div>

              <span className="font-bold text-red-700">
                Total: INR {total.toFixed(2)}
              </span>
            </div>

            {/* ======================================
                LOADING
            ====================================== */}

            {loadingPackages ? (
              <p className="mt-5 text-sm text-slate-500">
                Loading packages...
              </p>
            ) : packages.length === 0 ? (
              <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                No active packages are available.
              </p>
            ) : (
              <>
                {/* ======================================
                    PACKAGE LIST
                ====================================== */}

                <div className="mt-5 space-y-3">
                  {packages.map((pkg) => {
                    const isSelected = Boolean(
                      selected[pkg._id]
                    );

                    const isExpanded = Boolean(
                      expanded[pkg._id]
                    );

                    return (
                      <div
                        key={pkg._id}
                        className={`rounded-xl border p-4 transition-colors ${
                          isSelected
                            ? "border-red-300 bg-red-50/50"
                            : "border-slate-200"
                        }`}
                      >
                        {/* PACKAGE HEADER */}

                        <div className="flex items-center gap-3">
                          {/* CHECKBOX */}

                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-red-600"
                            checked={isSelected}
                            onChange={(event) =>
                              togglePackage(
                                pkg._id,
                                event.target.checked
                              )
                            }
                          />

                          {/* PACKAGE INFO */}

                          <div className="min-w-0 flex-1">
                            <p className="font-bold">
                              {pkg.packageName}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {pkg.category}
                            </p>
                          </div>

                          {/* PRICE */}

                          <span className="font-bold text-red-700">
                            INR{" "}
                            {Number(pkg.price || 0).toFixed(2)}
                          </span>

                          {/* EXPAND */}

                          <button
                            type="button"
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
                            onClick={() =>
                              toggleExpanded(pkg._id)
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
                                  Package Details
                                </p>

                                <p className="mt-1">
                                  <span className="font-medium">
                                    Category:
                                  </span>{" "}
                                  {pkg.category}
                                </p>
                              </div>

                              {/* MEDIA COVERAGE */}

                              {pkg.mediaCoverage?.length > 0 ? (
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
                                              className="inline-flex items-center gap-2 text-red-600 transition-colors hover:text-red-800 hover:underline"
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
                                <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                                  <FilePlus2 size={16} />

                                  Package selected
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

        <div className="flex justify-between gap-3">
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
                !packages.length ||
                !items.length
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