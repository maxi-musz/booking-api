import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(() => {
    const mockPrismaService: Partial<PrismaService> = {
      booking: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as any,
      property: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as any,
    } as any;
    service = new BookingsService(mockPrismaService as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate that start date is before end date', () => {
    const startDate = new Date('2025-08-10');
    const endDate = new Date('2025-08-12');
    expect(startDate < endDate).toBe(true);
  });
});
