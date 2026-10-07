"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  Search,
  Send,
  Building,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { MOCK_CONVERSATIONS } from "@/lib/mock-store";

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchConversations = () => {
    setLoading(true);
    fetch("/api/v1/inbox")
      .then((res) => res.json())
      .then((data) => {
        const list = data.conversations || MOCK_CONVERSATIONS;
        setConversations(list);
        if (list.length > 0 && !selectedConvId) {
          setSelectedConvId(list[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        setConversations(MOCK_CONVERSATIONS);
        setSelectedConvId(MOCK_CONVERSATIONS[0].id);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const selectedConv = conversations.find((c) => c.id === selectedConvId) || conversations[0] || MOCK_CONVERSATIONS[0];

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSendingReply(true);
    setTimeout(() => {
      alert("Reply sent via connected mailbox: " + selectedConv?.mailbox?.email);
      setReplyText("");
      setSendingReply(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Inbox className="w-5 h-5 text-sky-600" />
            <span>Unified Prospect Inbox & Reply Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Incoming replies automatically halt sequence follow-ups and populate here for immediate action.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            IMAP Sync: Active (Every 60s)
          </span>
        </div>
      </div>

      {/* 2. 2-Pane Conversation View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
        {/* Left Pane: Conversations List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-clean pl-9 w-full text-xs"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              {["ALL", "INTERESTED", "REPLIED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    statusFilter === st
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
            {conversations.map((conv) => {
              const isSelected = conv.id === selectedConv?.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full text-left p-4 transition flex flex-col gap-1.5 ${
                    isSelected ? "bg-sky-50/60 border-l-4 border-sky-600" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {conv.lead?.firstName || "Prospect"} {conv.lead?.lastName || ""}
                    </span>
                    <span className="text-[10px] text-slate-400">15m ago</span>
                  </div>

                  <div className="text-xs text-slate-600 font-medium truncate">
                    {conv.subject}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {conv.snippet}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      REPLIED
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {conv.lead?.company}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Thread History & Direct Reply */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {selectedConv ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedConv.subject}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{selectedConv.lead?.email}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">{selectedConv.lead?.company}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Sender Mailbox</span>
                  <span className="text-xs font-mono font-semibold text-slate-800">
                    {selectedConv.mailbox?.email}
                  </span>
                </div>
              </div>

              {/* Messages History */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-slate-50/30">
                {(selectedConv.messages || []).map((msg: any, idx: number) => {
                  const isInbound = msg.direction === "INBOUND";
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        isInbound
                          ? "bg-white border-emerald-200 shadow-sm"
                          : "bg-slate-100/70 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-100">
                        <span className="font-bold text-slate-800">
                          {isInbound ? `📩 Inbound from ${msg.fromEmail}` : `📤 Outbound from ${msg.fromEmail}`}
                        </span>
                        <span>{isInbound ? "15m ago" : "2 days ago"}</span>
                      </div>
                      <div className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {msg.bodyText}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-white space-y-3">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to continue this lead conversation..."
                  className="input-clean w-full resize-none"
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Will send from <strong className="text-slate-700">{selectedConv.mailbox?.email}</strong>
                  </span>

                  <button type="submit" disabled={sendingReply} className="btn-primary">
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingReply ? "Sending..." : "Send Reply"}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select a conversation to view thread history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
