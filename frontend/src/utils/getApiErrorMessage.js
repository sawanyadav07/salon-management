export const getApiErrorMessage = (error, fallback = 'Something went wrong') => {
  const data = error?.response?.data;
  if (!data) return fallback;

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((item) => item.message).join(' ');
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }

  return fallback;
};

