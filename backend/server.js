import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// connect mongodb
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err.message));

// user schema
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

// auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// routes

app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      budgets: [],
    });

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

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

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

app.put("/api/auth/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

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

// budgets routes

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

app.post("/api/budgets", authMiddleware, async (req, res) => {
  try {
    const { budgets } = req.body;

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

// transaction schema
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
    receiptUrl: String,
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

// transaction routes

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

app.get("/api/transactions", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({
      date: -1,
    });
    return res.json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

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

// note schema
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
      default: "#ffffff",
    },
  },
  { timestamps: true }
);

const Note = mongoose.model("Note", noteSchema);

// note routes

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
      color: color || "#1e293b",
      isPinned: isPinned || false,
    });

    return res.status(201).json(note);
  } catch (error) {
    console.error("Create note error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/notes", authMiddleware, async (req, res) => {
  try {
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

// email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`Email sent successfully to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw error;
  }
};

// google login
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/api/auth/google", async (req, res) => {
  try {
    const { token } = req.body;

    const tokenInfo = await client.getTokenInfo(token);
    const { email } = tokenInfo;

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
        password: await bcrypt.hash(Math.random().toString(36), 10),
        googleId: sub,
        isVerified: true,
      });
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token: jwtToken, user: { id: user._id, name: user.name, email: user.email, budgets: user.budgets } });

  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(401).json({ message: "Google Authentication Failed" });
  }
});

app.post("/api/auth/verify-request", async (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

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

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const emailText = `Hello ${user.name},\n\nYou requested a password reset.\n\nClick link to reset:\n${resetUrl}\n\nThanks,\nExpense Tracker`;

    try {
      await sendEmail(user.email, "Password Reset - Expense Tracker", emailText);
      return res.json({ message: "Password reset link sent to email" });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        message: "Failed to send email.",
        error: emailError.message
      });
    }
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

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

app.post("/api/chatbot/message", authMiddleware, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "AI service not configured."
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

    const contextPrompt = `You are a financial assistant for ${user.name}.
    Income: $${totalIncome}
    Expenses: $${totalExpenses}
    Balance: $${totalIncome - totalExpenses}
    
    User message: ${message}`;

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

    return res.json({
      reply: aiReply,
      suggestions: []
    });

  } catch (error) {
    console.error("Chatbot error:", error);
    return res.status(500).json({
      message: "Failed to get AI response.",
      error: error.message
    });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only serve frontend if it exists (for local dev or monolithic build)
// On Render (backend only), this will be skipped if folder is missing
if (process.env.NODE_ENV === 'production') {
  // app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // app.get("*", (req, res) => {
  //   res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  // });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "API is running..." });
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
