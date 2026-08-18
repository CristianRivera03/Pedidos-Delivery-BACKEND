import { injectable } from 'tsyringe';

import { User } from '@core/entities/user.entity';
import { UserRepository } from '@core/repositories/user.repository';

@injectable()
export class UserInMemoryRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  public async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ?? null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const lower = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.getEmail().getValue().toLowerCase() === lower) {
        return user;
      }
    }
    return null;
  }

  public async findAll(): Promise<User[]> {
    return Array.from(this.users.values()).sort(
      (a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime(),
    );
  }

  public async create(user: User): Promise<User> {
    this.users.set(user.getId().getValue(), user);
    return user;
  }

  public async update(user: User): Promise<User> {
    this.users.set(user.getId().getValue(), user);
    return user;
  }

  public async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  public clear(): void {
    this.users.clear();
  }
}
