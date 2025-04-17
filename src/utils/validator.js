export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isSlidingWindowViolated = (timestamps) => {
  const now = Date.now();
  const recent = timestamps.filter((t) => now - t < 1000);
  return recent.length >= 4;
};

export const isCustomerGiveUp = (timestamp) => {
  const now = Date.now();
  const lastClick = timestamp;

  if (now - lastClick >= 10000) return true;

  return false;
};
