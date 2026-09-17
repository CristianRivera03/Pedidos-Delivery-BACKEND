import { RefreshToken as PrismaRefreshToken, Prisma } from '@prisma/client';

import { RefreshToken } from '@core/entities/refresh-token.entity';
import { Uuid } from '@core/value-objects/uuid.value-object';

export class RefreshTokenPrismaMapper {
  public static toDomain(raw: PrismaRefreshToken): RefreshToken {
    return new RefreshToken({
      id: new Uuid(raw.id),
      userId: raw.userId,
      tokenHash: raw.tokenHash,
      expiresAt: raw.expiresAt,
      revokedAt: raw.revokedAt,
      createdAt: raw.createdAt,
    });
  }

  public static toCreateData(refreshToken: RefreshToken): Prisma.RefreshTokenCreateInput {
    return {
      id: refreshToken.getId().getValue(),
      tokenHash: refreshToken.getTokenHash(),
      expiresAt: refreshToken.getExpiresAt(),
      revokedAt: refreshToken.getRevokedAt(),
      user: { connect: { id: refreshToken.getUserId() } },
    };
  }
}
