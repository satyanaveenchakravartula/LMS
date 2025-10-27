// controllers/webhooks.js

import dotenv from "dotenv";
dotenv.config(); // ✅ Load environment variables first

import mongoose from "mongoose";
import Stripe from "stripe"; // ✅ Correct import
import User from "../models/User.js";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";

// ✅ Initialize Stripe instance safely
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Stripe Webhook to handle payments and enrollments
export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Stripe webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const { purchaseId, userId, courseId } = session.metadata;

      try {
        const courseObjectId = new mongoose.Types.ObjectId(courseId);

        const purchaseData = await Purchase.findById(purchaseId);
        const userData = await User.findById(userId);
        const courseData = await Course.findById(courseObjectId);

        if (!purchaseData || !userData || !courseData) {
          console.log("⚠️ Missing purchase/user/course data");
          break;
        }

        // ✅ Add user to course (no duplicates)
        if (!courseData.enrolledStudents.includes(userData._id)) {
          courseData.enrolledStudents.push(userData._id);
          await courseData.save();
        }

        // ✅ Add course to user’s enrolled list (no duplicates)
        if (!userData.enrolledCourses.includes(courseObjectId)) {
          userData.enrolledCourses.push(courseObjectId);
          await userData.save();
        }

        // ✅ Mark purchase as completed
        purchaseData.status = "completed";
        await purchaseData.save();

        console.log(`✅ Enrollment completed for ${userData.email}`);
      } catch (error) {
        console.error("❌ Error during enrollment process:", error.message);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const sessionList = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { purchaseId } = sessionList.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId);

      if (purchaseData) {
        purchaseData.status = "failed";
        await purchaseData.save();
      }

      console.log("❌ Payment failed");
      break;
    }

    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};
