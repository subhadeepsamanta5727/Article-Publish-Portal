import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import { getActivePackages } from "../services/packageService";

const steps = [
  { icon: Search, number: "01", title: "Choose your reach", text: "Compare trusted publication packages and publishers by category, audience, and price." },
  { icon: PenLine, number: "02", title: "Build your article", text: "Bring your draft, links, images, and SEO details into one focused submission workspace." },
  { icon: BarChart3, number: "03", title: "Track publication", text: "Follow every review milestone and keep your team aligned from brief to delivery." },
];

const stories = [
  { tag: "SEO strategy", title: "The practical guide to content people actually find", author: "Maya Chen", time: "6 min read", image: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=80" },
  { tag: "Content craft", title: "How expert knowledge becomes a useful article", author: "Jon Bell", time: "4 min read", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80" },
  { tag: "Publishing", title: "A calmer editorial workflow for busy teams", author: "Ava Singh", time: "8 min read", image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80" },
];

const perks = [
  [FileText, "One organized workspace", "Keep briefs, drafts, attachments, and feedback together instead of chasing scattered threads."],
  [TrendingUp, "Useful performance signals", "See what is moving through review and where each submission stands at a glance."],
  [ShieldCheck, "Confident publishing", "Use secure file links and clear handoffs for a smoother path to publication."],
];

export default function LandingPage() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    const wasDark = document.documentElement.classList.contains("dark");
    document.documentElement.classList.remove("dark");
    return () => {
      if (wasDark) document.documentElement.classList.add("dark");
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getActivePackages().then((response) => {
      if (mounted) setPackages((response.data || []).slice(0, 3));
    }).catch(() => {
      if (mounted) setPackages([]);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight" aria-label="SEO home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200"><BookOpen size={20} /></span>
            SEO
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex" aria-label="Primary navigation">
            <a href="#how-it-works" className="transition hover:text-blue-600">How it works</a>
            <a href="#articles" className="transition hover:text-blue-600">Articles</a>
            <a href="#pricing" className="transition hover:text-blue-600">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600">Sign in</Link>
            <Link to="/register" className="btn-primary px-4 py-2.5">Get started <ArrowRight size={16} /></Link>
          </div>
        </div>
      </header>

      <section className="relative border-b border-slate-200 bg-slate-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(37,99,235,0.14),transparent_32%),linear-gradient(135deg,transparent_50%,rgba(239,246,255,0.8))]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:gap-20 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700"><Sparkles size={14} /> Publishing, made clearer</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.04] tracking-tight text-slate-950 sm:text-6xl">Turn strong ideas into published work.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Choose where your story belongs, shape it with purpose, and track the road from first draft to final publication.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary px-5 py-3">Start publishing <ArrowRight size={17} /></Link>
              <a href="#how-it-works" className="btn-secondary px-5 py-3">See how it works</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600"><span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-blue-600" /> Clear review status</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-blue-600" /> Secure file links</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-4xl border border-blue-100 bg-blue-50/70" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div><span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Article workspace</span></div>
              <div className="bg-slate-50 p-5 sm:p-7"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">New article</p><p className="mt-2 font-bold">The future of useful content</p></div><FileText className="text-blue-600" size={22} /></div><div className="mt-6 space-y-3"><div className="h-2 w-full rounded-full bg-slate-100"><div className="h-2 w-4/5 rounded-full bg-blue-600" /></div><div className="h-2 w-3/5 rounded-full bg-slate-100" /><div className="h-2 w-2/3 rounded-full bg-slate-100" /></div><div className="mt-6 flex flex-wrap gap-2"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Under review</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">SEO strategy</span></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-900 p-4 text-white"><ShieldCheck size={19} className="text-blue-400" /><p className="mt-5 text-xs text-slate-400">Editorial confidence</p><p className="mt-1 text-2xl font-bold">94%</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><CheckCircle2 size={19} className="text-emerald-500" /><p className="mt-5 text-xs text-slate-500">Next milestone</p><p className="mt-1 font-bold">Publisher review</p></div></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">How it works</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">A simple route from idea to impact.</h2></div><div className="mt-12 grid gap-6 md:grid-cols-3">{steps.map(({ icon: Icon, number, title, text }) => <article key={number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon size={21} /></span><span className="text-sm font-bold text-slate-300">{number}</span></div><h3 className="mt-8 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}</div></section>

      <section id="articles" className="border-y border-slate-200 bg-slate-900 text-white"><div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-300">Featured & trending</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Ideas worth opening, reading, and sharing.</h2></div><Link to="/register" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 hover:text-white">Start your article <ArrowRight size={16} /></Link></div><div className="mt-10 grid gap-6 lg:grid-cols-3">{stories.map((story) => <article key={story.title} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800"><img src={story.image} alt="" className="h-48 w-full object-cover" loading="lazy" /><div className="p-5"><span className="text-xs font-bold uppercase tracking-[0.14em] text-blue-300">{story.tag}</span><h3 className="mt-3 text-xl font-bold leading-snug">{story.title}</h3><div className="mt-7 flex items-center justify-between gap-3 text-sm text-slate-400"><span>By {story.author}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{story.time}</span></div></div></article>)}</div></div></section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:py-24"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Writer perks & analytics</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Everything your next article needs to move forward.</h2><p className="mt-5 max-w-xl leading-7 text-slate-600">A clear workspace for writers and teams who care about quality, momentum, and knowing what happens next.</p><Link to="/register" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Explore the workspace <ChevronRight size={17} /></Link></div><div className="grid gap-4 sm:grid-cols-3">{perks.map(([Icon, title, text]) => <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><Icon className="text-blue-600" size={23} /><h3 className="mt-8 font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></section>

      <section className="border-y border-blue-100 bg-blue-50"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8"><div className="flex items-end justify-between gap-6"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Social proof & stats</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Built for people who publish with purpose.</h2></div><Users className="hidden text-blue-300 sm:block" size={44} /></div><div className="mt-10 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white p-6"><p className="text-4xl font-bold text-blue-700">2.4k+</p><p className="mt-2 text-sm text-slate-600">articles organized</p></div><div className="rounded-2xl bg-white p-6"><p className="text-4xl font-bold text-blue-700">180+</p><p className="mt-2 text-sm text-slate-600">publisher opportunities</p></div><div className="rounded-2xl bg-white p-6"><p className="text-4xl font-bold text-blue-700">94%</p><p className="mt-2 text-sm text-slate-600">editorial confidence score</p></div></div></div></section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Pricing</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Choose your next publishing move.</h2><p className="mt-3 text-slate-600">Straightforward options, clear prices, no guesswork.</p></div><Link to="/register" className="text-sm font-bold text-blue-700 underline underline-offset-4">View all packages</Link></div>{packages.length ? <div className="mt-10 grid gap-4 md:grid-cols-3">{packages.map((pkg) => <article key={pkg.packageId || pkg._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><FileText size={17} /></span><div className="min-w-0"><h3 className="truncate font-bold">{pkg.packageName}</h3><p className="text-xs text-slate-500">{pkg.category}</p></div></div><div className="mt-6 flex items-center justify-between gap-3"><p className="text-lg font-bold text-blue-700">{new Intl.NumberFormat("en-IN", { style: "currency", currency: pkg.currency || "INR" }).format(Number(pkg.price || 0))}</p><Link to="/register" className="text-sm font-bold text-blue-700 underline underline-offset-4">Select</Link></div></article>)}</div> : <div className="mt-10 rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center"><p className="font-semibold text-slate-800">Packages are available after sign in.</p><Link to="/login" className="mt-3 inline-flex font-bold text-blue-700 underline underline-offset-4">Sign in to view pricing</Link></div>}</section>

      <section className="bg-blue-600 text-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center"><div><h2 className="text-3xl font-bold tracking-tight">Your next strong idea starts here.</h2><p className="mt-2 text-blue-100">Bring your expertise. We will help you move it forward.</p></div><Link to="/register" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50">Start writing <ArrowRight size={17} /></Link></div></section>
      <Footer />
    </main>
  );
}