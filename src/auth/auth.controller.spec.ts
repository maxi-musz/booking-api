import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue({ success: true }),
            login: jest.fn().mockResolvedValue({ success: true, data: { accessToken: 't' } }),
            updateUserRole: jest.fn().mockResolvedValue({ success: true }),
            findAllUsers: jest.fn().mockResolvedValue({ success: true, data: [] }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register should delegate to service', async () => {
    const res = await controller.register({
      email: 'user@example.com',
      password: 'StrongP@ss1',
      firstName: 'Adeola',
      lastName: 'Ogunleye',
      phoneNumber: '+2348140011223',
    } as any);
    expect(res).toEqual({ success: true });
  });

  it('login should delegate to service', async () => {
    const res = await controller.login({ email: 'user@example.com', password: 'StrongP@ss1' } as any);
    expect(res).toEqual({ success: true, data: { accessToken: 't' } });
  });

  it('updateUserRole should delegate to service', async () => {
    const res = await controller.updateUserRole('u1', { role: 'admin' } as any, { user: { userId: 'admin1' } } as any);
    expect(res).toEqual({ success: true });
  });

  it('findAllUsers should delegate to service', async () => {
    const res = await controller.findAllUsers(1 as any, 10 as any, undefined);
    expect(res).toEqual({ success: true, data: [] });
  });
});


