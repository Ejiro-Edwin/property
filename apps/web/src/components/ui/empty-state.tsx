import * as React from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-flat flex flex-col items-center justify-center gap-3 px-8 py-14 text-center">
      <div className="property-art h-16 w-16 rounded-[16px]" />
      <div className="text-sm font-semibold tracking-tight">{title}</div>
      <div className="max-w-sm text-sm leading-6 text-muted">{body}</div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
