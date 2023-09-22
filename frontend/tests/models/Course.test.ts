import { Course } from "../../src/models/Course"

describe('Course model', () => {
    test('UUID can be retrieved', () => {
        let uuid = '7fe20f85-c6b0-4c67-8b68-c033367c92a5';
        let sut = new Course({ uuid, label: 'My course', days: [] })
        expect(sut.uuid).toBe(uuid)
    })

    test('Label can be retrieved', () => {
        let uuid = '7fe20f85-c6b0-4c67-8b68-c033367c92a5';
        let sut = new Course({ uuid, label: 'My course', days: [] })
        expect(sut.label).toBe('My course')
    })

    test('Does not allow initialisation with invalid day indexes', () => {
        let uuid = '7fe20f85-c6b0-4c67-8b68-c033367c92a5';
        expect(() => {
            new Course({ uuid, label: 'My course', days: [0, 9] })
        }).toThrow(RangeError)
    })
})
