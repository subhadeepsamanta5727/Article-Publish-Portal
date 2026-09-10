import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileText,
  Mail,
  MapPin,
  Phone,
  Globe2,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import { getActiveMediaPartners, getActivePackages } from "../services/packageService";
import { getActiveTestimonials } from "../services/testimonialService";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Choose your reach",
    text: "Compare trusted publication packages and publishers by category, audience, and price.",
  },
  {
    icon: PenLine,
    number: "02",
    title: "Build your article",
    text: "Bring your draft, links, images, and SEO details into one focused submission workspace.",
  },
  {
    icon: BarChart3,
    number: "03",
    title: "Track publication",
    text: "Follow every review milestone and keep your team aligned from brief to delivery.",
  },
];

export default function LandingPage() {
  const [packages, setPackages] = useState([]);
  const [mediaPartners, setMediaPartners] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [testimonialHovered, setTestimonialHovered] = useState(false);
  const [expandedPackage, setExpandedPackage] = useState(null);
  useEffect(() => {
    const wasDark = document.documentElement.classList.contains("dark");
    document.documentElement.classList.remove("dark");
    return () => {
      if (wasDark) document.documentElement.classList.add("dark");
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getActiveMediaPartners().then((response) => {
      if (mounted) setMediaPartners((response.data || []).slice(0, 12));
    }).catch(() => {
      if (mounted) setMediaPartners([]);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!testimonials.length) return undefined;
    if (testimonialHovered || testimonials.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveTestimonial((current) => current + 1);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [testimonials, testimonialHovered]);

  const testimonialPageCount = Math.max(1, Math.ceil(testimonials.length / 3));
  const activeTestimonialPage = testimonials.length
    ? activeTestimonial % testimonialPageCount
    : 0;
  const visibleTestimonials = testimonials.slice(
    activeTestimonialPage * 3,
    activeTestimonialPage * 3 + 3,
  );

  useEffect(() => {
    let mounted = true;
    getActiveTestimonials()
      .then((response) => {
        if (mounted) setTestimonials(response.data || []);
      })
      .catch(() => {
        if (mounted) setTestimonials([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getActivePackages()
      .then((response) => {
        if (mounted) setPackages((response.data || []).slice(0, 5));
      })
      .catch(() => {
        if (mounted) setPackages([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      <header className="absolute inset-x-0 top-0 z-20 bg-transparent">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight"
            aria-label="SEO home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <BookOpen size={20} />
            </span>
            SEO
          </Link>
          <nav
            className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex"
            aria-label="Primary navigation"
          >
            <a href="#how-it-works" className="transition hover:text-blue-600">
              How it works
            </a>
            <a href="#testimonials" className="transition hover:text-blue-600">
              Testimonials
            </a>
            <a href="#pricing" className="transition hover:text-blue-600">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl px-2 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600 sm:px-3"
            >
              Sign in
            </Link>
            <Link to="/register" className="btn-primary whitespace-nowrap px-3 py-2.5 sm:px-4">
              Get started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative border-b border-slate-200 bg-slate-50">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(37,99,235,0.14),transparent_32%),linear-gradient(135deg,transparent_50%,rgba(239,246,255,0.8))]"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-24 sm:gap-12 sm:px-8 sm:pb-16 sm:pt-32 lg:grid-cols-[1fr_0.9fr] lg:gap-20 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              <Sparkles size={14} /> Publishing, made clearer
            </p>
            <h1 className="mt-6 max-w-3xl text-[2.65rem] font-bold leading-[1.04] tracking-tight text-slate-950 sm:text-6xl">
              Turn strong ideas into published work.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Choose where your story belongs, shape it with purpose, and track
              the road from first draft to final publication.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary px-5 py-3">
                Start publishing <ArrowRight size={17} />
              </Link>
              <a href="#how-it-works" className="btn-secondary px-5 py-3">
                See how it works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={17} className="text-blue-600" /> Clear
                review status
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={17} className="text-blue-600" /> Secure file
                links
              </span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div
              className="absolute -inset-3 rounded-4xl border border-blue-100 bg-blue-50/70 sm:-inset-5"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Article workspace
                </span>
              </div>
              <div className="bg-slate-50 p-5 sm:p-7">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                        New article
                      </p>
                        <p className="mt-2 wrap-break-word font-bold">
                        The future of useful content
                      </p>
                    </div>
                    <FileText className="text-blue-600" size={22} />
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 w-4/5 rounded-full bg-blue-600" />
                    </div>
                    <div className="h-2 w-3/5 rounded-full bg-slate-100" />
                    <div className="h-2 w-2/3 rounded-full bg-slate-100" />
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      Under review
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      SEO strategy
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-900 p-4 text-white">
                    <ShieldCheck size={19} className="text-blue-400" />
                    <p className="mt-5 text-xs text-slate-400">
                      Editorial confidence
                    </p>
                    <p className="mt-1 text-2xl font-bold">94%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <CheckCircle2 size={19} className="text-emerald-500" />
                    <p className="mt-5 text-xs text-slate-500">
                      Next milestone
                    </p>
                    <p className="mt-1 font-bold">Publisher review</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                How it works
              </p>
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
                A simple route from idea to impact.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-slate-500">
              One focused workflow keeps every article moving with less chasing and more clarity.
            </p>
          </div>
          <div className="relative mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
            <div className="absolute left-[16%] right-[16%] top-12 hidden h-px bg-blue-200 md:block" aria-hidden="true" />
            {steps.map(({ icon: Icon, number, title, text }) => (
              <article
                key={number}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg sm:p-7"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 transition duration-300 group-hover:rotate-3 group-hover:bg-blue-700">
                    <Icon size={21} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                    Step {number}
                  </span>
                </div>
                <div className="mt-8 border-t border-slate-100 pt-5">
                  <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="testimonials"
        className="border-y border-slate-200 bg-slate-900 text-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-300">
                Testimonials
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
                Good work gets room to grow.
              </h2>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 hover:text-white"
            >
              Start your article <ArrowRight size={16} />
            </Link>
          </div>
          {testimonials.length > 0 && (
            <div
              className="mx-auto mt-10"
              onMouseEnter={() => setTestimonialHovered(true)}
              onMouseLeave={() => setTestimonialHovered(false)}
            >
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {visibleTestimonials.map((testimonial) => (
                  <article
                    key={testimonial._id}
                    className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-[0_18px_50px_rgba(2,6,23,0.25)] transition duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-[0_24px_60px_rgba(37,99,235,0.18)]"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={
                          testimonial.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=2563eb&color=fff`
                        }
                        alt={`${testimonial.name} profile`}
                        className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-blue-400/20"
                      />
                      <div className="min-w-0">
                        <p className="wrap-break-word text-base leading-7 text-slate-100 sm:text-lg sm:leading-8">
                          “{testimonial.quote}”
                        </p>
                        <div className="mt-6">
                          <p className="font-bold">{testimonial.name}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {testimonial.role}
                            {testimonial.company ? ` at ${testimonial.company}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div
                className="mt-6 flex justify-center gap-2"
                aria-label="Testimonial slides"
              >
                {Array.from({ length: testimonialPageCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveTestimonial(index)}
                    aria-label={`Show testimonial group ${index + 1}`}
                    aria-current={
                      index === activeTestimonialPage ? "true" : undefined
                    }
                    className={`h-2.5 rounded-full transition-all ${index === activeTestimonialPage ? "w-8 bg-blue-400" : "w-2.5 bg-slate-600 hover:bg-slate-400"}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        id="pricing"
        className="border-y border-blue-100 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Choose your next publishing move.
            </h2>
            <p className="mt-3 text-slate-600">
              Straightforward options, clear prices, no guesswork.
            </p>
          </div>
          <Link
            to="/register"
            className="text-sm font-bold text-blue-700 underline underline-offset-4"
          >
            View all packages
          </Link>
          </div>
          {packages.length ? (
          <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {packages.map((pkg) => (
              <article
                key={pkg.packageId || pkg._id}
                className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
              >
                <div className="flex h-full flex-col">
                  <header className="border-b border-blue-100 pb-3 text-center">
                    <span className="mx-auto grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText size={15} />
                    </span>
                    <h3 className="mt-2 wrap-break-word text-sm font-bold text-slate-900">
                      {pkg.packageName}
                    </h3>
                  </header>
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      {pkg.category || "Publishing"}
                    </p>
                    <span className="rounded-full bg-blue-50 px-1.5 py-1 text-[9px] font-bold text-blue-700">
                      Available
                    </span>
                  </div>
                  <footer className="border-t border-blue-100 pt-3 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Starting from
                    </p>
                    <p className="mt-1 text-base font-bold tracking-tight text-blue-700">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: pkg.currency || "INR",
                      }).format(Number(pkg.price || 0))}
                    </p>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 transition hover:text-blue-700"
                      aria-expanded={expandedPackage === (pkg.packageId || pkg._id)}
                      onClick={() =>
                        setExpandedPackage((current) =>
                          current === (pkg.packageId || pkg._id)
                            ? null
                            : pkg.packageId || pkg._id,
                        )
                      }
                    >
                      What&apos;s included
                      <ChevronDown
                        size={13}
                        className={expandedPackage === (pkg.packageId || pkg._id) ? "rotate-180 transition-transform" : "transition-transform"}
                      />
                    </button>
                    {expandedPackage === (pkg.packageId || pkg._id) && (
                      <div className="mt-3 border-t border-blue-100 pt-3 text-left">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Included publishers
                        </p>
                        <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
                          {(pkg.mediaCoverage || []).length ? (
                            pkg.mediaCoverage.map((publisher) => (
                                <li key={publisher.publisherName} className="flex min-w-0 gap-1.5">
                                <CheckCircle2 className="mt-0.5 shrink-0 text-blue-600" size={12} />
                                <span className="wrap-break-word">{publisher.publisherName}</span>
                              </li>
                            ))
                          ) : (
                            <li className="flex gap-1.5">
                              <CheckCircle2 className="mt-0.5 shrink-0 text-blue-600" size={12} />
                              <span>Editorial review and submission support</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </footer>
                </div>
              </article>
            ))}
          </div>
          ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
            <p className="font-semibold text-slate-800">
              Packages are available after sign in.
            </p>
            <Link
              to="/login"
              className="mt-3 inline-flex font-bold text-blue-700 underline underline-offset-4"
            >
              Sign in to view pricing
            </Link>
          </div>
          )}
        </div>
      </section>

      <section className="border-y border-blue-100 bg-blue-50">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div>
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                Media opportunities
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                A wider audience for your next strong idea.
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-slate-600">
                Discover recognizable outlets and active publication opportunities
                managed by your editorial team.
              </p>
            </div>
            <div className="relative left-1/2 mt-10 w-screen -translate-x-1/2 overflow-hidden border-y border-blue-100 bg-white px-5 py-5 shadow-sm sm:px-8" aria-label="Media opportunities">
              <div className="partner-marquee flex w-max gap-3" onMouseEnter={(event) => event.currentTarget.classList.add("partner-marquee-paused")} onMouseLeave={(event) => event.currentTarget.classList.remove("partner-marquee-paused")}>
                {[...mediaPartners, ...mediaPartners].map((partner, index) => <a key={`${partner._id}-${index}`} href={partner.link} target="_blank" rel="noreferrer" className="flex min-w-64 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm">
                  {partner.logoUrl ? <img src={partner.logoUrl} alt={`${partner.name} logo`} className="h-10 w-10 rounded-lg bg-white object-contain p-1" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">{partner.name.slice(0, 2).toUpperCase()}</span>}
                  <p className="min-w-0 truncate font-bold text-slate-800">{partner.name}</p>
                  <Globe2 className="ml-auto shrink-0 text-blue-300" size={18} />
                </a>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-24">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
              Frequently asked questions
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Clear answers before you choose a package.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-600">
              Here are the details buyers ask about most when comparing higher-tier options like LBC 9 and LBC 10.
            </p>
          </div>
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">
            <details className="group py-5" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900 sm:text-base">
                How long does publication usually take?
                <ChevronDown size={18} className="shrink-0 text-blue-600 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Turnaround depends on the selected publisher and review queue. Your dashboard shows each milestone, and the editorial team shares the expected timeline after submission.
              </p>
            </details>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900 sm:text-base">
                Is indexation guaranteed?
                <ChevronDown size={18} className="shrink-0 text-blue-600 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Indexation is influenced by the publisher and search engine systems, so it cannot be guaranteed. We provide the live publication link and help you track the result after delivery.
              </p>
            </details>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900 sm:text-base">
                Can I request revisions before publication?
                <ChevronDown size={18} className="shrink-0 text-blue-600 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Yes. Share revision notes during editorial review and the team will confirm what can be adjusted within the selected package and publisher guidelines.
              </p>
            </details>
            <details className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900 sm:text-base">
                What is different about LBC 9 and LBC 10?
                <ChevronDown size={18} className="shrink-0 text-blue-600 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Higher-tier packages generally offer access to stronger publisher opportunities. Expand each pricing card above to compare the publishers included in the current package configuration.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 text-white" aria-label="Footer links">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold" aria-label="SEO home">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-blue-600"><BookOpen size={18} /></span>
              SEO
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">
              A clearer way to shape, submit, and track your next published idea.
            </p>
            <div className="mt-5 grid gap-2 text-sm text-blue-100">
              <p className="inline-flex min-w-0 items-start gap-2 wrap-break-word"><MapPin className="mt-1 shrink-0" size={15} /> <span>GB-47, Rajdanga Main Road, Sector G, East Kolkata Twp, Kolkata, West Bengal 700107</span></p>
              <a href="tel:+919876543210" className="inline-flex items-center gap-2 transition hover:text-white"><Phone size={15} /> +91 98765 43210</a>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-100">Explore</p>
            <div className="mt-4 grid gap-3 text-sm font-semibold">
              <a href="#how-it-works" className="transition hover:text-blue-100">How it works</a>
              <a href="#pricing" className="transition hover:text-blue-100">Pricing</a>
              <a href="#testimonials" className="transition hover:text-blue-100">Testimonials</a>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-100">Account</p>
            <div className="mt-4 grid gap-3 text-sm font-semibold">
              <Link to="/login" className="transition hover:text-blue-100">Sign in</Link>
              <Link to="/register" className="transition hover:text-blue-100">Create account</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-100">Contact & social</p>
            <div className="mt-4 grid gap-3 text-sm font-semibold">
              <a href="mailto:hello@seo-portal.com" className="inline-flex items-center gap-2 transition hover:text-blue-100"><Mail size={16} />Contact us</a>
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-blue-100"><span className="text-xs font-bold">in</span>LinkedIn</a>
              <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-blue-100"><span className="text-xs font-bold">ig</span>Instagram</a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-blue-100"><span className="text-base leading-none">X</span>Follow us</a>
            </div>
          </div>
          <div id="legal">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-100">Legal</p>
            <div className="mt-4 grid gap-3 text-sm font-semibold">
              <a href="/privacy-policy" className="transition hover:text-white">Privacy Policy</a>
              <a href="/terms-of-service" className="transition hover:text-white">Terms of Service</a>
              <a href="/refund-policy" className="transition hover:text-white">Refund Policy</a>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
