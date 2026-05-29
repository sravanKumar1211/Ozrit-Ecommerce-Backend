import ChatConversation from "../models/chatConversationModel.js";
import ChatMessage from "../models/chatMessageModel.js";
import User from "../models/userModel.js";
import { Op } from "sequelize";

// Get all conversations (for admin) or user's conversation (for user)
export const getConversations = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let conversations;

    if (role === "admin") {
      // Admin gets all conversations
      conversations = await ChatConversation.findAll({
        include: [
          {
            model: User,
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["lastMessageAt", "DESC"]],
      });
    } else {
      // User gets their own conversation
      conversations = await ChatConversation.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: User,
            attributes: ["id", "name", "email"],
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching conversations",
      error: error.message,
    });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { id: userId, role } = req.user;

    // Verify user has access to this conversation
    const conversation = await ChatConversation.findByPk(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (conversation.userId !== userId && role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const messages = await ChatMessage.findAll({
      where: { conversationId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
          foreignKey: "senderId",
          as: "sender",
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Mark messages as read for the viewer
    await ChatMessage.update(
      { isRead: true },
      {
        where: {
          conversationId,
          senderId: { [Op.ne]: userId },
        },
      }
    );

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message,
    });
  }
};

// Create a new message (via REST API)
export const createMessage = async (req, res) => {
  try {
    let { conversationId, message } = req.body;
    const { id: senderId, role } = req.user;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    let conversation;

    // If no conversation ID, create one (for users starting a new conversation)
    if (!conversationId) {
      if (role !== "user") {
        return res.status(400).json({
          success: false,
          message: "Only users can create new conversations",
        });
      }

      // Check if conversation already exists for this user
      conversation = await ChatConversation.findOne({
        where: { userId: req.user.id },
      });

      if (!conversation) {
        conversation = await ChatConversation.create({
          userId: senderId,
          lastMessage: message,
          lastMessageAt: new Date(),
        });
      }
      conversationId = conversation.id;
    } else {
      // Verify conversation exists and user has access
      conversation = await ChatConversation.findByPk(conversationId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      if (conversation.userId !== senderId && role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    // Create message
    const chatMessage = await ChatMessage.create({
      conversationId,
      senderId,
      senderRole: role,
      message,
    });

    // Update conversation
    await conversation.update({
      lastMessage: message,
      lastMessageAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: chatMessage,
      conversationId: conversation.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating message",
      error: error.message,
    });
  }
};
