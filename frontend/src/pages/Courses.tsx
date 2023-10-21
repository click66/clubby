import '../assets/Courses.page.scss'

import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { PlusCircleFill, XCircleFill } from 'react-bootstrap-icons'
import { Form, Formik, Field, ErrorMessage } from 'formik'
import confirmModal from '../components/ConfirmModal'
import { notifyError, notifySuccess } from '../utils/notifications'
import courses from '../domain/courses/provider'
import { Course, NewCourse } from '../domain/courses/types'

function Courses() {
    const [data, setData] = useState<Course[]>([])
    const [addFormOpen, setAddFormOpen] = useState(false)
    const [loaded, setLoaded] = useState(false)

    const openAddForm = () => {
        setAddFormOpen(true)
    }

    const closeAddForm = () => {
        setAddFormOpen(false)
    }

    const fetchAndSetCourses = () => courses.getCourses().then(setData)

    const submitNewCourse = (data: NewCourse) => courses.addCourse(data).then((_) => {
        notifySuccess('New course added')
        fetchAndSetCourses()
        closeAddForm()
    }).catch(notifyError)

    const deleteCourseAndRefresh = (_: React.MouseEvent, course: Course) => {
        confirmModal({
            title: 'Delete Course',
            body: 'Confirm removal of course? This will delete all attendance records and student registrations.',
            onConfirm: () => {
                courses.deleteCourse(course).then(() => {
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
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit' }
        return new Intl.DateTimeFormat('en-US', options).format(date)
    }

    useEffect(() => {
        fetchAndSetCourses().then(() => setLoaded(true)).catch(notifyError)
    }, [])

    const CoursePlaceholder = () => (
        <div className="text-light text-center">
            <p>No courses yet?</p>
            <p>Click the button below to create a course and begin organising your sessions.</p>
        </div>
    )

    const SingleCourse = (course: Course) => (
        <div className="row mt-3" key={course.uuid}>
            <div className="col-sm-12 col-md-12 col-lg-12">
                <div className="report-link-container">
                    <Link className="rounded-3 text-dark bg-white p-3 report-link" to={`/attendance/${course.uuid}`}>
                        <div>
                            <span className="ps-3 title">{course.label}</span>
                            <span className="ps-3 description">{course.days.length === 0 ? 'One-offo' : render_days(course.days).join(', ')}</span>
                            <span className="ps-3 description">{course.nextSession !== null ? `(Next session ${formatDate(course.nextSession)})` : ''}</span>
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

    const NewCourseFormActions = (props: { isSubmitting: boolean }) => (
        <>
            <button type="submit" className="btn btn-primary" value="confirm" id="mdlCourse_submit" disabled={props.isSubmitting}>Confirm</button>
            <button type="button" onClick={closeAddForm} className="btn btn-secondary btn-cancel" id="mdlCourse_cancel">Cancel</button>
        </>
    )

    return (
        <>
            <h1>Courses</h1>
            <div className={"container-lg coursesContainer bg-dark " + (!loaded ? "loading" : "")}>
                {data.length === 0 ? <CoursePlaceholder /> : ''}
                {data.map(SingleCourse)}
            </div>
            <div className="container-lg coursesFooter">
                <div className="row mt-3">
                    <div className="col-sm-12 col-md-12 col-lg-12">
                        <a onClick={openAddForm} className="rounded-3 text-dark bg-white p-3 report-link">
                            <div className="text-center"><PlusCircleFill /></div>
                        </a>
                    </div>
                </div>
            </div>
            <Modal
                show={addFormOpen}
                onHide={closeAddForm}
                centered
            >
                <Formik
                    initialValues={{
                        label: '',
                        type: 'oneoff',
                        days: [],
                        dates: [],
                    }}
                    validate={(values) => {
                        if (values.type === 'recurring' && values.days.length === 0) {
                            return {
                                days: 'Select at last one day'
                            }
                        }
                        return {}
                    }}
                    onSubmit={(data, { setSubmitting }) => submitNewCourse({
                        ...data,
                        dates: (Array.isArray(data.dates) ? data.dates : [data.dates]).map((d) => new Date(d)),
                    }).finally(() => setSubmitting(false))
                    }
                >
                    {({ errors, values, isSubmitting }) => (
                        <Form>
                            <Modal.Header closeButton>
                                <Modal.Title>Add New Course</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="mb-3 row">
                                    <label className="col-form-label col-sm-4">Course Name</label>
                                    <div className="col-sm-8">
                                        <Field autoFocus className="form-control" type="text" name="label" placeholder="Course Name"></Field>
                                    </div>
                                </div>
                                <div className="row">
                                    <label className="col-form-label col-sm-4">Course Schedule</label>
                                    <div className="col-sm-4 col-6">
                                        <div className="form-check">
                                            <Field id="radioCourseTypeOneOff" className="form-check-input" type="radio" name="type" value="oneoff" />
                                            <label htmlFor="radioCourseTypeOneOff" className="form-check-label">One-off</label>
                                        </div>
                                    </div>
                                    <div className="col-sm-4 col-6">
                                        <div className="form-check">
                                            <Field id="radioCourseTypeRecurring" className="form-check-input" type="radio" name="type" value="recurring" />
                                            <label htmlFor="radioCourseTypeRecurring" className="form-check-label">Recurring</label>
                                        </div>
                                    </div>
                                    <div className="col-sm-8 offset-sm-4">
                                        {values.type === 'recurring' ? (
                                            <>
                                                <div className={`${errors.days && 'is-invalid'}`}>
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
                                                </div>
                                                <ErrorMessage name="days" component="div" className="error invalid-feedback" />
                                            </>
                                        ) : (
                                            <>
                                                <Field className={`form-control ${errors.dates && 'is-invalid'}`} type="date" name="dates" validate={(value: string[]) => value.length === 0 ? 'Select a date for the one-off course' : null} />
                                                <ErrorMessage name="dates" component="div" className="error invalid-feedback" />
                                            </>
                                        )}
                                    </div>
                                </div>
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
