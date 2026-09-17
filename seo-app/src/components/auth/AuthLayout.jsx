import { useEffect } from "react";
import Footer from "../layout/Footer";
import logo from "../../assets/rmp-logo.png";

export default function AuthLayout({ title, subtitle, children, lightOnly = false }) {
  useEffect(() => {
    if (!lightOnly) return undefined;
    const wasDark = document.documentElement.classList.contains("dark");
    document.documentElement.classList.remove("dark");
    return () => {
      if (wasDark) document.documentElement.classList.add("dark");
    };
  }, [lightOnly]);

  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <section className="flex flex-1 items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-[0_12px_45px_rgba(37,99,235,0.10)] transition duration-300 hover:border-blue-400 hover:shadow-[0_18px_55px_rgba(37,99,235,0.20)] dark:border-blue-900 dark:bg-slate-900 dark:hover:border-blue-700">
          <div className="mb-8">
            <img src={logo} alt="ReleaseMYPR" className="h-12 w-auto max-w-[220px] object-contain object-left" />
          </div>
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{subtitle}</p>
          {children}
        </div>
      </section>
      <Footer />
    </main>
  );
}
