import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '../../common/tenantsea-dtos';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrustProfile(tenantId: string, tenantUserId: string): Promise<any> {
    const payments = await this.prisma.payment.findMany({ where: { tenantId, payerId: tenantUserId } });
    const tenancies = await this.prisma.tenancy.findMany({ where: { tenantId, tenantUserId } });

    const onTime = payments.filter((payment) => payment.status === 'PAID').length;
    const late = payments.filter((payment) => payment.status === 'LATE').length;
    const partial = payments.filter((payment) => payment.status === 'PARTIAL').length;
    const missed = payments.filter((payment) => payment.status === 'MISSED').length;

    const score = Math.max(0, Math.min(100, 60 + onTime * 8 - late * 12 - partial * 5 - missed * 15));

    return {
      tenantId,
      tenantUserId,
      trustScore: score,
      summary: {
        totalPayments: payments.length,
        onTime,
        late,
        partial,
        missed,
      },
      rentalHistory: tenancies.map((tenancy) => ({
        tenancyId: tenancy.id,
        status: tenancy.status.toLowerCase(),
        rentAmount: tenancy.rentAmount,
        period: `${tenancy.startDate.toISOString()} to ${tenancy.endDate?.toISOString() ?? 'ongoing'}`,
      })),
    };
  }

  async getLandlordDashboard(tenantId: string): Promise<any> {
    const [payments, tenancies, properties] = await Promise.all([
      this.prisma.payment.findMany({ where: { tenantId } }),
      this.prisma.tenancy.findMany({ where: { tenantId } }),
      this.prisma.property.findMany({ where: { tenantId }, select: { id: true, rentAmount: true, currency: true } }),
    ]);

    const onTime = payments.filter((payment) => payment.status === 'PAID').length;
    const late = payments.filter((payment) => payment.status === 'LATE').length;
    const missed = payments.filter((payment) => payment.status === 'MISSED').length;
    const collectedAmount = payments.filter((payment) => payment.status === 'PAID').reduce((total, payment) => total + (payment.verifiedAmount ?? payment.amount), 0);
    const expectedAmount = tenancies.filter((tenancy) => tenancy.status === 'ACTIVE').reduce((total, tenancy) => total + tenancy.rentAmount, 0);

    return {
      tenantId,
      activeTenancies: tenancies.filter((tenancy) => tenancy.status === 'ACTIVE').length,
      totalProperties: properties.length,
      occupiedProperties: new Set(tenancies.filter((tenancy) => tenancy.status === 'ACTIVE').map((tenancy) => tenancy.propertyId)).size,
      vacantProperties: Math.max(properties.length - new Set(tenancies.filter((tenancy) => tenancy.status === 'ACTIVE').map((tenancy) => tenancy.propertyId)).size, 0),
      paymentSummary: {
        totalPayments: payments.length,
        onTime,
        late,
        missed,
        collectedAmount,
        expectedAmount,
        collectionRate: expectedAmount ? Math.round((collectedAmount / expectedAmount) * 100) : 0,
      },
      notifications: [
        late > 0 ? `${late} payment${late > 1 ? 's' : ''} need attention` : 'All payments are on track',
        missed > 0 ? `${missed} missed payment${missed > 1 ? 's' : ''} flagged` : 'No missed payments recorded',
      ],
    };
  }
}
