import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('test.jwt.token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);

    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as any);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('register() should create a user and return formatted profile', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const created = {
      id: 'u1',
      email: 'user@example.com',
      firstName: 'Chinedu',
      lastName: 'Okonkwo',
      phoneNumber: '+2348012345678',
      role: 'user',
      createdAt: new Date('2025-08-08T00:00:00.000Z'),
      updatedAt: new Date('2025-08-08T00:00:00.000Z'),
    };
    (prisma.user.create as jest.Mock).mockResolvedValue(created);

    const res = await service.register({
      email: 'user@example.com',
      password: 'StrongP@ss1',
      firstName: 'Chinedu',
      lastName: 'Okonkwo',
      phoneNumber: '+2348012345678',
    });

    expect(res.success).toBe(true);
    expect(res.message).toMatch(/User registered/i);
    expect(res.data).toMatchObject({
      id: 'u1',
      email: 'user@example.com',
      firstName: 'Chinedu',
      lastName: 'Okonkwo',
      phoneNumber: '+2348012345678',
      role: 'user',
    });
  });

  it('login() should return token and user when credentials are valid', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      passwordHash: 'hashed',
      firstName: 'Amaka',
      lastName: 'Eze',
      phoneNumber: '+2348098765432',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await service.login({ email: 'user@example.com', password: 'StrongP@ss1' });
    expect(jwt.signAsync).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('accessToken');
  });

  it('updateUserRole() should allow admin to update role', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'admin1', role: 'admin' });
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: 'u2',
      email: 'user2@example.com',
      firstName: 'Ifeoma',
      lastName: 'Nwankwo',
      phoneNumber: '+2347011122233',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await service.updateUserRole('admin1', 'u2', { role: 'admin' });
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/User role updated/i);
  });

  it('findAllUsers() should paginate users', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'u1',
        email: 'a@example.com',
        firstName: 'Ngozi',
        lastName: 'Okoro',
        phoneNumber: '+2347012345678',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    (prisma.user.count as jest.Mock).mockResolvedValue(1);

    const res = await service.findAllUsers(1, 10);
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.totalItems).toBe(1);
  });
});


