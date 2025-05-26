import { Request, Response, NextFunction } from 'express';
import { AuthJwtPayload } from '../types/auth.types.js';
import model from '../models/employeeModel.js';
import { getCurrentSimStatus } from '../services/simulationService.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  const rememberToken: string = req.cookies && req.cookies[process.env.REMEMBER_TOKEN as string];
  const simParams = getCurrentSimStatus().params;
  const start_date_utc = simParams?.start_date_utc;
  const end_date_utc = simParams?.end_date_utc;
  if (rememberToken) {
    try {
      const decoded = jwt.verify(rememberToken, process.env.JWT_SECRET as string) as AuthJwtPayload;
      if (!req.session.user_id) {
        req.session.start_date_utc = getCurrentSimStatus().isActive ? start_date_utc : null;
        req.session.end_date_utc = getCurrentSimStatus().isActive ? end_date_utc : new Date().toUTCString();
        req.session.user_id = decoded.user_id;
        req.session.username = decoded.username;
        req.session.email = decoded.email;
        req.session.role = decoded.role;
        req.session.save();
      }
      res.status(200).json({
        isAuthenticated: true,
        user: {
          user_id: decoded.user_id,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
        },
      });
      return;
    } catch (error) {
      console.warn('Invalid remember_me token:', error);
      res.clearCookie(process.env.REMEMBER_TOKEN as string, { path: '/' });
    }
  }

  if (req.session && req.session.user_id) {
    res.status(200).json({
      isAuthenticated: true,
      user: {
        user_id: req.session.user_id,
        username: req.session.username,
        email: req.session.email,
        role: req.session.role,
      },
    });
    return;
  }

  res.status(401).json({ message: 'Unauthorized: Please log in.' });
};

const decodeSuperUserToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { token } = req.params;
  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.INV_JWT_SECRET as string) as AuthJwtPayload;
    const { email, password } = decoded;

    // console.log(email, password);

    req.body.password = password;
    req.body.email = email;

    next();
  } catch (error) {
    throw new Error('Error decoding token');
  }
};

const setUpSuperUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if no user exists in the database
    const userCount = await model.getUserCount();
    if (userCount > 0) {
      res.status(400).json({ message: 'Super user already exists' });
      return;
    }

    const { email } = req.body;
    const password = res.locals.hash;

    await model.createSuperUser(email, password);

    res.status(201).json({ message: 'Super user created successfully' });
  } catch (error) {
    throw new Error('Error creating super user');
  }
};

export default {
  isAuthenticated,
  setUpSuperUser,
  decodeSuperUserToken,
};
