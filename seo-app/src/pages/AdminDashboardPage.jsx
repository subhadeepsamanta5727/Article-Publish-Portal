import {
  FileText,
  MessageSquare,
  PenLine,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAdminStats } from "../services/adminService";
export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    allArticles: 0,
    publishedArticles: 0,
    submittedArticles: 0,
    allUsers: 0,
    pendingPayments: 0,
    writingArticles: 0,
  });
  useEffect(() => {
    getAdminStats()
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);
  const cards = [
    [FileText, "All articles", stats.allArticles],
    [ShieldCheck, "Published articles", stats.publishedArticles],
    [MessageSquare, "Submitted articles", stats.submittedArticles],
    [Users, "All users", stats.allUsers],
    [Receipt, "Pending payments", stats.pendingPayments],
    [PenLine, "Articles in writing", stats.writingArticles],
  ];
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-red-600">ADMINISTRATION</p>
      <h1 className="mt-1 text-3xl font-bold">Admin dashboard</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([Icon, label, value]) => (
          <div className="card p-5" key={label}>
            <Icon className="text-red-600" size={21} />
            <p className="mt-5 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-red-700">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
