import { BookOpen, FilePlus2, FileText, Globe2, LayoutDashboard, LogOut, Menu, Moon, PackagePlus, Receipt, ShieldCheck, Sun, X } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Footer from "./Footer";
import { getMyArticles } from "../../services/articleService";

const linkClass = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`;

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [articleCounts, setArticleCounts] = useState({ total: 0, draft: 0, my: 0 });
  useEffect(() => { if (user?.role !== "admin") getMyArticles().then((r) => { const articles = r.data || []; setArticleCounts({ total: articles.length, draft: articles.filter((a) => ["draft", "writing", "payment_pending"].includes(a.status)).length, my: articles.filter((a) => ["submitted", "under_review", "accepted", "rejected"].includes(a.status)).length }); }).catch(() => {}); }, [user]);
  const closeMenu = () => setMenuOpen(false);
  const navigation = <nav className="space-y-1">
    <NavLink className={linkClass} to="/dashboard" onClick={closeMenu}><LayoutDashboard size={18} />Dashboard <span className="ml-auto text-xs">({articleCounts.total})</span></NavLink>
    {user?.role !== "admin" && <><NavLink className={linkClass} to="/articles/my" onClick={closeMenu}><FileText size={18} />My articles <span className="ml-auto text-xs">({articleCounts.my})</span></NavLink><NavLink className={linkClass} to="/articles/drafts" onClick={closeMenu}><FileText size={18} />Draft articles <span className="ml-auto text-xs">({articleCounts.draft})</span></NavLink><NavLink className={linkClass} to="/articles/new" onClick={closeMenu}><FilePlus2 size={18} />New article</NavLink><NavLink className={linkClass} to="/payments" onClick={closeMenu}><Receipt size={18} />Payment history</NavLink></>}
    {user?.role === "admin" && <><NavLink className={linkClass} to="/admin/review" onClick={closeMenu}><ShieldCheck size={18} />Review desk</NavLink><NavLink className={linkClass} to="/admin/packages" onClick={closeMenu}><PackagePlus size={18} />Packages & pricing</NavLink><NavLink className={linkClass} to="/admin/publishers" onClick={closeMenu}><Globe2 size={18} />Individual publishers</NavLink><NavLink className={linkClass} to="/payments" onClick={closeMenu}><Receipt size={18} />Payment history</NavLink></>}
  </nav>;
  const account = <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
    <button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}{theme === "dark" ? "Light mode" : "Dark mode"}</button>
    <p className="mt-4 px-3 text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
    <p className="px-3 text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
    <button onClick={signOut} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><LogOut size={18} />Sign out</button>
  </div>;
  const brand = <div className="flex items-center gap-2 px-2 text-xl font-bold text-slate-900 dark:text-white"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white"><BookOpen size={19} /></span>SEO</div>;
  return <div className="min-h-screen md:flex">
    <header className="border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:hidden"><div className="flex items-center justify-between">{brand}<button className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>{menuOpen && <div className="mt-4 space-y-5">{navigation}{account}</div>}</header>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:flex md:flex-col">{brand}<div className="mt-8">{navigation}</div><div className="mt-auto pt-8">{account}</div></aside>
    <main className="flex min-w-0 flex-1 flex-col md:ml-64"><div className="flex-1 p-5 md:p-8"><Outlet /></div><Footer /></main>
  </div>;
}
