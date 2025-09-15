// Date utility functions for IST (Indian Standard Time)

/**
 * Get current date and time in IST
 * @param includeTime - Whether to include time in the result
 * @returns Date string in IST format
 */
export const getCurrentISTDate = (includeTime: boolean = true): string => {
    const now = new Date();

    // Convert to IST by using toLocaleString with IST timezone
    const istString = now.toLocaleString("sv-SE", {
        timeZone: "Asia/Kolkata",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    if (includeTime) {
        // Return in format: YYYY-MM-DDTHH:MM
        return istString.replace(' ', 'T').slice(0, 16);
    } else {
        // Return in format: YYYY-MM-DD
        return istString.slice(0, 10);
    }
};

/**
 * Get current month in IST format (YYYY-MM)
 * @returns Month string in YYYY-MM format
 */
export const getCurrentISTMonth = (): string => {
    const now = new Date();
    const istString = now.toLocaleString("sv-SE", {
        timeZone: "Asia/Kolkata",
        year: 'numeric',
        month: '2-digit'
    });
    return istString.slice(0, 7);
};

/**
 * Get current date in IST format (YYYY-MM-DD)
 * @returns Date string in YYYY-MM-DD format
 */
export const getCurrentISTDateOnly = (): string => {
    return getCurrentISTDate(false);
};

/**
 * Format a date string to IST locale format
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in IST
 */
export const formatDateToIST = (
    dateString: string,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }
): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        ...options,
        timeZone: 'Asia/Kolkata'
    });
};

/**
 * Format a date string to IST locale format with time
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in IST with time
 */
export const formatDateTimeToIST = (
    dateString: string,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }
): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        ...options,
        timeZone: 'Asia/Kolkata'
    });
};

/**
 * Get IST timezone offset in minutes
 * @returns Timezone offset in minutes
 */
export const getISTOffset = (): number => {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const ist = new Date(utc.getTime() + (5.5 * 3600000)); // IST is UTC+5:30
    return (ist.getTime() - now.getTime()) / 60000;
};
