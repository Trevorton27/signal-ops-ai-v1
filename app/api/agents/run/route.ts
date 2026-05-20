import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { z } from "zod";

const schema = z.object({
  ticketId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ticketId } = parsed.data;

  // Verify ticket exists
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  // Create investigation run record
  const run = await prisma.investigationRun.create({
    data: {
      ticketId,
      status: "pending",
    },
  });

  // Fire Inngest event
  await inngest.send({
    name: "investigation/run.requested",
    data: { ticketId, runId: run.id },
  });

  return NextResponse.json({ runId: run.id }, { status: 201 });
}
