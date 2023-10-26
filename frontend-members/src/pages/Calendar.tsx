function CalendarDate() {
    return (
        <>
            <h2 className="font-medium border-b py-2">October 9, 2023</h2>
            <ul className="mb-4">
                <li className="flex justify-between p-2">
                    <span className="grow">Adult Jiu Jitsu</span>
                    <span>1900-2100</span>
                    <button className="ml-2">Book</button>
                </li>
                <li className="flex justify-between p-2">
                    <span className="grow">Junior Jiu Jitsu</span>
                    <span>1900-2030</span>
                    <button className="ml-2">Book</button>
                </li>
            </ul>
        </>
    )
}

export default function Calendar() {
    return (
        <>
            <div className="w-full">
                <CalendarDate></CalendarDate>
                <CalendarDate></CalendarDate>
                <CalendarDate></CalendarDate>
                <CalendarDate></CalendarDate>
                <CalendarDate></CalendarDate>
                <CalendarDate></CalendarDate>
                <CalendarDate></CalendarDate>
                <CalendarDate></CalendarDate>
            </div>
        </>
    )
}
