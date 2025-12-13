import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

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

// 🌐 Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log("🚀 Server updated with error logging and JWT_SECRET");
});
