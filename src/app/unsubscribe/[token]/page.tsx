import React from "react";
import { prisma } from "@/lib/prisma";
import { LeadService } from "@/services/lead.service";
import { SuppressionReason } from "@prisma/client";
import { CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({ params }: { params: { token: string } }) {
  const { token } = params;

  let lead = null;
  let success = false;

  if (token === "preview" || token === "test-preview-token") {
    lead = { email: "sample-preview@example.com" };
    success = true;
  } else {
    lead = await prisma.lead.findUnique({
      where: { unsubscribeToken: token },
    });

    if (lead) {
      await LeadService.suppressEmail(lead.organizationId, lead.email, SuppressionReason.UNSUBSCRIBED);
      success = true;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 selection:bg-brand-500 selection:text-white">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-slate-800 text-center shadow-2xl">
        {success ? (
          <>
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">You Have Been Unsubscribed</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              We have permanently removed <strong className="text-slate-200">{lead?.email}</strong> from all future email campaigns from this sender.
            </p>
            <div className="mt-6 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-500 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Added to Organization Global Suppression List</span>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Invalid or Expired Link</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              This unsubscribe link is invalid or has already been processed.
            </p>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-xs text-slate-500">
          Powered by{" "}
          <Link href="/" className="text-slate-400 font-medium hover:text-brand-400 transition">
            Zoqonyx Email Marketing
          </Link>{" "}
          • Nawix Tech Solution
        </div>
      </div>
    </div>
  );
}
