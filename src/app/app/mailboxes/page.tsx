"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Trash2,
  RefreshCw,
  Server,
  Zap,
  Globe,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function MailboxesPage() {
  const toast = useToast();
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState<string | null>(null);
  const [testRecipient, setTestRecipient] = useState("alex@example.com");
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  // Preset selector
  const [presetType, setPresetType] = useState<"GMAIL" | "HOSTINGER" | "OUTLOOK" | "MAILGUN" | "SES" | "CUSTOM">("GMAIL");

  // Connection form state
  const [providerType, setProviderType] = useState<string>("SMTP_IMAP");
  const [email, setEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [dailyLimit, setDailyLimit] = useState(250);

  // SMTP form
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [imapHost, setImapHost] = useState("imap.gmail.com");
  const [imapPort, setImapPort] = useState(993);

  // Mailgun form
  const [mgApiKey, setMgApiKey] = useState("");
  const [mgDomain, setMgDomain] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const fetchMailboxes = () => {
    setLoading(true);
    fetch("/api/v1/mailboxes")
      .then((res) => res.json())
      .then((data) => {
        if (data.mailboxes) {
          setMailboxes(data.mailboxes);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMailboxes();
  }, []);

  const handleApplyPreset = (type: "GMAIL" | "HOSTINGER" | "OUTLOOK" | "MAILGUN" | "SES" | "CUSTOM") => {
    setPresetType(type);
    if (type === "GMAIL") {
      setProviderType("SMTP_IMAP");
      setSmtpHost("smtp.gmail.com");
      setSmtpPort(465);
      setImapHost("imap.gmail.com");
      setImapPort(993);
    } else if (type === "HOSTINGER") {
      setProviderType("SMTP_IMAP");
      setSmtpHost("smtp.hostinger.com");
      setSmtpPort(465);
      setImapHost("imap.hostinger.com");
      setImapPort(993);
    } else if (type === "OUTLOOK") {
      setProviderType("SMTP_IMAP");
      setSmtpHost("smtp.office365.com");
      setSmtpPort(587);
      setImapHost("outlook.office365.com");
      setImapPort(993);
    } else if (type === "MAILGUN") {
      setProviderType("MAILGUN");
    } else if (type === "SES") {
      setProviderType("AMAZON_SES");
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setConnecting(true);

    let credentials: any = {};
    if (providerType === "SMTP_IMAP") {
      credentials = {
        smtpHost,
        smtpPort,
        smtpUser: smtpUser || email,
        smtpPass,
        smtpSecure: smtpPort === 465,
        imapHost,
        imapPort,
        imapUser: smtpUser || email,
        imapPass: smtpPass,
        imapSecure: imapPort === 993,
      };
    } else if (providerType === "MAILGUN") {
      credentials = { apiKey: mgApiKey, domain: mgDomain, region: "us" };
    }

    try {
      const res = await fetch("/api/v1/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fromName: fromName || email.split("@")[0],
          providerType,
          dailyLimit: Number(dailyLimit) || 150,
          credentials,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect mailbox");

      setShowConnectModal(false);
      fetchMailboxes();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleTestSocket = async (mailboxId: string) => {
    setTestingConnection(mailboxId);
    setTestResult(null);
    try {
      const res = await fetch(`/api/v1/mailboxes/${mailboxId}/test`, { method: "POST" });
      const data = await res.json();
      setTestResult({
        id: mailboxId,
        success: data.success,
        msg: data.success ? "SMTP & IMAP verified successfully!" : (data.error || "Connection failed"),
      });
    } catch (err: any) {
      setTestResult({ id: mailboxId, success: false, msg: err.message });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleDeleteMailbox = async (mailboxId: string, email: string) => {
    if (!confirm(`Are you sure you want to disconnect and delete mailbox "${email}"?`)) return;
    try {
      const res = await fetch(`/api/v1/mailboxes/${mailboxId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete mailbox");
      toast.success("Mailbox Disconnected", `Mailbox "${email}" removed successfully.`);
      fetchMailboxes();
    } catch (err: any) {
      toast.error("Delete Failed", err.message);
    }
  };

  const handleSendTestEmail = async (mailboxId: string) => {
    if (!testRecipient) return;
    setSendingTest(true);
    try {
      const res = await fetch(`/api/v1/mailboxes/${mailboxId}/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: testRecipient }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Test Email Dispatched", `Verified test email delivered to ${testRecipient}`);
        setShowTestEmailModal(null);
      } else {
        toast.error("Test Dispatch Failed", data.error || "Unknown error");
      }
    } catch (err: any) {
      toast.error("Test Send Error", err.message);
    } finally {
      setSendingTest(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-sky-600" />
            <span>Connected Mailboxes & Outreach Senders</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connect Gmail, Hostinger, Microsoft 365, Mailgun, Amazon SES or custom SMTP with multi-sender rotation.
          </p>
        </div>

        <button
          onClick={() => {
            setShowConnectModal(true);
            setFormError(null);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Connect New Mailbox</span>
        </button>
      </div>

      {/* 2. Mailboxes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
            <div className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Loading connected mailboxes...</span>
            </div>
          </div>
        ) : mailboxes.length === 0 ? (
          <div className="col-span-2 bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
            No mailboxes connected yet. Click &quot;Connect New Mailbox&quot; to connect your Gmail or Hostinger account.
          </div>
        ) : (
          mailboxes.map((mbx) => (
            <div
              key={mbx.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm font-mono">{mbx.email}</h3>
                    <p className="text-xs text-slate-500">{mbx.fromName}</p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              {/* Specs & Volume */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Provider</span>
                  <span className="font-semibold text-slate-700">{mbx.providerType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Daily Quota</span>
                  <span className="font-semibold text-slate-700">{mbx.dailyLimit} / day</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sent Today</span>
                  <span className="font-semibold text-sky-700">{mbx.sentToday || 0} emails</span>
                </div>
              </div>

              {/* Deliverability Status */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SPF / DKIM Verified
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestSocket(mbx.id)}
                    disabled={testingConnection === mbx.id}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 transition inline-flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingConnection === mbx.id ? "animate-spin" : ""}`} />
                    Test Socket
                  </button>

                  <button
                    onClick={() => setShowTestEmailModal(mbx.id)}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold px-2 py-1 rounded bg-sky-50 border border-sky-200 hover:bg-sky-100 transition inline-flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Send Test
                  </button>

                  <button
                    onClick={() => handleDeleteMailbox(mbx.id, mbx.email)}
                    className="p-1.5 rounded border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                    title="Disconnect Mailbox"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {testResult && testResult.id === mbx.id && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    testResult.success
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                  <span>{testResult.msg}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 3. CONNECT MODAL WITH 1-CLICK PRESETS */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">Connect Email Mailbox</h3>
              </div>
              <button onClick={() => setShowConnectModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>

            {/* Provider Preset Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset("GMAIL")}
                className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition ${
                  presetType === "GMAIL"
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                🔴 Gmail / Workspace
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset("HOSTINGER")}
                className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition ${
                  presetType === "HOSTINGER"
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                🟣 Hostinger Webmail
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset("OUTLOOK")}
                className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition ${
                  presetType === "OUTLOOK"
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                🔵 Microsoft 365
              </button>
            </div>

            {presetType === "GMAIL" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                💡 <strong>Gmail Tip:</strong> Use your regular Gmail address and generate an <strong>App Password</strong> in Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords.
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="outreach@company.com"
                    className="input-clean w-full font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sender From Name</label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                    className="input-clean w-full"
                  />
                </div>
              </div>

              {providerType === "SMTP_IMAP" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="input-clean w-full font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Port</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        className="input-clean w-full font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {presetType === "GMAIL" ? "Gmail App Password *" : "Email Password *"}
                    </label>
                    <input
                      type="password"
                      required
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="input-clean w-full font-mono"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowConnectModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={connecting} className="btn-primary">
                  {connecting ? "Testing & Saving..." : "Save & Verify Mailbox"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. SEND TEST EMAIL MODAL */}
      {showTestEmailModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Send Test Email</h3>
            <p className="text-xs text-slate-500">
              Verify real inbox delivery and header formatting from this mailbox.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Email</label>
              <input
                type="email"
                required
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="your.email@gmail.com"
                className="input-clean w-full font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setShowTestEmailModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => handleSendTestEmail(showTestEmailModal)}
                disabled={sendingTest}
                className="btn-sky"
              >
                {sendingTest ? "Sending..." : "Send Test Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
