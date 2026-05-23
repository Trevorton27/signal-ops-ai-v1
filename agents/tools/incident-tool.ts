import incidentsData from "@/data/incidents.json";
import type { CorrelatedIncident } from "../state";

export function fetchIncidents(filter: {
  affectedProduct?: string;
  region?: string;
  ticketCreatedAt?: string;
}): CorrelatedIncident[] {
  let incidents = incidentsData as CorrelatedIncident[];

  if (filter.affectedProduct) {
    incidents = incidents.filter((i) =>
      i.affectedProducts.some((p) =>
        p.toLowerCase().includes(filter.affectedProduct!.toLowerCase())
      )
    );
  }

  if (filter.region) {
    incidents = incidents.filter(
      (i) =>
        i.affectedRegions.includes(filter.region!) ||
        i.affectedRegions.includes("all")
    );
  }

  if (filter.ticketCreatedAt) {
    const ticketTime = new Date(filter.ticketCreatedAt).getTime();
    const window = 48 * 60 * 60 * 1000; // 48 hours
    incidents = incidents.filter((i) => {
      const incidentStart = new Date(i.startTime).getTime();
      return Math.abs(ticketTime - incidentStart) <= window;
    });
  }

  return incidents;
}
