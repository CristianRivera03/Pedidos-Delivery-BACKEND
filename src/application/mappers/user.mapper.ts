import { User } from '@core/entities/user.entity';
import { UserResponseDto } from '@application/dto/user-response.dto';
import { toElSalvadorIsoString } from '@application/utils/el-salvador-date.util';

export class UserMapper {
  public static toDto(user: User): UserResponseDto {
    return {
      id: user.getId().getValue(),
      email: user.getEmail().getValue(),
      name: user.getName(),
      phone: user.getPhone(),
      role: user.getRole(),
      isActive: user.isActive(),
      createdAt: toElSalvadorIsoString(user.getCreatedAt()),
      updatedAt: toElSalvadorIsoString(user.getUpdatedAt()),
    };
  }

  public static toDtoList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toDto(user));
  }
}
