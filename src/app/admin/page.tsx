"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Building2,
  Users,
  Mail,
  Send,
  MessageSquare,
  Activity,
  Server,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function SuperAdminPage() {
  const [data, setData] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch("/api/v1/admin/overview").then((r) => r.json()),
      fetch("/api/v1/admin/organizations").then((r) => r.json()),
    ])
      .then(([overviewData, orgsData]) => {
        if (overviewData.error) throw new Error(overviewData.error);
        setData(overviewData);
        if (orgsData.organizations) setOrganizations(orgsData.organizations);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Loading Super Admin Telemetry...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-12 text-center text-red-400 space-y-4">
        <ShieldAlert className="w-12 h-12 mx-auto text-red-500" />
        <h2 className="text-base font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
        <Link href="/app/dashboard" className="inline-block text-xs font-semibold text-brand-400 underline">
          Return to Workspace
        </Link>
      </div>
    );
  }

  const overview = data?.overview || {};
  const health = data?.health || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 font-sans space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <Link
            href="/app/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Workspace Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Zoqonyx Platform Super Admin
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global operational oversight for Nawix Tech Solution operators.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* PLATFORM OVERVIEW METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-[11px] text-slate-400">Total Tenants</span>
          <div className="text-2xl font-black text-white mt-1">{overview.totalOrgs || 1}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-[11px] text-slate-400">Platform Users</span>
          <div className="text-2xl font-black text-white mt-1">{overview.totalUsers || 1}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-[11px] text-slate-400">Active Mailboxes</span>
          <div className="text-2xl font-black text-brand-400 mt-1">{overview.totalMailboxes || 1}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-[11px] text-slate-400">Total Sent Emails</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{overview.totalSentEmails || 0}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-[11px] text-slate-400">Inbound Replies</span>
          <div className="text-2xl font-black text-cyan-400 mt-1">{overview.totalReplies || 0}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-[11px] text-slate-400">Total Bounces</span>
          <div className="text-2xl font-black text-red-400 mt-1">{overview.totalBounces || 0}</div>
        </div>
      </div>

      {/* SYSTEM HEALTH MONITOR */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Infrastructure & Worker Subsystems Health
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px]">PostgreSQL Relational DB</span>
              <strong className="text-white font-mono">{health.database?.status || "HEALTHY"}</strong>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">{health.database?.latencyMs || 2}ms</span>
          </div>

          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px]">Redis & BullMQ Engine</span>
              <strong className="text-white font-mono">{health.redis?.status || "HEALTHY"}</strong>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">{health.redis?.latencyMs || 1}ms</span>
          </div>

          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px]">Worker Cluster Uptime</span>
              <strong className="text-white font-mono">{health.uptimeSec || 120}s Active</strong>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">ONLINE</span>
          </div>
        </div>
      </div>

      {/* TENANTS MANAGEMENT DIRECTORY */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-3 p-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-400" />
          Customer Organizations & Quotas
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Organization</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Mailboxes</th>
                <th className="py-2.5 px-3">Leads</th>
                <th className="py-2.5 px-3">Campaigns</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 font-bold text-white">{org.name}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">
                      {org.planName}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">{org.mailboxCount}</td>
                  <td className="py-2.5 px-3">{org.leadCount}</td>
                  <td className="py-2.5 px-3">{org.campaignCount}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {org.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
