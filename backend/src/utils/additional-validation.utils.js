import Joi from 'joi';

// Create additional validation schema for change password
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required()
});

// Export from existing validation utils
export * from './validation.utils.js';
