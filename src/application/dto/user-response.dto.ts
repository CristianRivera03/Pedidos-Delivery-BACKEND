import { Role } from '@core/entities/user.entity';

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
