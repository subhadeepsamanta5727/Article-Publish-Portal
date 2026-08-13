import { BookOpen } from "lucide-react";
import Footer from "../layout/Footer";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <section className="flex flex-1 items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-white p-6 shadow-[0_12px_45px_rgba(220,38,38,0.10)] transition duration-300 hover:border-red-400 hover:shadow-[0_18px_55px_rgba(220,38,38,0.20)] dark:border-red-900 dark:bg-slate-900 dark:hover:border-red-700">
          <div className="mb-8 flex items-center gap-2 text-xl font-bold text-red-700 dark:text-red-400">
            <BookOpen /> SEO
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
