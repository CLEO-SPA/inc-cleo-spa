import { JwtPayload } from 'jsonwebtoken';

export interface AuthJwtPayload extends JwtPayload {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

export interface InvJwtPayload extends JwtPayload {
  email: string;
}
