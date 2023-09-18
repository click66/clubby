import { Link } from "react-router-dom"
import { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Course from "../models/Course"
import { XCircleFill } from "react-bootstrap-icons"
import { Form, Formik, Field } from "formik"
import confirmModal from "../components/ConfirmModal"
import { DtoNewCourse, addCourse, deleteCourse, fetchCourses } from "../services/courses"
import { notifyError, notifySuccess } from "../utils/notifications"


function Courses() {
    const [courses, setCourses] = useState<Course[]>([])
    const [addFormOpen, setAddFormOpen] = useState(false)

    const openAddForm = () => {
        setAddFormOpen(true)
    }

    const closeAddForm = () => {
        setAddFormOpen(false)
    }

    const fetchAndSetCourses = () => {
        fetchCourses().then(setCourses)
    }

    const submitNewCourse = (data: DtoNewCourse) => {
        addCourse(data).then((_) => {
            notifySuccess('New course added')
            fetchAndSetCourses()
            closeAddForm()
        }).catch(notifyError)
    }

    const deleteCourseAndRefresh = (_: React.MouseEvent, course: Course) => {
        confirmModal({
            title: 'Delete Course',
            body: 'Confirm removal of course? This will delete all attendance records and student registrations.',
            onConfirm: () => {
                deleteCourse(course).then(() => {
                    notifySuccess('Course deleted')
                    fetchAndSetCourses()
                }).catch(notifyError)
            },
        })
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const render_days = (numbs: number[]): string[] => {
        return numbs.map(num => days[num])
    }

    const formatDate = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit' };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    }

    useEffect(() => {
        fetchAndSetCourses();
    }, [])

    const SingleCourse = (course: Course) => (
        <div className="row mt-3" key={course.uuid}>
            <div className="col-sm-12 col-md-12 col-lg-12">
                <div className="report-link-container">
                    <Link className="rounded-3 text-dark bg-white p-3 report-link" to={`/attendance/${course.uuid}`}>
                        <div>
                            <span className="ps-3 title">{course.label}</span>
                            <span className="ps-3 description">{render_days(course.days).join(', ')}</span>
                            <span className="ps-3 description">{course.next_session ? `(Next session ${formatDate(course.next_session)})` : ''}</span>
                        </div>
                    </Link>
                    <>
                        <a href='#' onClick={(e) => deleteCourseAndRefresh(e, course)} className="report-button">
                            <XCircleFill />
                        </a>
                    </>
                </div>
            </div>
        </div>
    )

    const NewCourseForm = () => (
        <>
            <div className="mb-3 row">
                <div className="col-sm-12">
                    <Field className="form-control" type="text" name="label" placeholder="Course Name"></Field>
                </div>
            </div>
            <label>Run on days:</label>
            <div className="form-check">
                <Field className="form-check-input" type="checkbox" name="days" value="0" />
                <label className="form-check-label">Monday</label>
            </div>
            <div className="form-check">
                <Field className="form-check-input" type="checkbox" name="days" value="1" />
                <label className="form-check-label">Tuesday</label>
            </div>
            <div className="form-check">
                <Field className="form-check-input" type="checkbox" name="days" value="2" />
                <label className="form-check-label">Wednesday</label>
            </div>
            <div className="form-check">
                <Field className="form-check-input" type="checkbox" name="days" value="3" />
                <label className="form-check-label">Thursday</label>
            </div>
            <div className="form-check">
                <Field className="form-check-input" type="checkbox" name="days" value="4" />
                <label className="form-check-label">Friday</label>
            </div>
            <div className="form-check">
                <Field className="form-check-input" type="checkbox" name="days" value="5" />
                <label className="form-check-label">Saturday</label>
            </div>
            <div className="form-check">
                <Field className="form-check-input" type="checkbox" name="days" value="6" />
                <label className="form-check-label">Sunday</label>
            </div>
        </>
    )

    const NewCourseFormActions = (props: { isSubmitting: boolean }) => (
        <>
            <button type="submit" className="btn btn-primary" value="confirm" id="mdlCourse_submit" disabled={props.isSubmitting}>Confirm</button>
            <button type="button" onClick={closeAddForm} className="btn btn-secondary btn-cancel" id="mdlCourse_cancel">Cancel</button>
        </>
    )

    return (
        <>
            <h1>Courses</h1>
            <div className="container-lg">
                {courses.map(SingleCourse)}
                <div className="row mt-3">
                    <div className="col-sm-12 col-md-12 col-lg-12">
                        <a onClick={openAddForm} className="rounded-3 text-dark bg-white p-3 report-link">
                            <div className="text-center">+</div>
                        </a>
                    </div>
                </div>
            </div>
            <Modal
                show={addFormOpen}
                onHide={closeAddForm}
            >
                <Formik
                    initialValues={{
                        label: '',
                        days: [],
                    }}
                    onSubmit={submitNewCourse}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <Modal.Header closeButton>
                                <Modal.Title>Add New Course</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <NewCourseForm />
                            </Modal.Body>
                            <Modal.Footer>
                                <NewCourseFormActions isSubmitting={isSubmitting} />
                            </Modal.Footer>
                        </Form>
                    )}
                </Formik>
            </Modal>
        </>
    )
}

export default Courses
