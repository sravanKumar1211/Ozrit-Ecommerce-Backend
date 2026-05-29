import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  getConversations,
  getMessages,
  createMessage,
} from "../controllers/chatController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get conversations
router.get("/conversations", getConversations);

// Get messages for a conversation
router.get("/messages/:conversationId", getMessages);

// Create a message
router.post("/message", createMessage);

export default router;
