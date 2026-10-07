"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Megaphone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

export default function NewCampaignPage() {
  const router = useRouter();
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mailboxId, setMailboxId] = useState("");
  const [targetCategory, setTargetCategory] = useState("ALL");
  const [dailyLimit, setDailyLimit] = useState(50);
  const [timezone, setTimezone] = useState("America/New_York");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Mailboxes
    fetch("/api/v1/mailboxes")
      .then((res) => res.json())
      .then((data) => {
        if (data.mailboxes && data.mailboxes.length > 0) {
          setMailboxes(data.mailboxes);
          setMailboxId(data.mailboxes[0].id);
        }
      })
      .catch(() => {});

    // Fetch Categories for target selection
    fetch("/api/v1/leads/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          mailboxId: mailboxId || undefined,
          targetListTag: targetCategory === "ALL" ? undefined : targetCategory,
          dailyLimit: Number(dailyLimit),
          timezone,
          sendingDays: [1, 2, 3, 4, 5],
          startHour: 9,
          endHour: 17,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create campaign");

      // Redirect to sequence builder for this campaign
      router.push(`/app/campaigns/${data.campaign.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/app/campaigns"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaigns
      </Link>

      <div className="clean-card p-8 rounded-xl border border-slate-200 shadow-sm bg-white">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mb-3 shadow-xs">
            <Megaphone className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create New Outreach Campaign</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure your campaign parameters, sending mailbox, target prospect folder, and daily sending pace.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. US Cafes & Coffee Shops Outreach Q4"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-2xs transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Campaign Description / Outreach Objective
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Targeting business owners for website mobile responsiveness and local customer acquisition."
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-2xs transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Sending Mailbox</span>
                <Link href="/app/mailboxes" className="text-[11px] text-sky-600 hover:underline">
                  + Add Mailbox
                </Link>
              </label>
              <select
                value={mailboxId}
                onChange={(e) => setMailboxId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-2xs transition"
              >
                {mailboxes.length === 0 ? (
                  <option value="">No Mailboxes Connected</option>
                ) : (
                  mailboxes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fromName} ({m.email})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Lead Folder / Category
              </label>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-2xs transition"
              >
                <option value="ALL">All Available Leads (Entire Lead Bank)</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.count} leads)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Campaign Daily Send Pace Limit
              </label>
              <input
                type="number"
                required
                min={1}
                max={5000}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-2xs transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Sending Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-2xs transition"
              >
                <option value="America/New_York">Eastern Time (US & Canada - UTC-5)</option>
                <option value="America/Chicago">Central Time (US & Canada - UTC-6)</option>
                <option value="America/Denver">Mountain Time (US & Canada - UTC-7)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada - UTC-8)</option>
                <option value="Europe/London">London (GMT / UTC+0)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <Link
              href="/app/campaigns"
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-sky text-xs py-2 px-5 font-semibold flex items-center gap-2"
            >
              {loading ? "Creating..." : "Save & Open Sequence Builder"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
