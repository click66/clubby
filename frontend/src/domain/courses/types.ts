export type Day = number

export interface Course {
    uuid: string
    label: string
    days: Day[]
    nextSession: Date
}

export interface NewCourse {
    label: string
    days: Day[]
}

export interface CourseFactory {
    makeCourse(data: any): Course
}
