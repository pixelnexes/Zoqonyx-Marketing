"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function BillingPage() {
  const [billingData, setBillingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  const fetchBilling = () => {
    setLoading(true);
    fetch("/api/v1/billing/subscription")
      .then((res) => res.json())
      .then((data) => {
        setBillingData(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleSwitchPlan = async (planName: string) => {
    setSwitching(planName);
    try {
      const res = await fetch("/api/v1/billing/test-mode-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to switch plan");

      alert(`Successfully upgraded/switched plan to ${planName}!`);
      fetchBilling();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSwitching(null);
    }
  };

  if (loading) {
    return (
      <div className="clean-card p-12 text-center text-xs text-slate-400 rounded-xl">
        Loading subscription details...
      </div>
    );
  }

  const currentPlan = billingData?.plan || { name: "PRO", priceMonthly: 149 };
  const usage = billingData?.usage || {
    contacts: { current: 602, max: 10000 },
    mailboxes: { current: 2, max: 10 },
    activeCampaigns: { current: 1, max: 25 },
    emailsSentToday: { current: 42, max: 1500 },
  };

  const plans = billingData?.availablePlans || [
    { id: "p1", name: "STARTER", priceMonthly: 49, maxContacts: 2500, maxMailboxes: 2, maxDailyEmails: 500, maxCampaigns: 5, hasApiAccess: false },
    { id: "p2", name: "GROWTH", priceMonthly: 99, maxContacts: 10000, maxMailboxes: 5, maxDailyEmails: 1500, maxCampaigns: 15, hasApiAccess: true },
    { id: "p3", name: "PRO", priceMonthly: 149, maxContacts: 25000, maxMailboxes: 15, maxDailyEmails: 5000, maxCampaigns: 50, hasApiAccess: true },
    { id: "p4", name: "AGENCY", priceMonthly: 299, maxContacts: 100000, maxMailboxes: 50, maxDailyEmails: 20000, maxCampaigns: 200, hasApiAccess: true },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-600" />
            <span>Subscription, Quotas & Commercial Billing</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic tier management with instant mailbox capacity and contact quota upgrades.
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span>Active Commercial Plan: {currentPlan.name}</span>
        </div>
      </div>

      {/* CURRENT USAGE METERS */}
      <div className="clean-card p-6 rounded-xl border border-slate-200 bg-white space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs text-slate-400 font-medium">Active Organization Plan</span>
            <div className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <span>{currentPlan.name} Tier</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                ACTIVE
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Monthly Investment</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">${currentPlan.priceMonthly} / mo</div>
          </div>
        </div>

        {/* Quota Progress Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span>Prospect Leads</span>
              <strong className="text-slate-900">{usage.contacts.current} / {usage.contacts.max}</strong>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-sky-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, (usage.contacts.current / usage.contacts.max) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span>Mailboxes Pool</span>
              <strong className="text-slate-900">{usage.mailboxes.current} / {usage.mailboxes.max}</strong>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-sky-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, (usage.mailboxes.current / usage.mailboxes.max) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span>Daily Send Cap</span>
              <strong className="text-slate-900">{usage.emailsSentToday.current} / {usage.emailsSentToday.max}</strong>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-sky-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, (usage.emailsSentToday.current / usage.emailsSentToday.max) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span>Active Sequences</span>
              <strong className="text-slate-900">{usage.activeCampaigns.current} / {usage.activeCampaigns.max}</strong>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-sky-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, (usage.activeCampaigns.current / usage.activeCampaigns.max) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* PLAN COMPARISON TIERS */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">Available Commercial Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p: any) => {
            const isCurrent = currentPlan.name === p.name;
            return (
              <div
                key={p.id}
                className={`clean-card p-5 rounded-xl flex flex-col justify-between border bg-white shadow-sm transition ${
                  isCurrent ? "border-sky-600 ring-2 ring-sky-600/20" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">${p.priceMonthly}</span>
                    <span className="text-[10px] text-slate-500">/month</span>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-1.5">✓ {p.maxContacts.toLocaleString()} Contacts</li>
                    <li className="flex items-center gap-1.5">✓ {p.maxMailboxes} Sending Mailboxes</li>
                    <li className="flex items-center gap-1.5">✓ {p.maxDailyEmails.toLocaleString()} Emails/Day</li>
                    <li className="flex items-center gap-1.5">✓ {p.maxCampaigns} Active Campaigns</li>
                    {p.hasApiAccess && <li className="text-sky-700 font-semibold flex items-center gap-1.5">✓ Full API Access</li>}
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => handleSwitchPlan(p.name)}
                    disabled={isCurrent || switching === p.name}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition ${
                      isCurrent
                        ? "bg-slate-100 text-slate-400 cursor-default"
                        : "btn-sky"
                    }`}
                  >
                    {isCurrent ? "Current Plan" : switching === p.name ? "Switching..." : "Switch to " + p.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
