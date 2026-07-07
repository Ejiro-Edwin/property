import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditService {
  listAuditLogs() {
    return { message: 'Audit log endpoint ready' };
  }
}
