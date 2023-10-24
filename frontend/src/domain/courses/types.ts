export type Day = number

export interface Course {
    uuid: string
    label: string
    dates: Date[]
    days: Day[]
    nextSession: Date | null
}

export interface NewCourse {
    label: string
    days: Day[]
    dates: Date[]
}

export interface CourseFactory {
    makeCourse(data: any): Course
}
