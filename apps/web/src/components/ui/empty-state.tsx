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
    <div className="card flex flex-col items-center justify-center gap-3 rounded-[22px] px-8 py-14 text-center">
      <div className="property-art h-16 w-16 rounded-[16px]" />
      <div className="text-lg font-semibold tracking-tight text-[#0f172a]">{title}</div>
      <div className="max-w-sm text-sm leading-6 text-slate-600">{body}</div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
