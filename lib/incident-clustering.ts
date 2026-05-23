import { prisma } from "./db";

export interface ClusterCandidate {
  ticketIds: string[];
  affectedProduct: string;
  affectedRegion: string;
  category: string | null;
  earliestCreatedAt: Date;
  latestCreatedAt: Date;
}

const CLUSTER_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Find groups of tickets that look like they belong to the same incident.
 * Clusters by: same product + category, opened within 4h, same region.
 */
export async function suggestClusters(): Promise<ClusterCandidate[]> {
  // Only consider open/in_progress tickets without an existing incident link
  const tickets = await prisma.ticket.findMany({
    where: {
      status: { in: ["open", "in_progress"] },
      incidents: { none: {} },
      product: { not: null },
    },
    include: { customer: true },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map<string, typeof tickets>();

  for (const ticket of tickets) {
    const groupKey = `${ticket.product ?? ""}::${ticket.category ?? ""}::${ticket.customer.region}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push(ticket);
  }

  const candidates: ClusterCandidate[] = [];

  for (const [, group] of groups) {
    if (group.length < 2) continue;

    // Sliding window: find sub-groups within 4h
    for (let i = 0; i < group.length; i++) {
      const windowStart = group[i].createdAt.getTime();
      const windowTickets = group.filter(
        (t) => Math.abs(t.createdAt.getTime() - windowStart) <= CLUSTER_WINDOW_MS
      );
      if (windowTickets.length < 2) continue;

      const ids = windowTickets.map((t) => t.id).sort();
      const alreadyAdded = candidates.some(
        (c) => c.ticketIds.sort().join(",") === ids.join(",")
      );
      if (alreadyAdded) continue;

      candidates.push({
        ticketIds: ids,
        affectedProduct: group[i].product ?? "Unknown",
        affectedRegion: group[i].customer.region,
        category: group[i].category,
        earliestCreatedAt: new Date(Math.min(...windowTickets.map((t) => t.createdAt.getTime()))),
        latestCreatedAt: new Date(Math.max(...windowTickets.map((t) => t.createdAt.getTime()))),
      });
    }
  }

  return candidates;
}
