import jwt from 'jsonwebtoken';

// Helper function to get JWT secret with validation
const getJWTSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables. Please check your .env file.');
  }
  return process.env.JWT_SECRET;
};

// Helper function to get JWT refresh secret with validation
const getJWTRefreshSecret = () => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables. Please check your .env file.');
  }
  return process.env.JWT_REFRESH_SECRET;
};

export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    getJWTSecret(),
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    getJWTRefreshSecret(),
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, getJWTRefreshSecret());
};

