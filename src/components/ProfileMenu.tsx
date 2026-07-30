"use client";

import { useState, useRef, useEffect } from "react";
import LogoutButton from "./LogoutButton";

export default function ProfileMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking anywhere outside it
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initial = email[0].toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fffff] text-sm border border-[#2A2D36] font-medium text-white transition hover:bg-[#4F46E5]"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-[#2A2D36] bg-[#15171E] p-1.5 shadow-xl">
          <div className="px-3 py-2">
            <p className="text-xs text-[#5C5F6B]">Signed in as</p>
            <p className="truncate text-sm font-medium text-[#F2F2F5]">{email}</p>
          </div>
          <div className="my-1 h-px bg-[#2A2D36]" />
          <div className="px-1 py-0.5">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}