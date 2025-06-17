import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { publishEvent } from '../services/kafka/kafkaProducer';
import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'] || "15m";
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'] || "7d";

if (!accessTokenExpiry) {
  throw new Error("ACCESS_TOKEN_EXPIRY environment variable is not defined");
}

if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is not defined");
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username, full_name } = req.body;
    console.log("Registering user:", { email, username, full_name });
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in DB
    const user = await prisma.user.create({
      data: { email, password_hash: hashedPassword, username, full_name }
    });
    console.log("user created:", user.id);
    // Publish event for new user creation
    await publishEvent('user.created', { userId: user.id, email });

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: accessTokenExpiry });
    const refreshToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: refreshTokenExpiry });
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.json({ accessToken,user: { id: user.id, email: user.email, username: user.username, full_name: user.full_name } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
     res.status(401).json({ error: 'Invalid credentials' });
     return;
    }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: accessTokenExpiry });
    const refreshToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: refreshTokenExpiry });

    // Set refresh token cookie

    await publishEvent('user.logged_in', { userId: user.id, email });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.json({ accessToken });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token){
      res.sendStatus(403);
      return;
    } 

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    const userId = decoded.userId as string | undefined;

    if (!userId){
      res.sendStatus(403);
      return;
    } 

    const accessToken = jwt.sign({ userId }, jwtSecret, { expiresIn: accessTokenExpiry });
    res.json({ accessToken });
    return;
  } catch (error) {
    console.error("Refresh token error:", error);
    res.sendStatus(403);
    return;
  }
};

export const logout = (req: Request, res: Response) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict' });
  res.sendStatus(204);
};
