import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './common/prisma.service';

describe('AppController', () => {
  it('returns ok health when db reachable', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: { $queryRaw: jest.fn().mockResolvedValue(1) },
        },
      ],
    }).compile();

    const controller = moduleRef.get(AppController);
    await expect(controller.getHealth()).resolves.toEqual({ status: 'ok', db: 'up' });
  });
});

