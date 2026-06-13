const isProduction = () => process.env.NODE_ENV === 'production';

export const logDebug = (...args) => {
  if (!isProduction()) {
    console.log(...args);
  }
};

export const logError = (...args) => {
  console.error(...args);
};
