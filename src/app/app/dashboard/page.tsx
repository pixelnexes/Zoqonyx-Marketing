"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Megaphone,
  Mail,
  Send,
  Clock,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  UserX,
  Plus,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const [stats] = useState<any>({
    totalLeads: 148,
    activeCampaigns: 2,
    sentToday: 118,
    scheduledEmails: 52,
    replies: 29,
    positiveReplies: 14,
    bounces: 4,
    unsubscribes: 2,
    activeMailboxes: 2,
  });

  const chartData = [
    { day: "Mon", sent: 45, replies: 3, bounces: 0 },
    { day: "Tue", sent: 82, replies: 6, bounces: 1 },
    { day: "Wed", sent: 110, replies: 8, bounces: 1 },
    { day: "Thu", sent: 125, replies: 11, bounces: 0 },
    { day: "Fri", sent: 118, replies: 9, bounces: 2 },
    { day: "Sat", sent: 20, replies: 1, bounces: 0 },
    { day: "Sun", sent: 10, replies: 0, bounces: 0 },
  ];

  const recentActivities = [
    {
      icon: MessageSquare,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      title: "Inbound Prospect Reply",
      desc: "Dr. Sarah Jenkins (Metro Health Clinic) replied: 'Yes, we are actively looking into patient follow-up automation. Send over a deck.'",
      time: "15 minutes ago",
      tag: "Follow-ups Automatically Stopped",
    },
    {
      icon: Send,
      color: "text-sky-700 bg-sky-50 border-sky-200",
      title: "Sequence Step 1 Dispatched",
      desc: "Sent personalized cold email to David Miller (Apex Healthcare Innovations).",
      time: "45 minutes ago",
      tag: "Dispatched",
    },
    {
      icon: Users,
      color: "text-indigo-700 bg-indigo-50 border-indigo-200",
      title: "Lead Sheet Ingested",
      desc: "Imported 85 validated B2B SaaS leads under list tag 'Series A Startups'.",
      time: "2 hours ago",
      tag: "Deduplicated",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-sky-600" />
            <span>Outreach Performance Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-mailbox sending metrics, reply detection, and delivery telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/app/leads" className="btn-secondary">
            <Users className="w-4 h-4 text-slate-500" />
            <span>Import Leads</span>
          </Link>
          <Link href="/app/campaigns/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </Link>
        </div>
      </div>

      {/* 2. Primary KPI Meter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Total Leads</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.totalLeads}</div>
          <span className="text-[10px] text-slate-400 font-medium">Across all lists</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Sent Today</span>
            <Send className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-sky-700">{stats.sentToday}</div>
          <span className="text-[10px] text-slate-400 font-medium">Daily allowance: 750</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Replies</span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{stats.replies}</div>
          <span className="text-[10px] text-emerald-600 font-bold">7.6% Reply Rate</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Scheduled</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">{stats.scheduledEmails}</div>
          <span className="text-[10px] text-slate-400 font-medium">Queued for window</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Mailboxes</span>
            <Mail className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.activeMailboxes}</div>
          <span className="text-[10px] text-emerald-600 font-medium">100% Healthy</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Bounce Rate</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">1.0%</div>
          <span className="text-[10px] text-slate-400 font-medium">Target: &lt; 2.0%</span>
        </div>
      </div>

      {/* 3. Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sending Activity Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Outreach & Reply Activity</h3>
              <p className="text-xs text-slate-500">Volume distribution across connected senders.</p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              Live BullMQ Queue
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Area type="monotone" dataKey="sent" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" name="Sent Emails" />
                <Area type="monotone" dataKey="replies" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReplies)" name="Inbound Replies" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deliverability & Warmup Widget */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Domain Health</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Optimal
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">SPF Alignment</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pass
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">DKIM Signature</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 2048-bit Valid
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">DMARC Policy</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> p=quarantine
              </span>
            </div>

            <div className="pt-2">
              <Link
                href="/app/deliverability"
                className="btn-secondary w-full text-xs justify-center"
              >
                <span>View Full Deliverability Advisor</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Real-Time Activity Log */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Recent Automated Events</h3>

        <div className="space-y-3">
          {recentActivities.map((act, idx) => {
            const Icon = act.icon;
            return (
              <div
                key={idx}
                className="flex items-start justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div className="flex items-start gap-3">
                  <span className={`p-2 rounded-lg border shrink-0 ${act.color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                      <span className="text-[10px] text-slate-400">• {act.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{act.desc}</p>
                  </div>
                </div>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0 ml-2">
                  {act.tag}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
