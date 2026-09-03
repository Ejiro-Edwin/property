import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3100),

  DATABASE_URL: Joi.string().uri().required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('3600s'),

  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(8).max(15).default(10),

  CORS_ORIGINS: Joi.string().allow('').default(''),

  FRONTEND_URL: Joi.string().uri().optional(),

  EMAIL_ENABLED: Joi.string().valid('true', 'false').default('false'),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().port().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().email().optional(),

  AUTH_REQUIRE_EMAIL_VERIFICATION: Joi.string().valid('true', 'false').default('false'),
}).unknown(true);

