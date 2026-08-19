import { Role } from '@core/entities/user.entity';

export interface CreateUserDto {
  email: string;
  name: string;
  phone: string;
  password: string;
  role?: Role;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
}
