import Course from "../models/Course.js"


// Get All Courses
export const getAllCourse = async (req, res) => {
    try {

        const courses = await Course.find({ isPublished: true })
            .select(['-courseContent', '-enrolledStudents'])
            .populate({ path: 'educator', select: '-password' })
        console.log(courses)
        res.json({ success: true, courses })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Get Course by Id
export const getCourseId = async (req, res) => {
    const { id } = req.params

    try {
        const courseData = await Course.findById(id)
            .populate({ 
                path: 'educator',
                select: 'name email' // Only select the fields we need
            })

        if (!courseData) {
            return res.json({ success: false, message: 'Course not found' })
        }

        // Remove lectureUrl if isPreviewFree is false
        courseData.courseContent.forEach(chapter => {
            chapter.chapterContent.forEach(lecture => {
                if (!lecture.isPreviewFree) {
                    lecture.lectureUrl = "";
                }
            });
        });

        res.json({ success: true, courseData })

    } catch (error) {
        console.error('Error fetching course:', error);
        res.json({ success: false, message: error.message })
    }
} 