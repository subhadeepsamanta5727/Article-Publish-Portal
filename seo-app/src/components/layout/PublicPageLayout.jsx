import { ArrowLeft, Mail } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/rmp-logo.png";

export default function PublicPageLayout({ eyebrow, title, intro, children }) {
  useEffect(() => {
    const wasDark = document.documentElement.classList.contains("dark");
    document.documentElement.classList.remove("dark");
    return () => {
      if (wasDark) document.documentElement.classList.add("dark");
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfefd] text-slate-800">
      <header className="border-b border-teal-100 bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" aria-label="ReleaseMYPR home">
            <img
              src={logo}
              alt="ReleaseMYPR"
              className="h-12 w-auto max-w-[220px] object-contain object-left sm:h-14"
            />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 transition hover:text-teal-900"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </header>

      <section className="border-b border-teal-100 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.16),transparent_42%)]">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            {intro}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-none text-[15px] leading-7 text-slate-700 [&_a]:font-semibold [&_a]:text-teal-700 [&_a:hover]:text-teal-900 [&_h2]:mt-9 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:leading-tight [&_h2]:text-slate-900 [&_h2:first-child]:mt-0 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-4 [&_p:first-child]:mt-0 [&_ul]:mt-4">
          {children}
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-7 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} ReleaseMYPR. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
            <Link className="hover:text-white" to="/legal">Legal</Link>
            <Link className="hover:text-white" to="/privacy-policy">Privacy</Link>
            <Link className="hover:text-white" to="/terms-of-service">Terms</Link>
            <Link className="hover:text-white" to="/payment-policy">Payments</Link>
            <Link className="inline-flex items-center gap-1 hover:text-white" to="/contact">
              <Mail size={14} /> Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
