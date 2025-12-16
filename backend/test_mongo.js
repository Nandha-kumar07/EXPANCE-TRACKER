import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const testConnection = async () => {
    try {
        console.log("Testing MongoDB connection...");
        console.log("URI:", process.env.MONGO_URI);

        await mongoose.connect(process.env.MONGO_URI);
        console.log(" MongoDB Connected Successfully!");

        
        const TestSchema = new mongoose.Schema({ test: String });
        const TestModel = mongoose.model("Test", TestSchema);

        const doc = await TestModel.create({ test: "Hello World" });
        console.log("Test document created:", doc);

        await TestModel.deleteOne({ _id: doc._id });
        console.log(" Test document deleted");

        process.exit(0);
    } catch (error) {
        console.error(" Error:", error.message);
        process.exit(1);
    }
};

testConnection();
