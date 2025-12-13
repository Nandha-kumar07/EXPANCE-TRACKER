import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

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
    },
    { timestamps: true }
);

const User = mongoose.model("User", new mongoose.Schema({ name: String, email: String }, { strict: false }));
const Transaction = mongoose.model("Transaction", transactionSchema);

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Find a user to assign transactions to
        const user = await User.findOne();
        if (!user) {
            console.error("No users found. Please signup via the app first, or create a user manually.");
            process.exit(1);
        }
        console.log(`Seeding data for user: ${user.email} (${user._id})`);

        const transactions = [
            {
                userId: user._id,
                type: 'income',
                amount: 5000,
                date: new Date(),
                category: 'Income',
                description: 'Salary'
            },
            {
                userId: user._id,
                type: 'expense',
                amount: 150,
                date: new Date(Date.now() - 86400000), // yesterday
                category: 'Groceries',
                description: 'Weekly groceries'
            },
            {
                userId: user._id,
                type: 'expense',
                amount: 60,
                date: new Date(Date.now() - 172800000), // 2 days ago
                category: 'Transport',
                description: 'Gas'
            },
            {
                userId: user._id,
                type: 'expense',
                amount: 200,
                date: new Date(Date.now() - 259200000), // 3 days ago
                category: 'Utilities',
                description: 'Electricity Bill'
            }
        ];

        await Transaction.insertMany(transactions);
        console.log("✅ Sample transactions added!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedData();
