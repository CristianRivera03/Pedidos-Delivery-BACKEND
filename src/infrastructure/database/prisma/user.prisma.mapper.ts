import { User as PrismaUser, Prisma } from '@prisma/client';

import { User } from '@core/entities/user.entity';
import { Email } from '@core/value-objects/email.value-object';
import { Uuid } from '@core/value-objects/uuid.value-object';

export class UserPrismaMapper {
  public static toDomain(raw: PrismaUser): User {
    return new User({
      id: new Uuid(raw.id),
      email: new Email(raw.email),
      name: raw.name,
      passwordHash: raw.passwordHash,
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
      passwordHash: user.getPasswordHash(),
      isActive: user.isActive(),
    };
  }

  public static toUpdateData(user: User): Prisma.UserUpdateInput {
    return {
      email: user.getEmail().getValue(),
      name: user.getName(),
      passwordHash: user.getPasswordHash(),
      isActive: user.isActive(),
    };
  }
}
