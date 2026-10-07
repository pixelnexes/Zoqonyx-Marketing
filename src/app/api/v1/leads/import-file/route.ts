import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { parseSpreadsheetBuffer } from "@/lib/spreadsheet-parser";

export async function POST(req: Request) {
  try {
    const context = await getTenantContext(req);
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = parseSpreadsheetBuffer(buffer);

    return NextResponse.json({
      success: true,
      filename: file.name,
      ...parsed,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
