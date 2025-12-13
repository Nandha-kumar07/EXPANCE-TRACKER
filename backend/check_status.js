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

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await Transaction.countDocuments();
        console.log(`Transactions count: ${count}`);
        if (count > 0) {
            const txs = await Transaction.find().limit(5);
            console.log("Sample Data:", txs);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkData();
