"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Crown,
  Users,
  Briefcase,
  UserCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface RolePreset {
  id: string;
  name: string;
  roleLabel: string;
  email: string;
  pass: string;
  icon: any;
  color: string;
  description: string;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: "super_admin",
    name: "Zawar Ahmed",
    roleLabel: "Platform Super Admin",
    email: "admin@zoqonyx.com",
    pass: "ZoqonyxAdmin2026!Secure",
    icon: Crown,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    description: "Full platform oversight, all organizations, provider config & global system health.",
  },
  {
    id: "org_owner",
    name: "Alex Vance",
    roleLabel: "Organization Owner",
    email: "owner@navixdemo.com",
    pass: "ZoqonyxDemo2026!",
    icon: ShieldCheck,
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    description: "Full workspace ownership, billing, team management, mailbox pooling & campaigns.",
  },
  {
    id: "org_admin",
    name: "Sarah Chen",
    roleLabel: "Organization Admin",
    email: "admin@navixdemo.com",
    pass: "ZoqonyxDemo2026!",
    icon: Users,
    color: "text-sky-700 bg-sky-50 border-sky-200",
    description: "Administer campaigns, lead databases, templates, and team permissions.",
  },
  {
    id: "manager",
    name: "Marcus Miller",
    roleLabel: "Campaign Manager",
    email: "manager@navixdemo.com",
    pass: "ZoqonyxDemo2026!",
    icon: Briefcase,
    color: "text-indigo-700 bg-indigo-50 border-indigo-200",
    description: "Orchestrate sequences, monitor outreach analytics, and manage follow-ups.",
  },
  {
    id: "member",
    name: "Elena Rostova",
    roleLabel: "Outreach Specialist (Member)",
    email: "member@navixdemo.com",
    pass: "ZoqonyxDemo2026!",
    icon: UserCheck,
    color: "text-purple-700 bg-purple-50 border-purple-200",
    description: "Import leads, draft copy, review inbound replies, and manage communications.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@navixdemo.com");
  const [password, setPassword] = useState("ZoqonyxDemo2026!");
  const [selectedRole, setSelectedRole] = useState("org_owner");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const applyPreset = (preset: RolePreset) => {
    setSelectedRole(preset.id);
    setEmail(preset.email);
    setPassword(preset.pass);
    setError(null);
  };

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    setError(null);
    setLoading(true);

    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (data.user?.isSuperAdmin && targetEmail === "admin@zoqonyx.com") {
        router.push("/admin");
      } else {
        router.push("/app/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-md">
            <Send className="w-5 h-5 text-sky-400" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 font-mono">
            ZOQONYX
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Sign In to Commercial Outreach
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Developed by{" "}
          <a
            href="https://newixtechsolutions.com/"
            target="_blank"
            rel="noreferrer"
            className="text-sky-600 hover:text-sky-700 font-semibold underline-offset-4 hover:underline"
          >
            Nawix Tech Solution
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl space-y-6">
        {/* 1-Click Role Testing Switcher */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1-Click Multi-Role Testing Switcher
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Click any role to test instant authorization
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {ROLE_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedRole === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`text-left p-3 rounded-lg border transition flex flex-col justify-between ${
                    isSelected
                      ? "bg-slate-50 border-sky-600 shadow-sm ring-1 ring-sky-600"
                      : "bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`p-1.5 rounded-md border text-xs ${preset.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {preset.roleLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-600 truncate">{preset.name}</span>
                    {isSelected ? (
                      <span className="text-sky-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Select &rarr;</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition font-mono shadow-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Account Password
                </label>
                <span className="text-xs text-slate-400">
                  Pre-filled for testing
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition font-mono shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow transition disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating Role...
                  </span>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Need a new company workspace?</span>
            <Link href="/signup" className="text-sky-600 font-semibold hover:text-sky-700 transition">
              Create free organization &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
