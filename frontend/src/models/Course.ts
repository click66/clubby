export type CourseCollection = Map<string, Course>

export class Course {
    uuid: string
    label: string
    _days!: number[]
    nextSession?: Date

    constructor(props: { uuid: string, label: string, days: number[], next_session_date?: string }) {
        this.uuid = props.uuid
        this.label = props.label
        this.days = props.days

        if (props.next_session_date) {
            this.nextSession = new Date(props.next_session_date)
        }
    }

    get days(): number[] {
        return this._days
    }

    set days(indexes: number[]) {
        if (!indexes.every(num => num >= 0 && num <= 6)) {
            throw new RangeError('Invalid course date: number must be 0-6')
        }

        this._days = indexes
    }

    happensOnDay(dayNo: number) {
        return this.days.includes(dayNo)
    }
}
