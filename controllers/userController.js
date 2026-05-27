import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendWelcomeEmail, sendEmailVerifiedEmail, sendPasswordResetEmail, sendVerificationOtpEmail } from "../services/emailService.js";
import Cart from "../models/Cart/cartModel.js";
import { buildImagePath, buildImageUrl } from "../utils/fileUtils.js";

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

// Register User
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, address } = req.body;

    // check existing user
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      phone,
      password,
      address,
      emailVerified: false,
      otpHash,
      otpExpiresAt,
      otpLastSentAt: new Date(),
    });

    await Cart.create({
      userId: user.id,
    });

    try {
      sendVerificationOtpEmail(user, otp).catch(err => console.error("Verification OTP email failed:", err));
    } catch (mailErr) {
      console.error("Email queuing failed:", mailErr);
    }

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email with the 6-digit code sent.",
      requiresVerification: true,
      email: user.email,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: buildImageUrl(user.profileImage),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login User
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address to access your account.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: buildImageUrl(user.profileImage),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout User
export const logoutUser = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

// Get logged-in user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: {
        exclude: ["password"],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const payload = user.toJSON();
    payload.profileImage = buildImageUrl(payload.profileImage);

    res.status(200).json({
      success: true,
      user: payload,
    });
  } catch (error) {
    let errorMessage = error.message;
    if (error.errors && Array.isArray(error.errors)) {
      errorMessage = error.errors.map((e) => e.message).join(", ");
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: errorMessage,
    });
  }
};

// Update profile

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, profileImage } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let parsedAddress = address;

    if (typeof address === "string") {
      try {
        parsedAddress = JSON.parse(address);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid address format",
        });
      }
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.profileImage =
      buildImagePath(req.file) ||
      profileImage ||
      user.profileImage;

    user.address = parsedAddress || user.address;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        profileImage: buildImageUrl(user.profileImage),
      },
    });
  } catch (error) {
  console.log("FULL ERROR");
  console.dir(error, { depth: null });

  return res.status(500).json({
    success: false,
    message: error.message,
    details: error.errors || null,
  });
}
}
  

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// reset password while logged in

export const resetPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(oldPassword || "");

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    user.password = newPassword;

    await user.save();

    res.status(200).json({
      success: true,

      message: "Password updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
};

// forgot password

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "Email not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;

    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user, resetUrl);
    } catch (mailErr) {
      console.error("Password reset email failed:", mailErr);
    }

    res.status(200).json({
      success: true,

      message: "Password reset link sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
};

// reset via link

export const resetPasswordByLink = async (req, res) => {
  try {
    const { token } = req.params;

    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,

        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,

        message: "Invalid token",
      });
    }

    if (user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({
        success: false,

        message: "Link expired",
      });
    }

    user.password = newPassword;

    user.resetPasswordToken = null;

    user.resetPasswordExpire = null;

    await user.save();

    res.status(200).json({
      success: true,

      message: "Password reset success",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
};

// Verify OTP
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP code are required",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Check if OTP is expired
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one.",
      });
    }

    // Verify hash
    const inputHash = crypto.createHash("sha256").update(otp.toString()).digest("hex");
    if (inputHash !== user.otpHash) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // Activate Account
    user.emailVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();

    // Complete onboarding emails in the background
    try {
      sendWelcomeEmail(user).catch(err => console.error("Welcome email failed:", err));
      sendEmailVerifiedEmail(user).catch(err => console.error("Verification email failed:", err));
    } catch (mailErr) {
      console.error("Email queuing failed:", mailErr);
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: buildImageUrl(user.profileImage),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Rate Limiting: 60 seconds
    if (user.otpLastSentAt) {
      const timeDiff = Date.now() - new Date(user.otpLastSentAt).getTime();
      if (timeDiff < 60 * 1000) {
        const secondsLeft = Math.ceil((60 * 1000 - timeDiff) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting a new code.`,
        });
      }
    }

    // Generate fresh OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpHash = otpHash;
    user.otpExpiresAt = otpExpiresAt;
    user.otpLastSentAt = new Date();
    await user.save();

    try {
      sendVerificationOtpEmail(user, otp).catch(err => console.error("Verification OTP email failed:", err));
    } catch (mailErr) {
      console.error("Email queuing failed:", mailErr);
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent successfully.",
    });
  } catch (error) {
    next(error);
  }
};

