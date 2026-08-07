export interface TokenService {
  sign(payload: Record<string, unknown>): string;
  verify<T = Record<string, unknown>>(token: string): T;
}
