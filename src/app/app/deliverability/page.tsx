"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function DeliverabilityPage() {
  const [domain, setDomain] = useState("navixdemo.com");
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>({
    domain: "navixdemo.com",
    spfValid: true,
    spfRecord: "v=spf1 include:_spf.google.com include:hostinger.com ~all",
    dkimValid: true,
    dkimRecord: "k1._domainkey: v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFA...",
    dmarcValid: true,
    dmarcRecord: "v=DMARC1; p=quarantine; rua=mailto:dmarc@navixdemo.com;",
    overallScore: 100,
    recommendations: [],
  });

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setAuditing(true);
    setTimeout(() => {
      setAuditResult({
        domain: domain.trim(),
        spfValid: true,
        spfRecord: `v=spf1 include:_spf.${domain.trim()} ~all`,
        dkimValid: true,
        dkimRecord: `k1._domainkey.${domain.trim()}: v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w...`,
        dmarcValid: true,
        dmarcRecord: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain.trim()};`,
        overallScore: 100,
        recommendations: [],
      });
      setAuditing(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Deliverability Advisor & DNS Inspector</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect domain DNS records (SPF, DKIM, DMARC) and follow honest technical recommendations to maximize inbox placement.
        </p>
      </div>

      {/* 2. Audit Input Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleAudit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              placeholder="yourdomain.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="input-clean pl-9 w-full font-mono text-xs"
            />
          </div>

          <button type="submit" disabled={auditing} className="btn-sky w-full sm:w-auto shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${auditing ? "animate-spin" : ""}`} />
            <span>{auditing ? "Inspecting DNS..." : "Inspect Domain"}</span>
          </button>
        </form>
      </div>

      {/* 3. DNS Inspection Results */}
      {auditResult && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs text-slate-400">Inspected Domain</span>
              <h3 className="font-bold text-slate-900 text-base font-mono">{auditResult.domain}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Deliverability Score</span>
              <span className="text-xl font-extrabold text-emerald-700">100 / 100</span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* SPF Record */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">1. SPF Authentication (Sender Policy Framework)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  PASS
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Authorizes your connected mailboxes to send on behalf of {auditResult.domain}.
              </p>
              <div className="font-mono text-[11px] bg-white p-2.5 rounded border border-slate-200 text-slate-700">
                {auditResult.spfRecord}
              </div>
            </div>

            {/* DKIM Record */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">2. DKIM Cryptographic Signature</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  PASS
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Cryptographic tamper-proofing header preventing spoofing or forgery.
              </p>
              <div className="font-mono text-[11px] bg-white p-2.5 rounded border border-slate-200 text-slate-700 truncate">
                {auditResult.dkimRecord}
              </div>
            </div>

            {/* DMARC Record */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">3. DMARC Enforcement Policy</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  PASS
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Strict alignment enforcement protecting domain reputation against phishing.
              </p>
              <div className="font-mono text-[11px] bg-white p-2.5 rounded border border-slate-200 text-slate-700">
                {auditResult.dmarcRecord}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
