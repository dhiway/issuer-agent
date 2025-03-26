import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat"; // Needed for custom formats
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // Optional: for validation checks

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter); // If needed

export function parseAndFormatDate(dateInput: any): Date | null {
    if (!dateInput || typeof dateInput !== "string") {
        throw new Error(`Invalid date format: ${dateInput}`);
    }

    // Define supported formats
    const formats = ["YYYY-MM-DDTHH:mm:ss.SSS[Z]", "YYYY-MM-DD", "MM/DD/YYYY"];

    // Attempt to parse the input
    const date = dayjs(dateInput, formats, true).utc(); // Strict parsing with UTC

    if (!date.isValid()) {
        throw new Error(`Invalid date format: ${dateInput}`);
    }

    return date.toDate(); // Convert to JavaScript Date object
}
