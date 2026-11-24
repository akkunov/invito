const encoder = new TextEncoder();

function escapeText(value: string) {
  return value.replaceAll("\\", "\\\\").replace(/\r\n?|\n/g, "\\n").replace(/[,;]/g, "\\$&");
}

function foldLine(line: string) {
  let result = "";
  let bytes = 0;
  for (const char of line) {
    const length = encoder.encode(char).length;
    if (bytes + length > 75) {
      result += "\r\n ";
      bytes = 1;
    }
    result += char;
    bytes += length;
  }
  return result;
}

function calendarTimestamp(date: Date) {
  return date.toISOString().slice(0, 19).replace(/[-:]/g, "") + "Z";
}

export function weddingCalendar({id, instant, title, address, now = new Date()}: {
  id: string; instant: string; title: string; address: string; now?: Date;
}) {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Eventiq//Wedding invitation//EN",
    "BEGIN:VEVENT", "UID:" + escapeText(id) + "@eventiq",
    "DTSTAMP:" + calendarTimestamp(now), "DTSTART:" + calendarTimestamp(new Date(instant)),
    "SUMMARY:" + escapeText(title), ...(address ? ["LOCATION:" + escapeText(address)] : []),
    "END:VEVENT", "END:VCALENDAR",
  ].map(foldLine).join("\r\n") + "\r\n";
}
