"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Send,
  LayoutDashboard,
  Mail,
  Users,
  Megaphone,
  Inbox,
  ShieldCheck,
  CreditCard,
  Settings,
  ShieldAlert,
  LogOut,
  Building2,
} from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Zoqonyx workspace...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    { label: "Campaigns", href: "/app/campaigns", icon: Megaphone },
    { label: "Leads & Import", href: "/app/leads", icon: Users },
    { label: "Mailboxes", href: "/app/mailboxes", icon: Mail },
    { label: "Unified Inbox", href: "/app/inbox", icon: Inbox },
    { label: "Deliverability", href: "/app/deliverability", icon: ShieldCheck },
    { label: "Billing & Plans", href: "/app/billing", icon: CreditCard },
    { label: "API & Settings", href: "/app/settings", icon: Settings },
  ];

  const currentOrg = user?.organizations?.[0] || { name: "Navix Demo Solutions" };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          {/* Brand & Workspace Switcher */}
          <div className="p-4 border-b border-slate-100">
            <Link href="/app/dashboard" className="flex items-center gap-2.5 mb-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold shadow-sm">
                <Send className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none font-mono">
                  ZOQONYX
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Email Marketing</span>
              </div>
            </Link>

            {/* Active Organization Badge */}
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">{currentOrg.name}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                {currentOrg.planName || "PRO"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Super Admin link if applicable */}
            {user?.isSuperAdmin && (
              <div className="pt-3 mt-3 border-t border-slate-100">
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Super Admin Console</span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* User Profile & Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                {user?.name?.substring(0, 2).toUpperCase() || "NA"}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-900 truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>v1.0.0 Commercial</span>
            <a
              href="https://newixtechsolutions.com/"
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-sky-600 font-medium"
            >
              Nawix Tech
            </a>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">Zoqonyx Cloud Platform</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Scheduler Active
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/app/deliverability"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Deliverability Score: 100/100</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
