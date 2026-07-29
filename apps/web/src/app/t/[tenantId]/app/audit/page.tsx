"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";

type AuditLog = {
  id: string;
  action: string;
  method: string;
  path: string;
  userId: string | null;
  statusCode: number | null;
  createdAt: string;
};

function methodTone(method: string) {
  switch (method) {
    case "POST":
      return "brand" as const;
    case "DELETE":
      return "danger" as const;
    case "PUT":
    case "PATCH":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export default function AuditPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [logs, setLogs] = React.useState<AuditLog[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    api<{ logs: AuditLog[] }>("audit", { tenantId })
      .then((r) => {
        if (!cancelled) setLogs(r.logs ?? []);
      })
      .catch(() => {
        if (!cancelled) setLogs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      <PageHeader
        title="Audit log"
        description="The last 100 actions recorded in this workspace."
      />

      {logs === null ? (
        <Skeleton className="h-[320px]" />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit entries"
          body="Actions performed in this workspace will be recorded here for accountability."
        />
      ) : (
        <div className="card-flat divide-y divide-border">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 px-5 py-3.5">
              <Badge tone={methodTone(log.method)} className="w-16 justify-center">
                {log.method}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-xs">{log.path}</div>
                <div className="mt-0.5 text-xs text-muted">
                  {log.action}
                  {log.userId ? ` · by ${log.userId}` : ""}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {log.statusCode ? (
                  <div
                    className={
                      log.statusCode < 400
                        ? "text-xs font-medium text-success"
                        : "text-xs font-medium text-danger"
                    }
                  >
                    {log.statusCode}
                  </div>
                ) : null}
                <div className="text-xs text-muted">{formatDateTime(log.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
