import { Uuid } from '@core/value-objects/uuid.value-object';

export interface RefreshTokenProps {
  id: Uuid;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export class RefreshToken {
  private readonly _id: Uuid;
  private readonly _userId: string;
  private readonly _tokenHash: string;
  private readonly _expiresAt: Date;
  private _revokedAt: Date | null;
  private readonly _createdAt: Date;

  constructor(props: RefreshTokenProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._tokenHash = props.tokenHash;
    this._expiresAt = props.expiresAt;
    this._revokedAt = props.revokedAt;
    this._createdAt = props.createdAt;
  }

  public getId(): Uuid {
    return this._id;
  }

  public getUserId(): string {
    return this._userId;
  }

  public getTokenHash(): string {
    return this._tokenHash;
  }

  public getExpiresAt(): Date {
    return this._expiresAt;
  }

  public getRevokedAt(): Date | null {
    return this._revokedAt;
  }

  public getCreatedAt(): Date {
    return this._createdAt;
  }

  public isExpired(): boolean {
    return this._expiresAt.getTime() <= Date.now();
  }

  public isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  public revoke(): void {
    this._revokedAt = new Date();
  }
}
