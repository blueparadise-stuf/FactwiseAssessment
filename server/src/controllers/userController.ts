import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

export const listUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find().sort({ role: 1, name: 1 });
    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: `A user with email '${email}' already exists.`,
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      isActive: true,
    });

    await logAudit({
      actor: req.user,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user._id.toString(),
      reason: `Admin created user with role ${role}`,
      after: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      message: `User ${user.name} created successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const beforeState = user.toObject();

    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    await user.save();

    await logAudit({
      actor: req.user,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user._id.toString(),
      reason: 'Admin updated user attributes',
      before: beforeState,
      after: user.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const resetUserCredentials = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    const user = await User.findById(id).select('+passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await logAudit({
      actor: req.user,
      action: 'USER_PASSWORD_RESET',
      entityType: 'User',
      entityId: user._id.toString(),
      reason: 'Admin reset user password',
    });

    res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.email}.`,
    });
  } catch (err) {
    next(err);
  }
};
