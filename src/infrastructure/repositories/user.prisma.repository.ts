import { inject, injectable } from 'tsyringe';

import { User } from '@core/entities/user.entity';
import { UserRepository } from '@core/repositories/user.repository';

import { PrismaClient } from '@infrastructure/database/prisma/prisma.client';
import { UserPrismaMapper } from '@infrastructure/database/prisma/user.prisma.mapper';

import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(
    @inject(SERVICE_SYMBOLS.PrismaClient) private readonly prisma: PrismaClient,
  ) {}

  public async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id } });
    return raw ? UserPrismaMapper.toDomain(raw) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return raw ? UserPrismaMapper.toDomain(raw) : null;
  }

  public async findAll(): Promise<User[]> {
    const raws = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return raws.map((raw) => UserPrismaMapper.toDomain(raw));
  }

  public async create(user: User): Promise<User> {
    const data = UserPrismaMapper.toCreateData(user);
    const created = await this.prisma.user.create({ data });
    return UserPrismaMapper.toDomain(created);
  }

  public async update(user: User): Promise<User> {
    const data = UserPrismaMapper.toUpdateData(user);
    const updated = await this.prisma.user.update({
      where: { id: user.getId().getValue() },
      data,
    });
    return UserPrismaMapper.toDomain(updated);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
