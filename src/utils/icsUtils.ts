import { Task, TaskStatus } from '../types';

export const exportTasksToICS = (tasksToExport: Task[], contextName: string) => {
    if (tasksToExport.length === 0) return;
    const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    let icsLines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lahlah OS//Tasks//AR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];

    tasksToExport.forEach(task => {
        // Robust date parsing handling various formats
        const dateParts = task.date.split('-').map(Number);
        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];

        const [timePart, ampm] = (task.suggestedTime || "09:00 AM").split(' ');
        let [hours, minutes] = (timePart || "09:00").split(':').map(Number);

        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;

        // Month is 0-indexed in Date constructor
        const startDate = new Date(year, month - 1, day, hours || 9, minutes || 0);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration default

        const formatICSDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

        icsLines.push(
            "BEGIN:VEVENT",
            `UID:${task.id}@lahlahos.com`,
            `DTSTAMP:${stamp}`,
            `DTSTART:${formatICSDate(startDate)}`,
            `DTEND:${formatICSDate(endDate)}`,
            `SUMMARY:${task.title}`,
            `DESCRIPTION:${task.rationale ? task.rationale.replace(/\n/g, "\\n") : ''}`,
            `CATEGORIES:${task.category}`,
            `STATUS:${task.status === TaskStatus.DONE ? 'CONFIRMED' : 'TENTATIVE'}`,
            "END:VEVENT"
        );
    });

    icsLines.push("END:VCALENDAR");
    const blob = new Blob([icsLines.join("\r\n")], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Lahlah_OS_${contextName}_Tasks.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
