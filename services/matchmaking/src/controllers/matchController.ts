import { Request, Response } from "express";
import { Matchmaker } from "../services/MatchMaker";
import { MatchRequest } from "../services/QueueManager";

export const MatchController = {
  /**
   * Enqueue a user into the matchmaking queue
   */
  async enqueue(req: Request, res: Response) {
    try {
      const user: MatchRequest = req.body;
        console.log("Enqueueing user:", user);
      if (!user.userId || !user.debateType || !user.mode) {
        res.status(400).json({ message: "Missing required fields." });
        return
      }

      await Matchmaker.enqueueUser(user);
     res.status(200).json({ message: "User added to queue." });
     return
    } catch (error) {
      console.error("Error enqueueing user:", error);
      res.status(500).json({ message: "Internal server error." });
      return;
    }
  },

  /**
   * Remove a user from the queue
   */
  async dequeue(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ message: "Missing userId." });
        return;
      }

      await Matchmaker.removeUser(userId);
      res.status(200).json({ message: "User removed from queue." });
      return;
    } catch (error) {
      console.error("Error dequeueing user:", error);
      res.status(500).json({ message: "Internal server error." });
      return;
    }
  },

  /**
   * Get all users currently in the queue
   */
  async getQueue(req: Request, res: Response) {
    try {
      const queue = await Matchmaker.getQueue();
      res.status(200).json({ queue });
      return;
    } catch (error) {
      console.error("Error fetching queue:", error);
      res.status(500).json({ message: "Internal server error." });
      return;
    }
  },

  /**
   * Clear the queue (admin use only)
   */
  async clearQueue(req: Request, res: Response) {
    try {
      await Matchmaker.clearQueue();
      res.status(200).json({ message: "Queue cleared." });
      return;
    } catch (error) {
      console.error("Error clearing queue:", error);
      res.status(500).json({ message: "Internal server error." });
      return;
    }
  }
};
