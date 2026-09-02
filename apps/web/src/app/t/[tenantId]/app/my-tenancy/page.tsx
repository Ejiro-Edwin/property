"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge, tenancyStatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/format";

type Tenancy = {
  id: string;
  propertyId: string;
  rentAmount: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  status: string;
};

type Property = {
  id: string;
  title: string;
  address: string;
  bedrooms: number | null;
  rentAmount: number;
  currency: string;
};

export default function MyTenancyPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const [tenancies, setTenancies] = React.useState<Tenancy[] | null>(null);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [loadError, setLoadError] = React.useState(false);

  function loadTenancy() {
    setTenancies(null);
    setLoadError(false);
    api<{ tenancies: Tenancy[] }>("tenancies", { tenantId, query: { limit: 20 } })
      .then((r) => setTenancies(r.tenancies ?? []))
      .catch(() => {
        setLoadError(true);
        setTenancies([]);
      });
  }

  React.useEffect(() => {
    loadTenancy();
    api<{ properties: Property[] }>("properties", { tenantId, query: { limit: 20 } })
      .then((r) => setProperties(r.properties ?? []))
      .catch(() => setProperties([]));
  }, [tenantId]);

  const propertyMap = React.useMemo(
    () => new Map(properties.map((p) => [p.id, p])),
    [properties],
  );

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 pb-8">
      <PageHeader
        title="My tenancy"
        description="Your rental agreement and property details."
        action={
          <Link href={`/t/${tenantId}/app/payments`}>
            <Button variant="secondary">View payments</Button>
          </Link>
        }
      />

      {tenancies === null ? (
        <Skeleton className="h-[240px]" />
      ) : loadError ? (
        <EmptyState
          title="We couldn&apos;t load your tenancy"
          body="Something went wrong while fetching your tenancy details."
          action={<Button onClick={loadTenancy}>Try again</Button>}
        />
      ) : tenancies.length === 0 ? (
        <EmptyState
          title="Tenancy record not found"
          body="We couldn&apos;t find a tenancy connected to this workspace."
          action={<Button onClick={loadTenancy}>Refresh</Button>}
        />
      ) : (
        <div className="grid gap-4">
          {tenancies.map((t) => {
            const property = propertyMap.get(t.propertyId);
            const terminated = t.status.toLowerCase() === "terminated";
            return (
              <div key={t.id} className="card overflow-hidden">
                {property ? <div className="property-art h-32" /> : null}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold tracking-tight">
                        {terminated ? "Terminated tenancy" : property?.title ?? "Your property"}
                      </div>
                      {property ? (
                        <div className="mt-1 text-sm text-muted">{property.address}</div>
                      ) : null}
                    </div>
                    <Badge tone={tenancyStatusTone(t.status)}>{t.status.toLowerCase()}</Badge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-muted">Rent · </span>
                      <span className="font-medium">
                        {formatMoney(t.rentAmount, t.currency)} / yr
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Period · </span>
                      <span className="font-medium">
                        {formatDate(t.startDate)} — {t.endDate ? formatDate(t.endDate) : "ongoing"}
                      </span>
                    </div>
                    {property?.bedrooms != null ? (
                      <div>
                        <span className="text-muted">Bedrooms · </span>
                        <span className="font-medium">{property.bedrooms}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
