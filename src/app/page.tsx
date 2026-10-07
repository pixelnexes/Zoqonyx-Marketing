"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Send,
  Zap,
  ShieldCheck,
  Inbox,
  Users,
  BarChart3,
  Mail,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Server,
  Layers,
  ChevronDown,
  Globe,
  Database,
  ExternalLink,
} from "lucide-react";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const faqs = [
    {
      q: "What is Zoqonyx Email Marketing?",
      a: "Zoqonyx is an enterprise-grade, multi-tenant email automation and cold outreach platform built by Nawix Tech Solution. It allows growth teams, sales reps, and agencies to connect multiple email providers, import leads from spreadsheets, launch automated multi-touch sequences, and automatically stop follow-ups the moment a prospect replies.",
    },
    {
      q: "How does automated reply detection work?",
      a: "Zoqonyx continuously monitors connected mailboxes via IMAP synchronization and provider webhooks. When an inbound reply is detected from an active lead, the sequence engine instantly cancels all upcoming follow-up jobs, updates the lead status to REPLIED, and routes the thread to your Unified Inbox.",
    },
    {
      q: "Can I connect Gmail, Hostinger, Mailgun, or custom SMTP/IMAP?",
      a: "Yes. Zoqonyx is built on a provider-agnostic abstraction layer. You can connect Gmail accounts with App Passwords, Hostinger Webmail, Microsoft 365, Mailgun domains via API keys, Amazon SES, or any standard custom SMTP/IMAP server without code modifications.",
    },
    {
      q: "How does the spreadsheet import wizard work?",
      a: "Simply upload any .csv or .xlsx file. Zoqonyx automatically detects and maps your Email, Name, Company, Website, and Phone columns, splits full names into first and last name, eliminates duplicate entries, and assigns custom list tags.",
    },
    {
      q: "Does Zoqonyx guarantee 100% inbox placement or spam bypass?",
      a: "No. Responsible commercial platforms do not make fake '100% inbox bypass' claims. Instead, Zoqonyx provides a Deliverability Advisor that audits your SPF, DKIM, and DMARC records, enforces human-like micro-pacing delays, adheres to sending windows, and manages bounce/unsubscribe suppressions to maximize your genuine sender reputation.",
    },
    {
      q: "Can I connect my existing lead generator or scraper tools?",
      a: "Yes. Zoqonyx provides a high-throughput REST API (POST /api/v1/leads/import) and API Keys. You can configure auto-enrollment rules so newly scraped leads matching your target criteria are automatically entered into active outreach sequences.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-slate-900 text-white text-xs py-2.5 px-4 text-center flex items-center justify-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-slate-950">
          COMMERCIAL PLATFORM
        </span>
        <span className="text-slate-300">
          Engineered & Maintained by{" "}
          <a
            href="https://newixtechsolutions.com/"
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 font-semibold underline-offset-4 hover:underline"
          >
            Nawix Tech Solution
          </a>
        </span>
      </div>

      {/* 2. NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold shadow-sm">
              <Send className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none font-mono">
                ZOQONYX
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                Email Marketing
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition">How It Works</a>
            <a href="#providers" className="hover:text-slate-900 transition">Providers</a>
            <a href="#deliverability" className="hover:text-slate-900 transition">Deliverability</a>
            <a href="#pricing" className="hover:text-slate-900 transition">Pricing</a>
            <a href="#faq" className="hover:text-slate-900 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-xs">
              Sign In
            </Link>
            <Link href="/login" className="btn-primary text-xs">
              <span>Start Free Outreach</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Multi-Tenant Cold Email Sequence Automation</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
          Powerful Email Outreach Automation{" "}
          <span className="text-sky-600">Without the Complexity.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Connect your mailboxes, import lead spreadsheets with automatic column detection, launch multi-touch sequences, and automatically halt follow-ups the moment a prospect replies.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link href="/login" className="btn-primary py-3 px-6 text-sm shadow-md">
            <span>Get Started with Demo Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#how-it-works" className="btn-secondary py-3 px-5 text-sm">
            <span>Explore Architecture</span>
          </a>
        </div>

        {/* Feature Pill Highlights */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-xs text-slate-600">
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Multi-Mailbox Pooling</span>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Auto Reply Detection</span>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Excel / CSV Ingestion</span>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>SPF / DKIM Auditing</span>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-2">Automated Workflow</h2>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              From Raw Spreadsheets to Booked Meetings in 4 Steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-extrabold text-sm">
                01
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Import Lead Sheets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload CSV or Excel files. Zoqonyx auto-maps names, emails, phones, and websites with automatic deduplication.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-sm">
                02
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Connect Senders</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect Gmail, Hostinger, Outlook, or Mailgun with built-in SPF/DKIM verification and daily quota limits.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-sm">
                03
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Build Sequences</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure personalized multi-touch cadences with intelligent fallbacks like <code className="text-[11px] bg-white px-1 py-0.5 rounded border border-slate-200">{"{{first_name}}"}</code>.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-sm">
                04
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Auto-Stop on Reply</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                IMAP synchronizer detects prospect replies in real-time, instantly cancels future sequence steps, and alerts your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section id="pricing" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-2">Transparent Commercial Plans</h2>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Predictable Pricing for High-Volume Outreach
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Starter</h3>
              <p className="text-xs text-slate-500 mt-1">For individual founders & consultants.</p>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">$39 <span className="text-xs font-medium text-slate-400">/ month</span></div>
            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2,500 Active Contacts</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 3 Connected Mailboxes</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 500 Daily Sends</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automated Sequences</li>
            </ul>
            <Link href="/login" className="btn-secondary w-full justify-center text-xs">
              Select Starter
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-white p-6 rounded-xl border-2 border-slate-900 shadow-md space-y-4 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white">
              MOST POPULAR
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Pro Growth</h3>
              <p className="text-xs text-slate-500 mt-1">For scaling sales teams & agencies.</p>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">$79 <span className="text-xs font-medium text-slate-400">/ month</span></div>
            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 10,000 Active Contacts</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 10 Connected Mailboxes</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2,000 Daily Sends</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Reply Interruption Engine</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Public Lead Ingestion API</li>
            </ul>
            <Link href="/login" className="btn-primary w-full justify-center text-xs">
              Select Pro Growth
            </Link>
          </div>

          {/* Business */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Business</h3>
              <p className="text-xs text-slate-500 mt-1">For high-throughput outreach operations.</p>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">$149 <span className="text-xs font-medium text-slate-400">/ month</span></div>
            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 25,000 Active Contacts</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 25 Connected Mailboxes</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 5,000 Daily Sends</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Priority Worker Cluster</li>
            </ul>
            <Link href="/login" className="btn-secondary w-full justify-center text-xs">
              Select Business
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-2">Frequently Asked Questions</h2>
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              Everything You Need to Know About Zoqonyx
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-4 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition text-xs font-bold text-slate-900"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition transform ${activeFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {activeFaq === idx && (
                  <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-950 font-bold">
              <Send className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white font-mono">
              ZOQONYX
            </span>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="text-slate-300">
              Developed & Engineered by{" "}
              <a
                href="https://newixtechsolutions.com/"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 font-semibold hover:underline"
              >
                Nawix Tech Solution
              </a>
            </p>
            <p className="text-[11px] text-slate-500">
              © 2026 Zoqonyx Email Marketing. All rights reserved. Commercial Multi-Tenant Outbound SaaS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
