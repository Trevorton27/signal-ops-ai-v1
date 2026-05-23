import { MockZendeskAdapter } from "./mock";
import type { ZendeskTicket } from "../types";

export type ZendeskAdapter = {
  name: string;
  type: string;
  isLive: boolean;
  getTickets(): ZendeskTicket[];
  createTicketFromTemplate(title: string, description: string, requesterEmail?: string): ZendeskTicket;
};

export function getZendeskAdapter(): ZendeskAdapter {
  // Real Zendesk client would be instantiated if ZENDESK_API_TOKEN + ZENDESK_SUBDOMAIN are present
  return new MockZendeskAdapter();
}
