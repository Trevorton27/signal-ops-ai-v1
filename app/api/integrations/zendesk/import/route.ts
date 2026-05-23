import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Zendesk webhook receiver — must be public (no auth header)
const zdWebhookSchema = z.object({
  ticket: z.object({
    id: z.number(),
    subject: z.string(),
    description: z.string(),
    priority: z.string().optional(),
    requester: z.object({ email: z.string().optional() }).optional(),
  }),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = zdWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ticket: zd } = parsed.data;

  // Find customer by email or use first demo customer
  let customer = zd.requester?.email
    ? await prisma.customer.findUnique({ where: { email: zd.requester.email } })
    : null;

  if (!customer) {
    customer = await prisma.customer.findFirst();
  }
  if (!customer) return NextResponse.json({ error: "No customer found" }, { status: 422 });

  const ticket = await prisma.ticket.create({
    data: {
      title: zd.subject,
      description: zd.description,
      severity: zd.priority === "urgent" ? "critical" : zd.priority === "high" ? "high" : "medium",
      status: "open",
      customerId: customer.id,
      externalId: `ZD-${zd.id}`,
    },
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id }, { status: 201 });
}
