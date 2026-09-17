export interface RefreshTokenService {
  generate(): string;
  hash(value: string): string;
  getExpiresAt(): Date;
}
