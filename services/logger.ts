
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

interface DeviceInfo {
  userAgent: string;
  isMobile: boolean;
  browser: string;
}

const getBrowserInfo = (userAgent: string): string => {
  if (/chrome|crios|crmo/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent) && !/chrome|crios|crmo/i.test(userAgent)) return 'Safari';
  if (/firefox|fxios/i.test(userAgent)) return 'Firefox';
  if (/msie|trident/i.test(userAgent)) return 'IE';
  return 'Unknown';
};

const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { userAgent: 'SSR', isMobile: false, browser: 'Unknown' };
  }
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const browser = getBrowserInfo(userAgent);
  return { userAgent, isMobile, browser };
};

const log = (level: LogLevel, message: string, context: object = {}) => {
  const deviceInfo = getDeviceInfo();
  const timestamp = new Date().toISOString();
  const logObject = {
    timestamp,
    level,
    message,
    deviceInfo,
    ...context,
  };
  
  // Use structured logging for better diagnostics.
  switch (level) {
    case LogLevel.ERROR:
      console.error(JSON.stringify(logObject, null, 2));
      break;
    case LogLevel.WARN:
      console.warn(JSON.stringify(logObject, null, 2));
      break;
    default:
      console.log(JSON.stringify(logObject, null, 2));
  }
};

export const logger = {
  info: (message: string, context?: object) => log(LogLevel.INFO, message, context),
  warn: (message: string, context?: object) => log(LogLevel.WARN, message, context),
  error: (message: string, context?: object) => log(LogLevel.ERROR, message, context),
  debug: (message: string, context?: object) => log(LogLevel.DEBUG, message, context),
};
