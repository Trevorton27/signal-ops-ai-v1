"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface HealthStat {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}

interface SystemHealthProps {
  stats: HealthStat[];
}

export function SystemHealth({ stats }: SystemHealthProps) {
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">System Health</h2>
        <Button variant="ghost" size="sm" onClick={() => router.refresh()} className="h-7 px-2 text-xs gap-1.5 text-slate-500">
          <RefreshCw className="w-3 h-3" />
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className={stat.highlight ? "border-amber-200 dark:border-amber-800" : ""}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.highlight ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"}`}>
                {stat.value}
              </p>
              {stat.sub && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{stat.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
