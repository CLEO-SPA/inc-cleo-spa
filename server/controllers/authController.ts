import { Request, Response, NextFunction } from 'express';
import { AuthJwtPayload, InvJwtPayload } from '../types/auth.types.js';
import model from '../models/authModel.js';
import { getCurrentSimStatus } from '../services/simulationService.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import crypto from 'crypto';
import validator from 'validator';

const defaultPassword = async (req: Request, res: Response, next: NextFunction) => {
  const randomPassword = crypto.randomBytes(8).toString('hex');
  req.body.password = randomPassword;
  next();
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  if (res.locals.result) {
    const { rememberMe } = req.body;
    const simParams = getCurrentSimStatus().params;
    const start_date_utc = simParams?.start_date_utc;
    const end_date_utc = simParams?.end_date_utc;

    req.session.regenerate((err) => {
      if (err) {
        console.error('Error regenerating session:', err);
        return res.status(500).json({ message: 'Session error' });
      }
      req.session.start_date_utc = getCurrentSimStatus().isActive ? start_date_utc : null;
      req.session.end_date_utc = getCurrentSimStatus().isActive ? end_date_utc : new Date().toUTCString();
      req.session.end_date_is_default = getCurrentSimStatus().isActive ? false : true;
      req.session.user_id = res.locals.user_id;
      req.session.username = res.locals.username;
      req.session.email = res.locals.email;
      req.session.role = res.locals.role;

      // console.log('My Date: ', req.session.end_date_utc);

      const userPayload = {
        user_id: res.locals.user_id,
        username: res.locals.username,
        email: res.locals.email,
        role: res.locals.role,
      };

      if (rememberMe) {
        const token = jwt.sign(userPayload, process.env.AUTH_JWT_SECRET as string, {
          expiresIn: '30d',
        });
        res.cookie(process.env.REMEMBER_TOKEN as string, token, {
          maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/', // Ensure cookie is available for the entire domain
        });
      }

      req.session.save((saveErr) => {
        if (saveErr) {
          next(saveErr);
        }
        res.status(200).json({
          user: userPayload,
        });
      });
    });
  } else {
    throw new Error('Invalid Password');
  }
};

const logout = async (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }

    res.clearCookie('connect.sid', { path: '/' }); // Clear the session cookie
    res.clearCookie(process.env.REMEMBER_TOKEN as string, { path: '/' }); // Clear the remember me cookie
    if (err) {
      next(err);
    }
    res.status(200).json({ message: 'Logout successful' });
  });
};

const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  const rememberToken: string = req.cookies && req.cookies[process.env.REMEMBER_TOKEN as string];
  const simParams = getCurrentSimStatus().params;
  const start_date_utc = simParams?.start_date_utc;
  const end_date_utc = simParams?.end_date_utc;
  if (rememberToken) {
    try {
      const decoded = jwt.verify(rememberToken, process.env.AUTH_JWT_SECRET as string) as AuthJwtPayload;
      if (!req.session.user_id) {
        req.session.start_date_utc = getCurrentSimStatus().isActive ? start_date_utc : null;
        req.session.end_date_utc = getCurrentSimStatus().isActive ? end_date_utc : new Date().toUTCString();
        req.session.end_date_is_default = getCurrentSimStatus().isActive ? false : true;
        req.session.end_date_is_default = getCurrentSimStatus().isActive ? false : true;
        req.session.user_id = decoded.user_id;
        req.session.username = decoded.username;
        req.session.email = decoded.email;
        req.session.role = decoded.role;
        req.session.save();

        // console.log('My date from cookie', req.session.end_date_utc);
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
    console.error('Error decoding token', error);
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
    console.error('Error creating super user', error);
    throw new Error('Error creating super user');
  }
};

const getAuthUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (!validator.isEmail(username)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    // Check if the user exists
    const user = await model.getAuthUser(username);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.locals.hash = user.password;
    res.locals.username = user.employee_name || user.name || user.email.split('@')[0];
    res.locals.user_id = user.id;
    res.locals.email = user.email;
    res.locals.role = user.role_name;
    next();
  } catch (error) {
    next(error);
  }
};

const verifyInviteURL = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token: string = req.query.token as string;

  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.INV_JWT_SECRET as string) as unknown as InvJwtPayload;
    const { email } = decoded;

    res.locals.email = email;

    const employee = await model.getUserData(email);

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    res.status(200).send();
  } catch (error) {
    console.error('Error verifying invitation url', error);
    next(error);
  }
};

const acceptInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token: string = req.query.token as string;
  const password: string = req.body.password;
  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }
  if (!password) {
    res.status(400).json({ message: 'Password is required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.INV_JWT_SECRET as string) as unknown as InvJwtPayload;
    const { email } = decoded;

    res.locals.email = email;

    const employee = await model.getUserData(email);

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.locals.isInvite = true;

    next();
  } catch (error) {
    console.error('Error accepting invitation');
    next(error);
  }
};

const regenerateInvitationLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  try {
    const user = await model.getUserData(email);
    if (!user) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    await model.updateUserTimestamp(email);

    const token = jwt.sign({ email: email }, process.env.INV_JWT_SECRET as string, {
      expiresIn: '3d',
    });
    const callbackUrl = `${process.env.LOCAL_FRONTEND_URL as string}/reset-password?token=${token}`;

    res.status(200).json({ message: 'Invitation link regenerated successfully', callbackUrl });
  } catch (error) {
    console.error('Error regenerating invitation link', error);
    next(error);
  }
};

const updateUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  const password_hash = res.locals.hash;

  try {
    await model.updateUserPassword(res.locals.email, password_hash, res.locals.isInvite);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password', error);
    throw new Error('Error updating password');
  }
};

export default {
  isAuthenticated,
  setUpSuperUser,
  decodeSuperUserToken,
  getAuthUser,
  login,
  logout,
  defaultPassword,
  verifyInviteURL,
  acceptInvitation,
  regenerateInvitationLink,
  updateUserPassword,
};
