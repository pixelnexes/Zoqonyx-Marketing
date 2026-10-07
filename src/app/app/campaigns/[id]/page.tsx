"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Megaphone,
  Mail,
  Plus,
  Trash2,
  Play,
  Pause,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Eye,
  ArrowLeft,
  Save,
  ShieldCheck,
  Code2,
  RefreshCw,
  Zap,
} from "lucide-react";

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [campaign, setCampaign] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"sequence" | "analytics">("sequence");

  // Test preview modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  // Live batch dispatch modal
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchLimit, setDispatchLimit] = useState(25);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResults, setDispatchResults] = useState<any>(null);

  const fetchCampaign = () => {
    setLoading(true);
    fetch(`/api/v1/campaigns/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.campaign) {
          setCampaign(data.campaign);
          if (data.campaign.sequenceSteps && data.campaign.sequenceSteps.length > 0) {
            setSteps(data.campaign.sequenceSteps);
          } else {
            setSteps([
              {
                stepNumber: 1,
                stepType: "EMAIL",
                waitDays: 0,
                subject: "Quick question regarding {{name | fallback:'your business'}}",
                bodyHtml: "<p>Hi {{first_name | fallback:'there'}},</p><p>I noticed {{name}} has a strong market reputation in {{city | fallback:'your city'}}.</p><p>We help businesses in your space streamline outbound client acquisition with guaranteed deliverability.</p><p>Would you be open to a 5-minute conversation this week?</p><p>Best regards,<br/>Alex Vance</p>",
              },
              {
                stepNumber: 2,
                stepType: "EMAIL",
                waitDays: 3,
                subject: "Following up regarding {{name}}",
                bodyHtml: "<p>Hi {{first_name | fallback:'there'}},</p><p>Just following up on my previous note. Let me know if you would like a 60-second summary demo.</p>",
              },
            ]);
          }
        }
        setLoading(false);
      });

    fetch(`/api/v1/campaigns/${id}/analytics`)
      .then((res) => res.json())
      .then((data) => {
        if (data.analytics) setAnalytics(data.analytics);
      });
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const handleAddStep = () => {
    const nextNumber = steps.length + 1;
    setSteps([
      ...steps,
      {
        stepNumber: nextNumber,
        stepType: "EMAIL",
        waitDays: 4,
        subject: `Follow-up #${nextNumber - 1} for {{name}}`,
        bodyHtml: "<p>Hi {{first_name | fallback:'there'}},</p><p>Wanted to share a quick case study relevant to {{name}}.</p>",
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) {
      alert("Campaign must have at least one sequence step.");
      return;
    }
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setSteps(updated);
  };

  const handleStepChange = (index: number, field: string, value: any) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const handleSaveSequence = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/campaigns/${id}/sequences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save sequence");

      alert("Sequence cadence saved successfully!");
      fetchCampaign();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const endpoint = campaign.status === "RUNNING" ? "pause" : "start";
    try {
      const res = await fetch(`/api/v1/campaigns/${id}/${endpoint}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      fetchCampaign();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendTestRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setSendingTest(true);
    try {
      const res = await fetch(`/api/v1/campaigns/${id}/test-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: testEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Test send failed");

      alert(`Live preview test email dispatched to ${testEmail}! Check your inbox.`);
      setShowTestModal(false);
      setTestEmail("");
      fetchCampaign();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  const handleRunDispatch = async () => {
    setDispatching(true);
    setDispatchResults(null);
    try {
      const res = await fetch(`/api/v1/campaigns/${id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: dispatchLimit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch dispatch failed");
      setDispatchResults(data);
      fetchCampaign();
    } catch (err: any) {
      alert(`Dispatch error: ${err.message}`);
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="clean-card p-12 text-center text-xs text-slate-500 rounded-xl">
        Loading campaign cadences...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="clean-card p-12 text-center text-xs text-red-600 rounded-xl">
        Campaign not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <Link
            href="/app/campaigns"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-2 transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaigns
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{campaign.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                campaign.status === "RUNNING"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : campaign.status === "PAUSED"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {campaign.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sender: <strong className="text-slate-800">{campaign.mailbox?.email || "Outreach Mailbox"}</strong> • Daily Pace Limit:{" "}
            <strong className="text-slate-800">{campaign.dailyLimit} emails/day</strong> • Audience Target:{" "}
            <strong className="text-slate-800">{campaign.targetListTag || "All Leads"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* LIVE DISPATCH BUTTON */}
          <button
            onClick={() => {
              setShowDispatchModal(true);
              setDispatchResults(null);
            }}
            className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Send Outbound Batch</span>
          </button>

          <button
            onClick={() => setShowTestModal(true)}
            className="btn-secondary text-xs"
          >
            <Eye className="w-3.5 h-3.5 text-sky-600" />
            Send Test Preview
          </button>

          <button
            onClick={handleSaveSequence}
            disabled={saving}
            className="btn-secondary text-xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            {saving ? "Saving..." : "Save Cadence"}
          </button>

          <button
            onClick={handleToggleStatus}
            className={`btn-primary text-xs ${
              campaign.status === "RUNNING" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {campaign.status === "RUNNING" ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Launch
              </>
            )}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("sequence")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === "sequence"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Sequence Cadence ({steps.length} Steps)
        </button>
        <button
          onClick={() => {
            setActiveTab("analytics");
            fetchCampaign();
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === "analytics"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Performance Telemetry
        </button>
      </div>

      {/* TAB 1: SEQUENCE BUILDER */}
      {activeTab === "sequence" && (
        <div className="space-y-6">
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                <strong>Dynamic Personalization Tags:</strong> <code>&#123;&#123;name&#125;&#125;</code>,{" "}
                <code>&#123;&#123;first_name&#125;&#125;</code>, <code>&#123;&#123;company&#125;&#125;</code>,{" "}
                <code>&#123;&#123;city&#125;&#125;</code>, <code>&#123;&#123;job_title&#125;&#125;</code>,{" "}
                <code>&#123;&#123;first_name | fallback:&quot;there&quot;&#125;&#125;</code>
              </span>
            </div>
            <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-semibold border border-sky-300">
              Auto-Unsubscribe Included
            </span>
          </div>

          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div key={idx} className="clean-card p-6 rounded-xl border border-slate-200 bg-white shadow-sm relative space-y-4">
                {/* Step Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {step.stepNumber}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        {idx === 0 ? "Initial Cold Outreach" : `Follow-up #${idx}`}
                      </span>
                      {idx > 0 && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Wait</span>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={step.waitDays}
                            onChange={(e) => handleStepChange(idx, "waitDays", Number(e.target.value))}
                            className="w-12 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-slate-900 font-bold"
                          />
                          <span>days after previous email • <strong>Stops automatically if prospect replies</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {steps.length > 1 && (
                    <button
                      onClick={() => handleRemoveStep(idx)}
                      className="text-slate-400 hover:text-red-600 transition p-1"
                      title="Remove Step"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={step.subject || ""}
                    onChange={(e) => handleStepChange(idx, "subject", e.target.value)}
                    placeholder="e.g. Modernizing mobile intake for {{name}}"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-2xs"
                  />
                </div>

                {/* Email Body Content */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Body (HTML / Plaintext)</label>
                  <textarea
                    rows={6}
                    value={step.bodyHtml || ""}
                    onChange={(e) => handleStepChange(idx, "bodyHtml", e.target.value)}
                    className="w-full font-mono text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-2xs leading-relaxed"
                    placeholder="<p>Hi {{first_name | fallback:'there'}},</p><p>I noticed...</p>"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleAddStep}
              className="btn-secondary text-xs px-5 py-2.5 font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-sky-600" />
              Add Follow-up Step
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS & TELEMETRY */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="clean-card p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Target Audience</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{analytics?.totalLeads || 0}</div>
              <span className="text-[11px] text-slate-500">{campaign.targetListTag || "All Categorized Leads"}</span>
            </div>
            <div className="clean-card p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Emails Dispatched</span>
              <div className="text-2xl font-bold text-sky-600 mt-1">{analytics?.sentEmails || analytics?.deliveredCount || 0}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">{analytics?.deliveredCount || 0} delivered</span>
            </div>
            <div className="clean-card p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Open Rate (Est.)</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{analytics?.openRate || 0}%</div>
              <span className="text-[11px] text-emerald-600 font-semibold">{analytics?.openedCount || 0} opened</span>
            </div>
            <div className="clean-card p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Replies Received</span>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{analytics?.repliedCount || 0}</div>
              <span className="text-[11px] text-indigo-600 font-semibold">{analytics?.replyRate || 0}% reply rate</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: LIVE BATCH DISPATCH MODAL */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clean-card p-6 rounded-xl max-w-lg w-full border border-slate-200 bg-white shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Launch Outbound Batch</h2>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                Sender: {campaign.mailbox?.email || "Connected Mailbox"}
              </span>
            </div>

            {!dispatchResults ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  This action will render <strong>Step 1</strong> for candidate leads in your target category (
                  <span className="font-semibold text-slate-900">{campaign.targetListTag || "All Leads"}</span>) and
                  dispatch personalized emails via your connected mailbox.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Batch Volume</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setDispatchLimit(num)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition border ${
                          dispatchLimit === num
                            ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {num} Leads
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div>• <strong>Subject:</strong> {steps[0]?.subject || "Partnership Inquiry"}</div>
                  <div>• <strong>Pacing Delay:</strong> Automatic socket pacing to protect sender deliverability.</div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDispatchModal(false)}
                    className="btn-secondary text-xs py-2 px-3.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={dispatching}
                    onClick={handleRunDispatch}
                    className="btn-primary text-xs py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
                  >
                    {dispatching ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Outbound Batch...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Confirm & Send {dispatchLimit} Emails</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-1">
                  <div className="font-bold text-sm flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Batch Dispatched Successfully!
                  </div>
                  <div>
                    Processed: <strong>{dispatchResults.totalProcessed}</strong> • Delivered:{" "}
                    <strong className="text-emerald-700">{dispatchResults.successCount}</strong> • Failed:{" "}
                    <strong>{dispatchResults.failedCount}</strong>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 mb-2">Live Dispatch Log</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50 text-[11px]">
                    {dispatchResults.dispatches?.map((d: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200"
                      >
                        <span className="font-medium text-slate-800 truncate max-w-[200px]">
                          {d.toEmail}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            d.status === "SENT"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {d.status === "SENT" ? "Delivered (250 OK)" : "Failed"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDispatchModal(false);
                      setDispatchResults(null);
                    }}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    Close & View Telemetry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: TEST PREVIEW MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clean-card p-6 rounded-xl max-w-md w-full border border-slate-200 bg-white shadow-xl">
            <h2 className="text-base font-bold text-slate-900 mb-1">Send Test Cadence Email</h2>
            <p className="text-xs text-slate-500 mb-4">
              Renders Step 1 with sample prospect variables and dispatches a live test email from{" "}
              <strong>{campaign.mailbox?.email || "your connected mailbox"}</strong> to your inbox.
            </p>

            <form onSubmit={handleSendTestRun} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Destination Email</label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your-email@company.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 shadow-2xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="btn-secondary text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="btn-sky text-xs py-2 px-4 font-semibold flex items-center gap-1.5"
                >
                  {sendingTest ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Test...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Preview</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
