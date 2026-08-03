"use client";

import { useState } from "react";
import Link from "next/link";
import ProfileMenu from "./ProfileMenu";

// appShell component that wraps the main content of the app and provides a sidebar,
// header, and optional stats section. Now responsive: sidebar becomes an
// off-canvas drawer below the lg breakpoint, toggled by a hamburger button.
interface Props {
  user: { email: string } | null;
  activePath: string;
  pageTitle: string;
  pageSubtitle: string;
  headerAction?: React.ReactNode;
  stats?: { label: string; value: number; accent?: string }[];
  children: React.ReactNode;
}

export default function AppShell({
  user,
  activePath,
  pageTitle,
  pageSubtitle,
  headerAction,
  stats,
  children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0A0B10]">
      {/* Dark overlay — only rendered/visible on mobile when the drawer is open.
          Tapping it closes the sidebar, same as tapping outside a modal. */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      {/* Sidebar — fixed off-canvas drawer on mobile (slides in from the left),
          normal static column on lg+ screens. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[#2A2D36] bg-[#0A0B10] px-4 py-6 transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="1" width="20" height="20" rx="5" stroke="#818CF8" strokeWidth="1.6" />
              <path d="M6 11.5L9.5 15L16 7.5" stroke="#818CF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-lg font-semibold tracking-tight text-[#F2F2F5]">Votify</span>
          </div>

          {/* Close button — mobile only, lets a user dismiss the drawer without
              needing to find the overlay to tap. */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-[#8B8F9C] hover:text-[#F2F2F5] lg:hidden"
            aria-label="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1" onClick={() => setSidebarOpen(false)}>
          <SidebarLink href="/" label="Dashboard" active={activePath === "/"}>
            <path d="M4 11l8-6 8 6v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-8z" />
          </SidebarLink>

          {user && (
            <>
              <SidebarLink href="/polls/new" label="New poll">
                <path d="M12 5v14M5 12h14" />
              </SidebarLink>
              <SidebarLink href="/polls/manage" label="Manage polls" active={activePath === "/polls/manage"}>
                <path d="M4 6h16M4 12h16M4 18h10" />
              </SidebarLink>
            </>
          )}
        </nav>

        {stats && (
          <div className="mt-auto space-y-3 border-t border-[#2A2D36] px-2 pt-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <span className="text-[#8B8F9C]">{s.label}</span>
                <span className="font-medium" style={{ color: s.accent ?? "#C8CAD3" }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Main column — lg:ml-0 not needed since sidebar is static (in-flow) at lg+ */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[#2A2D36] px-4 py-4 sm:px-8 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            {/* Hamburger — mobile only, opens the drawer */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 rounded-md p-1.5 text-[#8B8F9C] hover:bg-[#15171E] hover:text-[#F2F2F5] lg:hidden"
              aria-label="Open sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-[#F2F2F5] sm:text-lg">{pageTitle}</h1>
              <p className="mt-0.5 hidden truncate text-sm text-[#8B8F9C] sm:block">{pageSubtitle}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {headerAction}

            {user ? (
              <ProfileMenu email={user.email} />
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/login" className="text-sm font-medium text-[#8B8F9C] hover:text-[#F2F2F5]">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-[#6366F1] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#4F46E5] sm:px-3.5 sm:py-2"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
        active ? "bg-[#15171E] text-[#F2F2F5]" : "text-[#8B8F9C] hover:bg-[#15171E] hover:text-[#F2F2F5]"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
      {label}
    </Link>
  );
}