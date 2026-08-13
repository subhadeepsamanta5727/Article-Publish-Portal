export default function Footer() {
  return (
    <footer className="border-t-2 border-red-600 py-5 text-center text-sm text-black dark:border-red-500 dark:text-slate-300">
      © {new Date().getFullYear()} SEO. All rights reserved.
    </footer>
  );
}
