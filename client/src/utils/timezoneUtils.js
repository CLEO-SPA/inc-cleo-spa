import { isValid, format, parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

export const getBrowserTimezone = () => {
  try {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // console.log(`Detected browser timezone: ${detectedTimezone}`);
    return detectedTimezone;
  } catch (e) {
    console.error('Error detecting browser timezone, falling back to UTC:', e);
    detectedTimezone = 'UTC';
    return detectedTimezone;
  }
};

const isUtcDateField = (key) => {
  if (typeof key !== 'string') return false;
  const lowerkey = key.toLowerCase();
  return lowerkey.endsWith('atutc') || lowerkey.endsWith('_utc');
};

const convertLocalToUtc = (localDateTime, localTimezone) => {
  if (!localDateTime || !localTimezone) return null;

  try {
    let dateToConvert;
    if (typeof localDateTime === 'string') {
      dateToConvert = localDateTime;
    } else if (localDateTime instanceof Date && isValid(localDateTime)) {
      dateToConvert = format(localDateTime, "yyyy-MM-dd'T'HH:mm:ss");
    } else {
      console.error('Invalid date format:', localDateTime);
      return null;
    }

    const utcDate = fromZonedTime(dateToConvert, localTimezone);

    if (!isValid(utcDate)) {
      console.error('Invalid UTC date:', utcDate);
      return null;
    }

    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting local date to UTC:', error);
    return null;
  }
};

const parseUTCISOToDate = (utcIsoString) => {
  if (typeof utcIsoString !== 'string') {
    if (utcIsoString instanceof Date && isValid(utcIsoString)) return utcIsoString;
    console.warn(`parseUTCISOToDate expected a string, received ${typeof utcIsoString}`);
    return null;
  }

  try {
    const dateObj = parseISO(utcIsoString);
    if (!isValid(dateObj)) {
      console.error(`Failed to parse UTC ISO string: "${utcIsoString}"`);
      return null;
    }
    return dateObj;
  } catch (error) {
    console.error('Error parsing UTC date string:', error);
    return null;
  }
};

export const transformRequestDates = (data, localDateTime) => {
  if (Array.isArray(data)) {
    return data.map((item) => transformRequestDates(item, localDateTime));
  }

  if (
    data !== null &&
    typeof data === 'object' &&
    !(data instanceof Date) &&
    !(data instanceof File || data instanceof Blob)
  ) {
    const copy = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (isUtcDateField(key)) {
          const utcIso = convertLocalToUtc(data[key], localDateTime);
          copy[key] = utcIso !== null ? utcIso : data[key];
        } else {
          copy[key] = transformRequestDates(data[key], localDateTime);
        }
      }
    }
    return copy;
  }
  return data;
};

export const transformResponseDates = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => transformResponseDates(item));
  }

  if (data !== null && typeof data === 'object') {
    const copy = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (isUtcDateField(key)) {
          const dateObj = parseUTCISOToDate(data[key]);
          copy[key] = dateObj !== null ? dateObj : data[key];
        } else {
          copy[key] = transformResponseDates(data[key]);
        }
      }
    }
    return copy;
  }
  return data;
};
