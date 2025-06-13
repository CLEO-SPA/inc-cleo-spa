import 'express-serve-static-core';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user_id?: string;
    username?: string;
    email?: string;
    role?: string;
    start_date_utc: string | null;
    end_date_utc: string;
    end_date_is_default?: boolean | null;
    is_simulation?: boolean | null;
  }
}

declare global {
  namespace Express {
    interface Request {
      is_simulation?: boolean | null;
    }
  }
}
