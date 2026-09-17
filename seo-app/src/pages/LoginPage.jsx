import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";
import { login } from "../services/authService";
export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const response = await login(form);
      signIn(response.data);
      toast.success(response.message);
      navigate("/dashboard");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your publishing journey."
      lightOnly
    >
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block label">
          Email
          <input
            required
            type="email"
            className="field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="block label">
          Password
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              className="field pr-11"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New to ReleaseMYPR?{" "}
        <Link className="font-semibold text-indigo-600" to="/register">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
