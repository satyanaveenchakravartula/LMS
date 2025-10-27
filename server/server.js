import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import { stripeWebhooks } from "./controllers/webhooks.js";
import userRouter from "./routes/userRoutes.js";
import courseRouter from "./routes/courseRoute.js"

dotenv.config();

const app = express();

// ✅ Enable CORS for frontend communication
app.use(cors());

// ⚠️ Stripe webhook route (must come before express.json)
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// ✅ For all other routes, use JSON parser
app.use(express.json());

// ✅ Define API routes
app.use("/api/user", userRouter);
app.use("/api/course", courseRouter); // ✅ Added course route

// ✅ MongoDB Connection (simplified)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
