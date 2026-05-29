import jwt from "jsonwebtoken";
import ChatConversation from "../models/chatConversationModel.js";
import ChatMessage from "../models/chatMessageModel.js";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

// Authenticate socket connection
const authenticateSocket = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

export const initializeChatSocket = (io) => {
  io.use((socket, next) => {
    console.log("AUTH:", socket.handshake.auth);
    console.log("HEADER:", socket.handshake.headers.authorization);
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication failed"));
    }

    const decoded = authenticateSocket(token);

    if (!decoded) {
      return next(new Error("Invalid token"));
    }

    socket.user = decoded;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    console.log(`[Socket] User connected: ${userId} (role: ${socket.user.role})`);
    console.log("socket user", userId);

    // Join user to their personal room
    const userRoomName = `user:${userId}`;
    socket.join(userRoomName);
    console.log(`[Socket] Joined room: ${userRoomName}`);
    console.log("joined room", userRoomName);

    // Admin joins to admin room
    if (socket.user.role === "admin") {
      const adminRoomName = "admin";
      socket.join(adminRoomName);
      console.log(`[Socket] Admin joined room: ${adminRoomName}`);
      console.log("joined room", adminRoomName);
    }

    // User sends a message
    socket.on("send-message", async (data) => {
      try {
        let { conversationId, userId: targetUserIdParam, message } = data;
        const senderId = socket.user.id;
        const senderRole = socket.user.role;

        console.log(`[Socket] send-message event:`, { conversationId, senderId, senderRole, message: message ? message.substring(0, 50) : "" });

        if (!message) {
          socket.emit("error", { message: "Message cannot be empty" });
          return;
        }

        let conversation;

        // If no conversation ID, create one (for users starting a new conversation)
        if (!conversationId) {
          if (senderRole !== "user") {
            socket.emit("error", { message: "Only users can create new conversations" });
            return;
          }

          // Check if conversation already exists for this user
          conversation = await ChatConversation.findOne({
            where: { userId: senderId },
          });

          if (!conversation) {
            conversation = await ChatConversation.create({
              userId: senderId,
              lastMessage: message,
              lastMessageAt: new Date(),
            });
            console.log(`[Socket] Created new conversation ${conversation.id} for user ${senderId}`);
          } else {
            console.log(`[Socket] Found existing conversation ${conversation.id} for user ${senderId}`);
          }
          conversationId = conversation.id;
        } else {
          // Verify conversation exists
          conversation = await ChatConversation.findByPk(conversationId);

          if (!conversation) {
            socket.emit("error", { message: "Conversation not found" });
            return;
          }

          console.log(`[Socket] Found conversation ${conversationId}. Owner userId: ${conversation.userId}`);

          // Verify access (convert to Number for safe comparison)
          if (senderRole === "user" && Number(conversation.userId) !== Number(senderId)) {
            console.log(`[Socket] ACCESS DENIED: User ${senderId} tried to access conversation owned by ${conversation.userId}`);
            socket.emit("error", { message: "Access denied" });
            return;
          }
        }

        // Create message
        const chatMessage = await ChatMessage.create({
          conversationId,
          senderId,
          senderRole,
          message,
        });

        // Update conversation
        await conversation.update({
          lastMessage: message,
          lastMessageAt: new Date(),
        });

        // Fetch sender info
        const sender = await User.findByPk(senderId, {
          attributes: ["id", "name", "email"],
        });

        const messageData = {
          id: chatMessage.id,
          conversationId,
          senderId,
          senderRole,
          message,
          sender,
          createdAt: chatMessage.createdAt,
        };

        console.log(`[Socket] Message created: id=${chatMessage.id}, conversationId=${conversationId}`);

        // Emit to recipient
        if (senderRole === "user") {
          // Emit to admin room
          const roomName = "admin";
          console.log("sending to room", roomName);
          io.to(roomName).emit("new_message", messageData);
        } else {
          // Emit to user's room
          const targetUserId = targetUserIdParam || conversation.userId;
          const roomName = `user:${targetUserId}`;
          console.log("sending to room", roomName);
          console.log("conversation user", conversation.userId);
          io.to(roomName).emit("new_message", messageData);
        }

        // Confirm to sender
        socket.emit("message-sent", messageData);
      } catch (error) {
        console.error("[Socket] Error:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // User joins conversation room to receive updates
    socket.on("join-conversation", (data) => {
      const { conversationId } = data;
      socket.join(`conversation-${conversationId}`);
      console.log(`[Socket] User ${socket.user.id} joined room: conversation-${conversationId}`);
    });

    // User leaves conversation
    socket.on("leave-conversation", (data) => {
      const { conversationId } = data;
      socket.leave(`conversation-${conversationId}`);
      console.log(`[Socket] User ${socket.user.id} left room: conversation-${conversationId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.user.id}`);
    });
  });
};
