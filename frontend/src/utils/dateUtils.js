import { format, isToday, isYesterday, isThisYear, formatDistanceToNow } from 'date-fns';

/**
 * Formats a message timestamp nicely (e.g., '10:45 AM', 'Yesterday', 'Aug 14')
 */
export const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    }
    if (isThisYear(date)) {
      return format(date, 'MMM d, h:mm a');
    }
    return format(date, 'MMM d, yyyy, h:mm a');
  } catch {
    return '';
  }
};

/**
 * Formats a full date and time for info dialogs (e.g., 'Today at 4:54 PM' or 'Aug 14, 2026 at 4:54 PM')
 */
export const formatFullDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    if (isThisYear(date)) {
      return format(date, "MMM d 'at' h:mm a");
    }
    return format(date, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return '';
  }
};

/**
 * Compact time for sidebar conversation item
 */
export const formatSidebarTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    if (isThisYear(date)) {
      return format(date, 'MMM d');
    }
    return format(date, 'MM/dd/yy');
  } catch {
    return '';
  }
};

/**
 * Returns date separator label for message history grouping
 */
export const getDateSeparatorLabel = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    if (isToday(date)) {
      return 'Today';
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    if (isThisYear(date)) {
      return format(date, 'EEEE, MMMM d');
    }
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch {
    return '';
  }
};

/**
 * Relative timeago for user last seen (e.g. "5m ago")
 */
export const formatLastSeen = (dateString) => {
  if (!dateString) return 'Offline';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Offline';
    return `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`;
  } catch {
    return 'Offline';
  }
};
