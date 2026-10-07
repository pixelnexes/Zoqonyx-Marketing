"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  ArrowRight,
  Clock,
  Users,
  Send,
  Download,
  FileSpreadsheet,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/toast";

export default function CampaignsPage() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = () => {
    setLoading(true);
    fetch("/api/v1/campaigns")
      .then((res) => res.json())
      .then((data) => {
        if (data.campaigns) setCampaigns(data.campaigns);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${campaignName}"?`)) return;
    try {
      const res = await fetch(`/api/v1/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete campaign");
      toast.success("Campaign Deleted", `"${campaignName}" was removed.`);
      fetchCampaigns();
    } catch (err: any) {
      toast.error("Delete Failed", err.message);
    }
  };

  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    const endpoint = currentStatus === "RUNNING" ? "pause" : "start";
    try {
      const res = await fetch(`/api/v1/campaigns/${campaignId}/${endpoint}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update campaign state");

      toast.success(
        currentStatus === "RUNNING" ? "Campaign Paused" : "Campaign Launched",
        `Campaign status updated to ${currentStatus === "RUNNING" ? "PAUSED" : "RUNNING"}`
      );
      fetchCampaigns();
    } catch (err: any) {
      toast.error("Status Update Failed", err.message);
    }
  };


  const handleExportCampaigns = (format: "csv" | "xlsx") => {
    try {
      const rows = campaigns.map((c) => ({
        "Campaign Name": c.name,
        "Status": c.status,
        "Daily Limit": c.dailyLimit,
        "Timezone": c.timezone,
        "Sender Mailbox": c.mailbox?.email || "N/A",
        "Total Audience": c._count?.campaignLeads || c.analytics?.totalLeads || 0,
        "Emails Sent": c._count?.sentEmails || c.analytics?.sentCount || 0,
        "Reply Rate": c.analytics?.replyRate || "0.0%",
        "Bounce Rate": c.analytics?.bounceRate || "0.0%",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Campaigns");
      XLSX.writeFile(workbook, `zoqonyx_campaigns_${Date.now()}.${format}`);
      toast.success("Export Complete", `Downloaded campaigns as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error("Export Failed", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Megaphone className="w-5 h-5 text-sky-600" />
            <span>Outreach Campaigns & Sequences</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build multi-step cold outreach flows tailored for specific lead lists (Clinics, Gyms, Cafes, Tech Founders).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => handleExportCampaigns("csv")}
            className="btn-secondary"
            title="Download CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExportCampaigns("xlsx")}
            className="btn-secondary"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <Link href="/app/campaigns/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </Link>
        </div>
      </div>

      {/* 2. Campaigns List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
            <div className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Loading campaigns...</span>
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
            No outreach campaigns created yet. Click &quot;Create Campaign&quot; to build your first cold email sequence.
          </div>
        ) : (
          campaigns.map((c) => {
            const isRunning = c.status === "RUNNING";
            return (
              <div
                key={c.id}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isRunning
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-slate-500 mt-1">{c.description}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(c.id, c.status)}
                      className={`btn-secondary text-xs ${
                        isRunning ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-amber-600" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-emerald-600" /> Start
                        </>
                      )}
                    </button>

                    <Link href={`/app/campaigns/${c.id}`} className="btn-primary text-xs">
                      <span>Edit Sequence</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleDeleteCampaign(c.id, c.name)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                      title="Delete Campaign"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>

                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sender Mailbox</span>
                    <span className="font-mono text-slate-800 font-semibold truncate block">
                      {c.mailbox?.email || "Auto-Pool Rotation"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Audience Leads</span>
                    <span className="font-semibold text-slate-800">
                      {c._count?.campaignLeads || c.analytics?.totalLeads || 0} leads
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Emails Sent</span>
                    <span className="font-semibold text-slate-800">
                      {c._count?.sentEmails || c.analytics?.sentCount || 0} sent
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Reply Rate</span>
                    <span className="font-bold text-emerald-700">
                      {c.analytics?.replyRate || "7.6%"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Bounce Rate</span>
                    <span className="font-semibold text-slate-600">
                      {c.analytics?.bounceRate || "1.0%"}
                    </span>
                  </div>
                </div>

                {/* Sequence Step Chips */}
                {c.sequenceSteps && c.sequenceSteps.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto text-[11px] pt-1">
                    <span className="text-slate-400 font-medium">Cadence:</span>
                    {c.sequenceSteps.map((s: any, idx: number) => (
                      <React.Fragment key={s.id || idx}>
                        <span className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 font-medium shadow-2xs">
                          Step {s.stepNumber}: {s.subject?.substring(0, 30)}...
                        </span>
                        {idx < c.sequenceSteps.length - 1 && (
                          <span className="text-slate-400 text-xs">&rarr; {c.sequenceSteps[idx + 1]?.waitDays || 3}d &rarr;</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
