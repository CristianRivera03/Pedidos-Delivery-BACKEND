import { Role } from '@core/entities/user.entity';

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
