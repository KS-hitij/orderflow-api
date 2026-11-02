import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../../config/env';
import { AuthContext, Role, User } from '../../domain';
import { ConflictError, UnauthorizedError } from '../../lib/errors';
import { UserRepository } from '../users/user.repository';

export interface PublicUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  role: user.role,
});

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async register(email: string, password: string): Promise<AuthResult> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const user = await this.users.create({ email, passwordHash, role: 'customer' });
    return { user: toPublicUser(user), token: this.signToken(user) };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }
    return { user: toPublicUser(user), token: this.signToken(user) };
  }

  async ensureAdmin(email: string, password: string): Promise<void> {
    const existing = await this.users.findByEmail(email);
    if (existing) return;
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    await this.users.create({ email, passwordHash, role: 'admin' });
  }

  verifyToken(token: string): AuthContext {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    return { userId: payload.sub as string, role: payload.role as Role };
  }

  private signToken(user: User): string {
    return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
      expiresIn: config.jwtExpiresInMinutes,
    });
  }
}
