// user-service/middlewares/extractUserId.ts
import { Request, Response, NextFunction } from 'express';

export const extractUserId = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"];
  if (!userId || typeof userId !== "string") {
    return res.status(401).json({ error: "User ID missing in request" });
  }

  req.userId = userId; 
  next();
};
