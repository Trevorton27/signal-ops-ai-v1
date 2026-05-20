import { prisma } from "@/lib/db";

export async function fetchTicketWithCustomer(ticketId: string) {
  const ticket = await prisma.ticket.findUniqueOrThrow({
    where: { id: ticketId },
    include: { customer: true },
  });
  return ticket;
}
