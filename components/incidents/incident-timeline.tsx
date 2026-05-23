import { formatRelativeTime } from "@/lib/utils";

interface TimelineEvent {
  timestamp: string;
  event: string;
  author: string;
}

interface IncidentTimelineProps {
  events: TimelineEvent[];
}

export function IncidentTimeline({ events }: IncidentTimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No timeline events yet.</p>;
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

      <div className="space-y-4">
        {[...events].reverse().map((event, i) => (
          <div key={i} className="flex gap-4 relative">
            <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 shrink-0 flex items-center justify-center z-10">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="flex-1 pb-1">
              <p className="text-sm text-slate-900 dark:text-slate-100 leading-snug">{event.event}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                <span>{formatRelativeTime(event.timestamp)}</span>
                <span>·</span>
                <span>{event.author === "system" ? "Automated" : event.author}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
