import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "multi-agent-support-platform",
  eventKey: process.env.INNGEST_EVENT_KEY || "local",
});

export type InvestigationRunRequestedEvent = {
  name: "investigation/run.requested";
  data: {
    ticketId: string;
    runId: string;
  };
};
