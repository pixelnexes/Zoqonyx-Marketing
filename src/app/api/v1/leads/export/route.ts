import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { MOCK_LEADS } from "@/lib/mock-store";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext(req);
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv"; // 'csv' or 'xlsx'

    let leads: any[] = [];

    try {
      leads = await prisma.lead.findMany({
        where: { organizationId: context.organizationId },
        orderBy: { createdAt: "desc" },
      });
    } catch (err) {
      leads = MOCK_LEADS;
    }

    if (!leads || leads.length === 0) {
      leads = MOCK_LEADS;
    }

    // Format export rows
    const exportRows = leads.map((lead: any) => ({
      "First Name": lead.firstName || "",
      "Last Name": lead.lastName || "",
      "Email Address": lead.email || "",
      "Company / Business": lead.company || "",
      "Job Title": lead.jobTitle || "",
      "Phone": lead.phone || "",
      "Website": lead.website || "",
      "Category / Industry": lead.industry || "",
      "City": lead.city || "",
      "Country": lead.country || "",
      "Lead Status": lead.status || "NEW",
      "Tags": Array.isArray(lead.tags) ? lead.tags.join(", ") : "",
      "Created At": lead.createdAt ? new Date(lead.createdAt).toISOString() : "",
      ...(typeof lead.customFields === "object" ? lead.customFields : {}),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    if (format === "xlsx") {
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="zoqonyx_leads_export_${Date.now()}.xlsx"`,
        },
      });
    } else {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="zoqonyx_leads_export_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 });
  }
}
