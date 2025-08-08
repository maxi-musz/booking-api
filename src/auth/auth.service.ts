import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ResponseHelper } from '../shared';
import { formatDate } from '../shared';
import { RegisterDto, LoginDto, UpdateUserRoleDto } from './dto';
import { ChangePasswordDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    this.logger.log(`Validating user with email: ${email}`);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async register(dto: RegisterDto) {
    const { email, password, firstName, lastName, phoneNumber } = dto;
    this.logger.log(`Registering new user: ${email}`);
    try {
      const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingByEmail) {
        this.logger.warn(`Registration failed, email already in use: ${email}`);
        throw new ConflictException('Email already in use');
      }

      const existingByPhone = await this.prisma.user.findUnique({ where: { phoneNumber } });
      if (existingByPhone) {
        this.logger.warn(`Registration failed, phone already in use: ${phoneNumber}`);
        throw new ConflictException('Phone number already in use');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await this.prisma.user.create({
        data: { email, passwordHash, firstName, lastName, phoneNumber },
      });

      const formattedUser = this.formatUser(user);
      this.logger.log(`User registered successfully: ${email}`);
      return ResponseHelper.success('User registered', formattedUser);
    } catch (error) {
      this.logger.error(`Failed to register user: ${email}`, (error as Error).stack);
      throw error;
    }
  }

  async login(dto: LoginDto) {

    this.logger.log(`Attempting login for: ${dto.email}`);
    try {
        const { email, password } = dto;
        const user = await this.validateUser(email, password);

        if (!user) {
        this.logger.warn(`Invalid credentials for: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
        }

        const token = await this.issueTokens(user.id, user.email, user.role as unknown as string);
        const formattedUser = this.formatUser(user);
        return ResponseHelper.success('Authenticated', { ...token, user: formattedUser });
  } catch (error) {
    this.logger.error(`Failed to login: ${dto.email}`, (error as Error).stack);
    throw error;
  }
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async getProfile(userId: string) {
    this.logger.log(`Fetching profile for userId: ${userId}`);
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        throw new NotFoundException('User not found');
      }
      const formatted = this.formatUser(user);
      return ResponseHelper.success('Profile retrieved', formatted);
    } catch (error) {
      this.logger.error(`Failed to fetch profile for userId: ${userId}`, (error as Error).stack);
      throw error;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { currentPassword, newPassword } = dto;
    this.logger.log(`Changing password for userId: ${userId}`);
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) throw new BadRequestException('Current password is incorrect');
      const newHash = await bcrypt.hash(newPassword, 12);
      await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
      return ResponseHelper.success('Password updated', { id: user.id });
    } catch (error) {
      this.logger.error(`Failed to change password for userId: ${userId}`, (error as Error).stack);
      throw error;
    }
  }

  private formatUser(user: { id: string; email: string; firstName: string; lastName: string; phoneNumber: string; role: string; createdAt: Date; updatedAt: Date; }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: formatDate(user.createdAt),
      updatedAt: formatDate(user.updatedAt),
    };
  }

  async updateUserRole(requestingUserId: string, targetUserId: string, dto: UpdateUserRoleDto) {
    this.logger.log(`Updating user role. Requestor=${requestingUserId}, Target=${targetUserId}, Role=${dto.role}`);
    try {
      // Ensure the requesting user is admin
      const requester = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
      if (!requester || requester.role !== 'admin') {
        throw new BadRequestException('Only admins can update roles');
      }
      const updated = await this.prisma.user.update({ where: { id: targetUserId }, data: { role: dto.role } });
      const formatted = this.formatUser(updated);
      return ResponseHelper.success('User role updated', formatted);
    } catch (error) {
      this.logger.error(`Failed to update user role for ${targetUserId}`, (error as Error).stack);
      throw error;
    }
  }

  async findAllUsers(page = 1, limit = 10, role?: 'admin' | 'user') {
    this.logger.log(`Fetching users with page=${page}, limit=${limit}, role=${role ?? 'any'}`);
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.');
    }

    const where: any = {};
    if (role) where.role = role;

    try {
      const [users, totalItems] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);
      const hasMore = page < totalPages;
      const data = users.map((u) => this.formatUser(u as any));

      return {
        success: true,
        message: 'Users retrieved successfully',
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasMore,
        length: data.length,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to fetch users', (error as Error).stack);
      throw error;
    }
  }
}


