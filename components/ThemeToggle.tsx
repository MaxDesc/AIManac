"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // Init from localStorage or prefers-color-scheme
    const saved = localStorage.getItem("theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = saved ? saved === "dark" : true || prefers;
    setDark(useDark);
    document.documentElement.classList.toggle("dark", useDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="btn"
      title={dark ? "Passer en clair" : "Passer en sombre"}
    >
      {dark ? "🌙 Sombre" : "☀️ Clair"}
    </button>
  );
}
