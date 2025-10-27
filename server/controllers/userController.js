import Course from "../models/Course.js";
import { CourseProgress } from "../models/CourseProgress.js";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";
import stripe from "stripe";

// ✅ Create or Update User
export const createOrUpdateUser = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.userId;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized user" });

    const { name, email, imageUrl } = req.body;

    let user = await User.findById(userId);
    if (user) {
      user.name = name;
      user.email = email;
      user.imageUrl = imageUrl;
      await user.save();
    } else {
      user = await User.create({
        _id: userId,
        name,
        email,
        imageUrl,
        enrolledCourses: [],
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Get User Data
export const getUserData = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized user" });

    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User Not Found" });

    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Purchase Course
export const purchaseCourse = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized user" });

    const { courseId } = req.body;
    const { origin } = req.headers;

    const courseData = await Course.findById(courseId);
    const userData = await User.findById(userId);

    if (!userData || !courseData) {
      return res.json({ success: false, message: "User or Course not found" });
    }

    const discountedPrice =
      courseData.coursePrice -
      (courseData.discount * courseData.coursePrice) / 100;

    const newPurchase = await Purchase.create({
      courseId: courseData._id,
      userId,
      amount: discountedPrice.toFixed(2),
      status: "pending",
    });

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const currency = process.env.CURRENCY?.toLowerCase() || "inr";

    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: courseData.courseTitle,
            description: courseData.courseDescription || "Course purchase",
          },
          unit_amount: Math.round(discountedPrice * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}/loading/my-enrollments`,
      cancel_url: `${origin}/`,
      metadata: {
        purchaseId: newPurchase._id.toString(),
        userId: userData._id.toString(),
        courseId: courseData._id.toString(),
      },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("Error in purchaseCourse:", error);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Get Enrolled Courses
export const userEnrolledCourses = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized user" });

    const userData = await User.findById(userId).populate("enrolledCourses");
    res.json({ success: true, enrolledCourses: userData.enrolledCourses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Update Course Progress
export const updateUserCourseProgress = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized user" });

    const { courseId, lectureId } = req.body;

    const progressData = await CourseProgress.findOne({ userId, courseId });

    if (progressData) {
      if (progressData.lectureCompleted.includes(lectureId)) {
        return res.json({ success: true, message: "Lecture Already Completed" });
      }
      progressData.lectureCompleted.push(lectureId);
      await progressData.save();
    } else {
      await CourseProgress.create({
        userId,
        courseId,
        lectureCompleted: [lectureId],
      });
    }

    res.json({ success: true, message: "Progress Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Get User Course Progress
export const getUserCourseProgress = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized user" });

    const { courseId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });
    res.json({ success: true, progressData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Add User Rating
export const addUserRating = async (req, res) => {
  try {
    const userId = req.auth?.userId || req.userId;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized user" });

    const { courseId, rating } = req.body;

    if (!courseId || !rating || rating < 1 || rating > 5) {
      return res.json({ success: false, message: "Invalid rating details" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.json({ success: false, message: "Course not found" });

    const user = await User.findById(userId);
    if (!user || !user.enrolledCourses.includes(courseId)) {
      return res.json({ success: false, message: "User has not enrolled in this course" });
    }

    const existingRatingIndex = course.courseRatings.findIndex(
      (r) => r.userId === userId
    );

    if (existingRatingIndex > -1) {
      course.courseRatings[existingRatingIndex].rating = rating;
    } else {
      course.courseRatings.push({ userId, rating });
    }

    await course.save();
    res.json({ success: true, message: "Rating added successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
