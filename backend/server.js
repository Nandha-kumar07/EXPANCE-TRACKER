import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// 🤖 Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const app = express();

// 🔧 Middlewares
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // your Vite frontend
    credentials: true,
  })
);

// 🧵 Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// 👤 User Schema & Model
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    budgets: [
      {
        category: { type: String, required: true },
        amount: { type: Number, required: true, default: 0 },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    googleId: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// 🔑 Auth Middleware (Protect Routes)
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization; // "Bearer token"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: ... }
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// 📌 Routes

// Health check
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

// 📝 Signup Route
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      budgets: [], // Initialize empty budgets
    });

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        budgets: user.budgets,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({ message: error.message });
  }
});

// 🔓 Login Route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        budgets: user.budgets || [],
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// 👤 Get Current User (Protected)
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user });
  } catch (error) {
    console.error("Get user error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// 👤 Update Current User Profile
app.put("/api/auth/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    user.name = name;
    user.email = email;
    await user.save();

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        budgets: user.budgets
      },
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// 💰 Budgets Routes

// Get Budgets
app.get("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("budgets");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user.budgets || []);
  } catch (error) {
    console.error("Get budgets error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update Budgets
app.post("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const { budgets } = req.body; // Expects array: [{category, amount}, ...]

    if (!Array.isArray(budgets)) {
      return res.status(400).json({ message: "Budgets must be an array" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.budgets = budgets;
    await user.save();

    return res.json(user.budgets);
  } catch (error) {
    console.error("Update budgets error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// 💸 Transaction Schema & Model
const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["expense", "income"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String, // Future support for file uploads
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

// 💸 Transaction Routes

// Create Transaction
app.post("/api/transactions", authMiddleware, async (req, res) => {
  try {
    const { type, amount, date, category, description } = req.body;

    if (!type || !amount || !date || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount,
      date,
      category,
      description,
    });

    return res.status(201).json(transaction);
  } catch (error) {
    console.error("Create transaction error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get All Transactions for User
app.get("/api/transactions", authMiddleware, async (req, res) => {
  try {
    // Sort by date descending
    const transactions = await Transaction.find({ userId: req.user.id }).sort({
      date: -1,
    });
    return res.json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete Transaction
app.delete("/api/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Ensure user owns the transaction
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await transaction.deleteOne();
    return res.json({ message: "Transaction removed" });
  } catch (error) {
    console.error("Delete transaction error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// 📝 Note Schema & Model
const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: [String],
    isPinned: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "#ffffff", // Default white, can be changed for UI
    },
  },
  { timestamps: true }
);

const Note = mongoose.model("Note", noteSchema);

// 📝 Note Routes

// Create Note
app.post("/api/notes", authMiddleware, async (req, res) => {
  try {
    const { title, content, tags, color, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const note = await Note.create({
      userId: req.user.id,
      title,
      content,
      tags: tags || [],
      color: color || "#1e293b", // Default dark theme card color
      isPinned: isPinned || false,
    });

    return res.status(201).json(note);
  } catch (error) {
    console.error("Create note error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get All Notes for User
app.get("/api/notes", authMiddleware, async (req, res) => {
  try {
    // Sort by pinned first, then by date descending
    const notes = await Note.find({ userId: req.user.id }).sort({
      isPinned: -1,
      updatedAt: -1,
    });
    return res.json(notes);
  } catch (error) {
    console.error("Get notes error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update Note
app.put("/api/notes/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content, tags, color, isPinned } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    note.title = title || note.title;
    note.content = content || note.content;
    note.tags = tags || note.tags;
    note.color = color || note.color;
    note.isPinned = isPinned !== undefined ? isPinned : note.isPinned;

    await note.save();
    return res.json(note);
  } catch (error) {
    console.error("Update note error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// 📧 Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper to send email
const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`📧 Email sent successfully to ${to}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    console.error("❌ Full error:", error);
    throw error; // Re-throw to handle in the route
  }
};

// -----------------------------------------------------------------------------
// 🔐 Auth Routes (Google & Email)
// -----------------------------------------------------------------------------

// Google Sign-In
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/api/auth/google", async (req, res) => {
  try {
    const { token } = req.body;

    // Verify Access Token (not ID Token)
    const tokenInfo = await client.getTokenInfo(token);
    const { email } = tokenInfo;

    // Get user profile info (name, picture) using the access token
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
    const data = await response.json();
    const { name, sub } = data;

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = sub;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
        googleId: sub,
        isVerified: true, // Google users are verified by default
      });
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token: jwtToken, user: { id: user._id, name: user.name, email: user.email, budgets: user.budgets } });

  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(401).json({ message: "Google Authentication Failed" });
  }
});

// Email Verification
app.post("/api/auth/verify-request", async (req, res) => {
  // Logic to send verification token (random string) via email
  // Pending implementation based on user flow preference
  res.status(501).json({ message: "Not implemented yet" });
});

// Forgot Password
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const emailText = `Hello ${user.name},\n\nYou requested a password reset for your Expense Tracker account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nExpense Tracker Team`;

    try {
      await sendEmail(user.email, "Password Reset Request - Expense Tracker", emailText);
      console.log(`✅ Password reset email sent to ${user.email}`);
      return res.json({ message: "Password reset link sent to email" });
    } catch (emailError) {
      console.error("❌ Failed to send email:", emailError.message);
      // Clear the reset token since email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        message: "Failed to send email. Please check server email configuration.",
        error: emailError.message
      });
    }
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Reset Password
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(400).json({ message: "Invalid token" });
  }
});

// Delete Note
app.delete("/api/notes/:id", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await note.deleteOne();
    return res.json({ message: "Note deleted" });
  } catch (error) {
    console.error("Delete note error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});


app.post("/api/chatbot/message", authMiddleware, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "AI service not configured. Please add GEMINI_API_KEY to environment variables."
      });
    }


    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(50); 

    const user = await User.findById(req.user.id).select("name budgets");

    
    const totalExpenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory = transactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

  
    const contextPrompt = `You are a helpful financial assistant for ${user.name}'s expense tracker app.

USER'S FINANCIAL SUMMARY:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Balance: $${(totalIncome - totalExpenses).toFixed(2)}
- Number of Transactions: ${transactions.length}

EXPENSES BY CATEGORY:
${Object.entries(expensesByCategory)
        .map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`)
        .join('\n')}

${user.budgets && user.budgets.length > 0 ? `BUDGETS:
${user.budgets.map(b => `- ${b.category}: $${b.amount}`).join('\n')}` : ''}

RECENT TRANSACTIONS (last 10):
${transactions.slice(0, 10).map(t =>
          `- ${t.date.toLocaleDateString()}: ${t.type === 'expense' ? '-' : '+'}$${t.amount} (${t.category})${t.description ? ' - ' + t.description : ''}`
        ).join('\n')}

 ${message}`;

    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    
    const chatHistory = conversationHistory.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(contextPrompt);
    const response = await result.response;
    const aiReply = response.text();

    const suggestions = [];
    if (totalExpenses > totalIncome) {
      suggestions.push("How can I reduce my expenses?");
    }
    if (Object.keys(expensesByCategory).length > 0) {
      const topCategory = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a)[0][0];
      suggestions.push(`Tips for managing ${topCategory} expenses`);
    }
    if (!user.budgets || user.budgets.length === 0) {
      suggestions.push("Help me create a budget");
    }

    return res.json({
      reply: aiReply,
      suggestions: suggestions.slice(0, 3) 
    });

  } catch (error) {
    console.error("Chatbot error:", error);

  
    if (error.message?.includes("API key")) {
      return res.status(500).json({
        message: "Invalid API key. Please check your GEMINI_API_KEY configuration."
      });
    }

    return res.status(500).json({
      message: "Failed to get AI response. Please try again.",
      error: error.message
    });
  }
});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(" Server updated with error logging and JWT_SECRET");
});
