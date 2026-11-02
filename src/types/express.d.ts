import { AuthContext } from '../domain';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      requestId?: string;
    }
  }
}

export {};
