export default function Footer() {
  return (
    <footer className="border-t-2 border-blue-600 py-5 text-center text-sm text-black dark:border-blue-500 dark:text-slate-300">
      © {new Date().getFullYear()} ReleaseMYPR. All rights reserved.
    </footer>
  );
}
