const { format, parse, isValid } = require('date-fns');

/**
 * Converts a Date object or YYYY-MM-DD string to DD/MM/YYYY string for frontend
 * @param {Date|string} date - Date object or date string
 * @returns {string|null} - Formatted date string or null if invalid
 */
const formatDate = (date) => {
    if (!date) return null;

    try {
        // If it's already in DD/MM/YYYY format, return it
        if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            return date;
        }

        // If it's a string in YYYY-MM-DD format
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
            // Handle timezone offset by appending time if needed, or just split
            const [year, month, day] = date.split('T')[0].split('-');
            return `${day}/${month}/${year}`;
        }

        // If it's a Date object
        if (date instanceof Date) {
            if (!isValid(date)) return null;
            return format(date, 'dd/MM/yyyy');
        }

        return null;
    } catch (error) {
        console.error('Error formatting date:', error);
        return null;
    }
};

/**
 * Converts DD/MM/YYYY string to YYYY-MM-DD string for database
 * @param {string} dateString - Date string in DD/MM/YYYY format
 * @returns {string|null} - Date string in YYYY-MM-DD format or null
 */
const parseDate = (dateString) => {
    if (!dateString) return null;

    try {
        // If it's already in YYYY-MM-DD format, return it
        if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
            return dateString.split('T')[0];
        }

        // If it's in DD/MM/YYYY format
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('/');
            return `${year}-${month}-${day}`;
        }

        return null;
    } catch (error) {
        console.error('Error parsing date:', error);
        return null;
    }
};

/**
 * Returns today's date in YYYY-MM-DD format
 * @returns {string}
 */
const getTodayDB = () => {
    const today = new Date();
    return format(today, 'yyyy-MM-dd');
};

/**
 * Returns today's date in DD/MM/YYYY format
 * @returns {string}
 */
const getTodayFrontend = () => {
    const today = new Date();
    return format(today, 'dd/MM/yyyy');
};

module.exports = {
    formatDate,
    parseDate,
    getTodayDB,
    getTodayFrontend
};
