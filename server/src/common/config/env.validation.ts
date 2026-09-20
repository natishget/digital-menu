export interface EnvConfig {
  PORT: number;
  DATABASE_URL: string;
  APP_ENV: 'development' | 'staging' | 'production';
  CORS_ORIGIN: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  MASTER_ADMIN_USERNAME: string;
  MASTER_ADMIN_PASSWORD: string;
  BCRYPT_SALT_ROUNDS: number;
  TELEBIRR_API_KEY: string;
  CBE_BIRR_API_KEY: string;
}

export function validateEnv(config: Record<string, any>): EnvConfig {
  const requiredKeys = [
    'PORT',
    'DATABASE_URL',
    'APP_ENV',
    'CORS_ORIGIN',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_SECRET',
    'JWT_REFRESH_EXPIRES_IN',
    'MASTER_ADMIN_USERNAME',
    'MASTER_ADMIN_PASSWORD',
    'BCRYPT_SALT_ROUNDS',
    'TELEBIRR_API_KEY',
    'CBE_BIRR_API_KEY',
  ];

  const missingKeys: string[] = [];

  for (const key of requiredKeys) {
    const val = config[key];
    if (val === undefined || val === null || String(val).trim() === '') {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    throw new Error(
      `\n❌ [CRITICAL ENVIRONMENT ERROR]: Missing or empty required variables in server/.env:\n` +
        missingKeys.map((k) => `  - ${k}`).join('\n') +
        `\n\nPlease populate all required variables in server/.env (refer to server/.env.example).\n`,
    );
  }

  const portNum = Number(config.PORT);
  if (isNaN(portNum) || portNum <= 0) {
    throw new Error(
      `❌ [ENV ERROR]: PORT must be a valid positive number in server/.env (got: '${config.PORT}')`,
    );
  }

  const saltRoundsNum = Number(config.BCRYPT_SALT_ROUNDS);
  if (isNaN(saltRoundsNum) || saltRoundsNum <= 0) {
    throw new Error(
      `❌ [ENV ERROR]: BCRYPT_SALT_ROUNDS must be a valid positive number in server/.env (got: '${config.BCRYPT_SALT_ROUNDS}')`,
    );
  }

  const validEnvs = ['development', 'staging', 'production'];
  if (!validEnvs.includes(config.APP_ENV)) {
    throw new Error(
      `❌ [ENV ERROR]: APP_ENV must be one of [${validEnvs.join(', ')}] in server/.env (got: '${config.APP_ENV}')`,
    );
  }

  return {
    PORT: portNum,
    DATABASE_URL: String(config.DATABASE_URL).trim(),
    APP_ENV: config.APP_ENV as 'development' | 'staging' | 'production',
    CORS_ORIGIN: String(config.CORS_ORIGIN).trim(),
    JWT_SECRET: String(config.JWT_SECRET).trim(),
    JWT_EXPIRES_IN: String(config.JWT_EXPIRES_IN).trim(),
    JWT_REFRESH_SECRET: String(config.JWT_REFRESH_SECRET).trim(),
    JWT_REFRESH_EXPIRES_IN: String(config.JWT_REFRESH_EXPIRES_IN).trim(),
    MASTER_ADMIN_USERNAME: String(config.MASTER_ADMIN_USERNAME).trim(),
    MASTER_ADMIN_PASSWORD: String(config.MASTER_ADMIN_PASSWORD).trim(),
    BCRYPT_SALT_ROUNDS: saltRoundsNum,
    TELEBIRR_API_KEY: String(config.TELEBIRR_API_KEY).trim(),
    CBE_BIRR_API_KEY: String(config.CBE_BIRR_API_KEY).trim(),
  };
}
