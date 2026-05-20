import { prisma } from "@/lib/db";
import deploymentsData from "@/data/deployments.json";
import type { Deployment } from "../state";

export async function fetchCustomer(customerId: string) {
  return prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
  });
}

export function fetchDeployments(filter: { region?: string; service?: string }): Deployment[] {
  let deployments = deploymentsData as Deployment[];

  if (filter.region) {
    deployments = deployments.filter(
      (d) => d.region === filter.region || d.region === "all" || d.region === "global"
    );
  }
  if (filter.service) {
    deployments = deployments.filter((d) =>
      d.service.toLowerCase().includes(filter.service!.toLowerCase())
    );
  }

  // Return sorted by most recent first
  return deployments.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
