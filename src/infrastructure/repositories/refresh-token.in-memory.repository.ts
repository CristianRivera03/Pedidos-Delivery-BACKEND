import { injectable } from 'tsyringe';

import { RefreshToken } from '@core/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@core/repositories/refresh-token.repository';

@injectable()
export class RefreshTokenInMemoryRepository implements RefreshTokenRepository {
  private tokens: Map<string, RefreshToken> = new Map();

  public async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    this.tokens.set(refreshToken.getId().getValue(), refreshToken);
    return refreshToken;
  }

  public async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    for (const token of this.tokens.values()) {
      if (token.getTokenHash() === tokenHash) {
        return token;
      }
    }
    return null;
  }

  public async revoke(id: string): Promise<void> {
    const token = this.tokens.get(id);
    if (token) {
      token.revoke();
    }
  }

  public async revokeAllForUser(userId: string): Promise<void> {
    for (const token of this.tokens.values()) {
      if (token.getUserId() === userId && !token.isRevoked()) {
        token.revoke();
      }
    }
  }

  public clear(): void {
    this.tokens.clear();
  }
}
