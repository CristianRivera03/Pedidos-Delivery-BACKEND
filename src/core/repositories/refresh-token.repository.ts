import { RefreshToken } from '@core/entities/refresh-token.entity';

export interface RefreshTokenRepository {
  create(refreshToken: RefreshToken): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
