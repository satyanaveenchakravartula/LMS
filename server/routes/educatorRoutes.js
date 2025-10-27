import express from 'express';
import { addCourse, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, updateRoleToEducator } from '../controllers/educatorController.js';
import upload from '../configs/multer.js';
import { clerkAuth, protectEducator } from '../middlewares/authMiddleware.js';

const educatorRouter = express.Router();

// Add Educator Role (requires authentication but not educator role)
educatorRouter.get('/update-role', clerkAuth, updateRoleToEducator);

// Following routes require educator role
educatorRouter.post('/add-course', clerkAuth, protectEducator, upload.single('image'), addCourse);
educatorRouter.get('/courses', clerkAuth, protectEducator, getEducatorCourses);
educatorRouter.get('/dashboard', clerkAuth, protectEducator, educatorDashboardData);
educatorRouter.get('/enrolled-students', clerkAuth, protectEducator, getEnrolledStudentsData);

export default educatorRouter;