import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const productSchema = new mongoose.Schema({
    title: String,
    price: Number,
    rawPrice: String,
    rating: Number,
    description: String,
    link: { type: String, unique: true },
    image: String,
    scrapedAt: { type: Date, default: Date.now }
});

//TODO: Optional: add index for faster queries on price and rating
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });

export const Product = mongoose.model("Product", productSchema);

export async function connectDB() {

    //TODO: Add your MongoDB connection string in .env file
    const { MONGODB_URI } = process.env;
    if (!MONGODB_URI) {
        console.error("Missing MONGODB_URI in environment variables");
        process.exit(1);
    }

    try {

        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB connected\n");
    } catch (err) {
        console.error("\nMongoDB connection error:", err.message);
        process.exit(1);
    }
}
