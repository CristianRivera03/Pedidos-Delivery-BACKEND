import { inject, injectable } from 'tsyringe';

import { RefreshToken } from '@core/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@core/repositories/refresh-token.repository';

import { PrismaClient } from '@infrastructure/database/prisma/prisma.client';
import { RefreshTokenPrismaMapper } from '@infrastructure/database/prisma/refresh-token.prisma.mapper';

import { SERVICE_SYMBOLS } from '@infrastructure/config/di/symbols';

@injectable()
export class RefreshTokenPrismaRepository implements RefreshTokenRepository {
  constructor(
    @inject(SERVICE_SYMBOLS.PrismaClient) private readonly prisma: PrismaClient,
  ) {}

  public async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    const data = RefreshTokenPrismaMapper.toCreateData(refreshToken);
    const created = await this.prisma.refreshToken.create({ data });
    return RefreshTokenPrismaMapper.toDomain(created);
  }

  public async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const raw = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    return raw ? RefreshTokenPrismaMapper.toDomain(raw) : null;
  }

  public async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  public async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
