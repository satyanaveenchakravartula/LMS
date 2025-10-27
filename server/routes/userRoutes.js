// server/routes/userRoutes.js
import express from "express";
import {
  createOrUpdateUser,
  getUserData,
  purchaseCourse,
  userEnrolledCourses,
  updateUserCourseProgress,
  getUserCourseProgress,
  addUserRating,
} from "../controllers/userController.js";

import { requireAuth } from "@clerk/express";
import { clerkAuth } from "../middlewares/authMiddleware.js";

const userRouter = express.Router();

// Protect routes: first Clerk validate (requireAuth), then our clerkAuth attaches req.userId
userRouter.post("/create-update", requireAuth, clerkAuth, createOrUpdateUser);
userRouter.get("/data", requireAuth, clerkAuth, getUserData);
userRouter.post("/purchase", requireAuth, clerkAuth, purchaseCourse);
userRouter.get("/enrolled-courses", requireAuth, clerkAuth, userEnrolledCourses);
userRouter.post("/update-course-progress", requireAuth, clerkAuth, updateUserCourseProgress);
userRouter.post("/get-course-progress", requireAuth, clerkAuth, getUserCourseProgress);
userRouter.post("/add-rating", requireAuth, clerkAuth, addUserRating);

export default userRouter;
