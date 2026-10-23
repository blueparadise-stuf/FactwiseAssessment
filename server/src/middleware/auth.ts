import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User, IUser, UserRole } from '../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  id: string;
  role: UserRole;
  email: string;
}

export const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const setAuthCookie = (res: Response, token: string): void => {
  const isProduction = ENV.NODE_ENV === 'production';
  res.cookie('caretrack_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const clearAuthCookie = (res: Response): void => {
  const isProduction = ENV.NODE_ENV === 'production';
  res.cookie('caretrack_token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
    path: '/',
  });
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.caretrack_token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No session token found.',
      });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.id);

    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({
        success: false,
        message: 'User associated with token no longer exists.',
      });
      return;
    }

    if (!user.isActive) {
      clearAuthCookie(res);
      res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact an administrator.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: 'Invalid or corrupted authentication token.',
    });
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Action requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};
