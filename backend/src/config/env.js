export function validateEnvironment() {
  const required = ['JWT_SECRET', 'MONGODB_URI'];

  const missing = required.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET.trim().length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL?.trim()) {
    throw new Error('CLIENT_URL is required in production');
  }
}

export function getAllowedOrigins() {
  const localOrigins =
    process.env.NODE_ENV === 'production'
      ? []
      : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'];

  const configuredOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        throw new Error(`Invalid CLIENT_URL origin: ${origin}`);
      }
    });

  return new Set([...localOrigins, ...configuredOrigins]);
}