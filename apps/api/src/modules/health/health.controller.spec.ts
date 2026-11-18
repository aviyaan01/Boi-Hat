import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../common/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            isConnected: true,
            $queryRawUnsafe: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return health status ok with db ok when prisma query succeeds', async () => {
    let capturedData: any = null;
    const mockRes: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        capturedData = data;
        return data;
      }),
    };

    await controller.getHealth(mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(capturedData).toBeDefined();
    expect(capturedData.status).toBe('ok');
    expect(capturedData.service).toBe('boi-hat-api');
    expect(capturedData.db).toBe('ok');
    expect(capturedData.timestamp).toBeDefined();
  });

  it('should return db down when prisma ping throws an error', async () => {
    jest.spyOn(prisma, '$queryRawUnsafe').mockRejectedValueOnce(new Error('Connection failed'));

    let capturedData: any = null;
    const mockRes: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        capturedData = data;
        return data;
      }),
    };

    await controller.getHealth(mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(capturedData.status).toBe('ok');
    expect(capturedData.db).toBe('down');
  });
});
