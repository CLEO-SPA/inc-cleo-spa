import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';

const saltRounds = 10;

export const hashPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const callback = (err: unknown, hash: string | undefined): void => {
    if (err) {
      throw new Error('Error hashing password');
    } else {
      res.locals.hash = hash;
      // console.log(hash);
      next();
    }
  };

  bcrypt.hash(req.body.password, saltRounds, callback);
};

export const comparePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const callback = (err: unknown, result: boolean | undefined): void => {
    if (err) {
      throw new Error('Error comparing password');
    } else {
      res.locals.result = result;
      // console.log(result);
      next();
    }
  };

  bcrypt.compare(req.body.password, res.locals.hash, callback);
};
