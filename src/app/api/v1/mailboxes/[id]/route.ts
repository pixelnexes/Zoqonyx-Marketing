import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { dbStore } from "@/lib/db-store";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);
    try {
      const mailbox = await prisma.mailbox.findFirst({
        where: { id: params.id, organizationId: context.organizationId },
      });
      if (mailbox) return NextResponse.json({ success: true, mailbox });
    } catch (dbErr: any) {}

    const mbx = dbStore.getMailboxes().find((m) => m.id === params.id);
    if (!mbx) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
    return NextResponse.json({ success: true, mailbox: mbx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);
    try {
      await prisma.mailbox.delete({
        where: { id: params.id, organizationId: context.organizationId },
      });
    } catch (dbErr: any) {}

    dbStore.deleteMailbox(params.id);
    return NextResponse.json({ success: true, message: "Mailbox deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
