// Environment variable validation
export const validateEnv = () => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT',
    'NODE_ENV',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY',
    'S3_BUCKET_NAME'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('Please check your .env file and add these variables.');
    process.exit(1);
  }

  // Set defaults for optional variables
  process.env.PORT = process.env.PORT || '8000';
  process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '900000';
  process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '100';
  process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || '12';

  // Validate S3 configuration
  if (!process.env.S3_ENDPOINT) {
    process.env.S3_ENDPOINT = 'https://s3.amazonaws.com';
  }

  if (!process.env.S3_PUBLIC_URL) {
    process.env.S3_PUBLIC_URL = process.env.S3_ENDPOINT;
  }
};