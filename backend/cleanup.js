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

const Transaction = mongoose.model("Transaction", transactionSchema);

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const allTx = await Transaction.find().sort({ createdAt: 1 });
        const seen = new Set();
        let deleted = 0;

        for (const tx of allTx) {
            // distinctive key: category + amount + formatted_date + type
            const key = `${tx.category}-${tx.amount}-${new Date(tx.date).toISOString().split('T')[0]}-${tx.type}`;
            if (seen.has(key)) {
                await Transaction.findByIdAndDelete(tx._id);
                deleted++;
                console.log(`Deleted duplicate: ${key}`);
            } else {
                seen.add(key);
            }
        }

        console.log(`✅ Cleanup complete. Removed ${deleted} duplicates.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

cleanup();
