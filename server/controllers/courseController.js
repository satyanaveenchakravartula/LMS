import { v2 as cloudinary } from 'cloudinary';
import Course from '../models/Course.js';
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';
import { clerkClient } from '@clerk/express';

// Update user role to educator
export const updateRoleToEducator = async (req, res) => {
  try {
    const userId = req.auth.userId;
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: 'educator' },
    });
    res.json({ success: true, message: 'You can publish a course now' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Add new course
export const addCourse = async (req, res) => {
  try {
    const { courseData } = req.body;
    const imageFile = req.file;
    const educatorId = req.auth.userId;

    if (!imageFile) {
      return res.json({ success: false, message: 'Thumbnail Not Attached' });
    }

    const parsedCourseData = JSON.parse(courseData);
    parsedCourseData.educator = educatorId;

    const newCourse = await Course.create(parsedCourseData);
    const imageUpload = await cloudinary.uploader.upload(imageFile.path);

    newCourse.courseThumbnail = imageUpload.secure_url;
    await newCourse.save();

    res.json({ success: true, message: 'Course Added Successfully' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all published courses
export const getAllCourse = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).select([
      '-courseContent',
      '-enrolledStudents',
    ]);

    // Fetch educator details from Clerk for each course
    const coursesWithEducators = await Promise.all(
      courses.map(async (course) => {
        try {
          const educator = await clerkClient.users.getUser(course.educator);
          return {
            ...course.toObject(),
            educator: {
              id: educator.id,
              name: `${educator.firstName || ''} ${educator.lastName || ''}`.trim(),
              email: educator.emailAddresses[0]?.emailAddress || '',
              imageUrl: educator.imageUrl,
            },
          };
        } catch {
          return { ...course.toObject(), educator: null };
        }
      })
    );

    res.json({ success: true, courses: coursesWithEducators });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get a single course by ID
export const getCourseId = async (req, res) => {
  const { id } = req.params;
  try {
    const courseData = await Course.findById(id);
    if (!courseData) {
      return res.json({ success: false, message: 'Course not found' });
    }

    // Remove lectureUrl if isPreviewFree is false
    courseData.courseContent.forEach((chapter) => {
      chapter.chapterContent.forEach((lecture) => {
        if (!lecture.isPreviewFree) lecture.lectureUrl = '';
      });
    });

    // Fetch educator info from Clerk
    let educatorData = null;
    try {
      const educator = await clerkClient.users.getUser(courseData.educator);
      educatorData = {
        id: educator.id,
        name: `${educator.firstName || ''} ${educator.lastName || ''}`.trim(),
        email: educator.emailAddresses[0]?.emailAddress || '',
        imageUrl: educator.imageUrl,
      };
    } catch {
      educatorData = null;
    }

    res.json({ success: true, courseData, educator: educatorData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all courses by educator
export const getEducatorCourses = async (req, res) => {
  try {
    const educator = req.auth.userId;
    const courses = await Course.find({ educator });
    res.json({ success: true, courses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
