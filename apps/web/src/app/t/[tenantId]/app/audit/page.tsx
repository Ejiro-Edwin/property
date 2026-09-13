"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { RequirePrivileged } from "@/components/app/require-privileged";

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
  return (
    <RequirePrivileged>
      <AuditPageContent />
    </RequirePrivileged>
  );
}

function AuditPageContent() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [logs, setLogs] = React.useState<AuditLog[] | null>(null);
  const [denied, setDenied] = React.useState(false);
  const totalLogs = logs?.length ?? 0;
  const successfulLogs = logs?.filter((log) => (log.statusCode ?? 200) < 400).length ?? 0;
  const failedLogs = logs?.filter((log) => (log.statusCode ?? 200) >= 400).length ?? 0;

  React.useEffect(() => {
    let cancelled = false;
    setDenied(false);
    setLogs(null);
    api<{ logs: AuditLog[] }>("audit", { tenantId })
      .then((r) => {
        if (!cancelled) setLogs(r.logs ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setDenied(true);
          setLogs([]);
        } else {
          setLogs([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  if (denied) {
    return (
      <div className="mx-auto grid w-full max-w-5xl gap-6 pb-8">
        <PageHeader
          title="Audit log"
          description="Workspace activity history for administrators."
        />
        <EmptyState
          title="Admin access required"
          body="Audit logs are only visible to workspace administrators. Contact your admin if you need access."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 pb-8">
      <PageHeader
        title="Audit log"
        description="The last 100 actions recorded in this workspace."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Entries</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {logs === null ? "…" : totalLogs}
          </div>
          <div className="mt-1 text-xs text-muted">Recent activity recorded</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Successful
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {logs === null ? "…" : successfulLogs}
          </div>
          <div className="mt-1 text-xs text-muted">Below 400 status code</div>
        </div>
        <div className="metric-card p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Failed</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {logs === null ? "…" : failedLogs}
          </div>
          <div className="mt-1 text-xs text-muted">Needs review or attention</div>
        </div>
      </div>

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
            <div key={log.id} className="flex items-center gap-4 px-5 py-4">
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
