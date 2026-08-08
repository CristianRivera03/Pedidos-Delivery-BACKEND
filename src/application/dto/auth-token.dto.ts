import { Role } from '@core/entities/user.entity';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokenPayload extends Record<string, unknown> {
  sub: string;
  email: string;
  role: Role;
}
