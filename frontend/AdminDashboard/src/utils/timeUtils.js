// Utility functions for Indian Standard Time (IST) and work hours calculations

/**
 * Convert UTC time to IST
 * @param {string|Date} utcTime - UTC time string or Date object
 * @returns {Date} IST time
 */
export const convertToIST = (utcTime) => {
  if (!utcTime) return null;
  
  const date = new Date(utcTime);
  
  // If the date is already in IST format (has timezone offset), return as is
  if (date.toString().includes('+05:30') || date.toString().includes('IST')) {
    return date;
  }
  
  // Convert to IST (UTC+5:30)
  return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
};

/**
 * Format time in IST
 * @param {string|Date} time - Time to format
 * @param {string} format - Format string ('time', 'date', 'datetime')
 * @returns {string} Formatted IST time
 */
export const formatISTTime = (time, format = 'time') => {
  if (!time) return 'N/A';
  
  const istTime = convertToIST(time);
  
  switch (format) {
    case 'time':
      return istTime.toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    case 'date':
      return istTime.toLocaleDateString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    case 'datetime':
      return istTime.toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    default:
      return istTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  }
};

/**
 * Get current IST time
 * @returns {Date} Current IST time
 */
export const getCurrentIST = () => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
};

/**
 * Format work hours and minutes
 * @param {number} hours - Hours
 * @param {number} minutes - Minutes
 * @returns {string} Formatted time string
 */
export const formatWorkTime = (hours, minutes) => {
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Calculate work duration between two times
 * @param {string|Date} startTime - Start time
 * @param {string|Date} endTime - End time
 * @returns {object} Object with hours and minutes
 */
export const calculateWorkDuration = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return { hours: 0, minutes: 0 };
  }
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  return {
    hours: Math.floor(diffMinutes / 60),
    minutes: diffMinutes % 60
  };
};

/**
 * Calculate overtime (assuming 9-hour standard work day)
 * @param {number} totalHours - Total work hours
 * @param {number} totalMinutes - Total work minutes
 * @returns {object} Object with overtime hours and minutes
 */
export const calculateOvertime = (totalHours, totalMinutes) => {
  const totalMinutesWorked = (totalHours * 60) + totalMinutes;
  const standardMinutes = 9 * 60; // 9 hours in minutes
  
  if (totalMinutesWorked <= standardMinutes) {
    return { hours: 0, minutes: 0 };
  }
  
  const overtimeMinutes = totalMinutesWorked - standardMinutes;
  return {
    hours: Math.floor(overtimeMinutes / 60),
    minutes: overtimeMinutes % 60
  };
};

/**
 * Get month name from month number
 * @param {number} month - Month number (1-12)
 * @returns {string} Month name
 */
export const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

/**
 * Get current month and year in IST
 * @returns {object} Object with current month and year
 */
export const getCurrentMonthYear = () => {
  const now = getCurrentIST();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
};

/**
 * Format date for API requests (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForAPI = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format timestamp for display with timezone info
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp string
 */
export const formatTimestampDisplay = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  const istTime = convertToIST(date);
  
  // Format: "22 Feb 2025, 19:27:34 IST"
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  return `${istTime.toLocaleDateString('en-IN', options)} IST`;
};

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatTimestampDisplay(timestamp);
};
