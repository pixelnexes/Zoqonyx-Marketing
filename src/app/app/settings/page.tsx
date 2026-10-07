"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Code2,
  Trash2,
  Users,
  Building,
  Globe,
  Zap,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchKeys = () => {
    setLoading(true);
    fetch("/api/v1/api-keys")
      .then((res) => res.json())
      .then((data) => {
        if (data.keys) setApiKeys(data.keys);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "Scraper Bot Key" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate key");

      setGeneratedKey(data.apiKey);
      setNewKeyName("");
      fetchKeys();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">API Keys & Lead Generator Integration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Connect your custom lead scrapers, Apollo, ZoomInfo, or CRM directly to Zoqonyx.
        </p>
      </div>

      {/* 1. CONNECT LEAD GENERATOR INTEGRATION HERO */}
      <div className="clean-card p-6 rounded-xl border border-sky-200 bg-sky-50/50 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5 text-sky-700">
          <Zap className="w-5 h-5" />
          <h2 className="text-base font-bold text-slate-900">Stream Leads from External Scrapers & Tools</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Use the <strong>POST /api/v1/leads</strong> endpoint with your Bearer API Key to push newly discovered prospects into Zoqonyx in real-time. Automated campaign sequence enrollment rules will route matching leads instantly.
        </p>

        <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner">
          <div className="text-slate-400 text-[10px] mb-1">// High-Speed JSON Ingestion API Endpoint:</div>
          <div className="text-sky-300 font-bold">POST http://localhost:3000/api/v1/leads</div>
          <div className="text-slate-300 mt-1">Authorization: Bearer zoq_live_...</div>
        </div>
      </div>

      {/* 2. GENERATE API KEY */}
      <div className="clean-card p-6 rounded-xl border border-slate-200 bg-white space-y-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-sky-600" />
          API Key Generator
        </h2>

        {generatedKey && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> API Key Created! Copy and save it now:
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedKey}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-mono text-emerald-900 font-semibold"
              />
              <button
                onClick={() => copyToClipboard(generatedKey)}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
              >
                {copied ? "Copied!" : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <p className="text-[10px] text-emerald-700">
              For security reasons, this secret key will never be displayed in plain text again.
            </p>
          </div>
        )}

        <form onSubmit={handleGenerateKey} className="flex gap-3">
          <input
            type="text"
            required
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="e.g. Scraper Bot Production"
            className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-2xs"
          />
          <button
            type="submit"
            disabled={generating}
            className="btn-sky text-xs py-2.5 px-4 font-semibold shrink-0"
          >
            <Plus className="w-4 h-4" />
            {generating ? "Generating..." : "Create API Key"}
          </button>
        </form>

        {/* Active Keys Table */}
        <div className="pt-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active API Keys</div>
          {loading ? (
            <div className="text-xs text-slate-400">Loading keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-xs text-slate-400 p-4 border border-dashed border-slate-200 rounded-lg text-center">
              No API keys created yet. Generate a key above to stream leads directly from external bots.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
              {apiKeys.map((k) => (
                <div key={k.id} className="p-3 bg-white flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{k.name}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">Prefix: {k.keyPrefix}...</div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500">
                    <div>Created {new Date(k.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. CODE SNIPPET / INTEGRATION EXAMPLE */}
      <div className="clean-card p-6 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-sky-600" />
          Example cURL Request for External Lead Scrapers
        </h2>

        <pre className="p-4 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed shadow-inner">
{`curl -X POST http://localhost:3000/api/v1/leads \\
  -H "Authorization: Bearer zoq_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "dr.smith@dallasdental.com",
    "firstName": "Robert",
    "lastName": "Smith",
    "company": "Dallas Dental Care",
    "jobTitle": "Clinical Director",
    "industry": "Healthcare & Clinics",
    "city": "Dallas",
    "phone": "+1-214-555-0199",
    "website": "https://dallasdentalcare.com"
  }'`}
        </pre>
      </div>
    </div>
  );
}
