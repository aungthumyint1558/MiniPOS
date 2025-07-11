export const generateOrderId = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  
  // Get today's date string for localStorage key
  const dateKey = `${day}${month}${year}`;
  const storageKey = `order_counter_${dateKey}`;
  
  // Get current counter for today
  let counter = parseInt(localStorage.getItem(storageKey) || '0');
  counter += 1;
  
  // Save updated counter
  localStorage.setItem(storageKey, counter.toString());
  
  // Format: ddmmyy + counter (padded to 2 digits)
  const orderNumber = String(counter).padStart(2, '0');
  return `${dateKey}${orderNumber}`;
};