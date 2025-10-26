import express from 'express'
import { addUserRating, createOrUpdateUser, getUserCourseProgress, getUserData, purchaseCourse, updateUserCourseProgress, userEnrolledCourses } from '../controllers/userController.js';


const userRouter = express.Router()

// Create or update user
userRouter.post('/create-update', createOrUpdateUser)

// Get user Data
userRouter.get('/data', getUserData)
userRouter.post('/purchase', purchaseCourse)
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/update-course-progress', updateUserCourseProgress)
userRouter.post('/get-course-progress', getUserCourseProgress)
userRouter.post('/add-rating', addUserRating)

export default userRouter;