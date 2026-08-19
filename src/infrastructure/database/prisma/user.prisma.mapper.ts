import { User as PrismaUser, Prisma } from '@prisma/client';

import { Role, User } from '@core/entities/user.entity';
import { Email } from '@core/value-objects/email.value-object';
import { Uuid } from '@core/value-objects/uuid.value-object';

export class UserPrismaMapper {
  public static toDomain(raw: PrismaUser): User {
    return new User({
      id: new Uuid(raw.id),
      email: new Email(raw.email),
      name: raw.name,
      phone: raw.phone,
      passwordHash: raw.passwordHash,
      role: raw.role as Role,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public static toCreateData(user: User): Prisma.UserCreateInput {
    return {
      id: user.getId().getValue(),
      email: user.getEmail().getValue(),
      name: user.getName(),
      phone: user.getPhone(),
      passwordHash: user.getPasswordHash(),
      role: user.getRole(),
      isActive: user.isActive(),
    };
  }

  public static toUpdateData(user: User): Prisma.UserUpdateInput {
    return {
      email: user.getEmail().getValue(),
      name: user.getName(),
      phone: user.getPhone(),
      passwordHash: user.getPasswordHash(),
      role: user.getRole(),
      isActive: user.isActive(),
    };
  }
}
