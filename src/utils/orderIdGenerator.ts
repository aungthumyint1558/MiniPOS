// Generate consistent order ID that can be used across table and order history  
export const generateOrderId = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2); // Use last 2 digits of year
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  // Format: ORD-ddmmyy-hhmmss-mmm (e.g., ORD-151224-143025-123)
  return `ORD-${day}${month}${year}-${hours}${minutes}${seconds}`;
};

// Generate table-specific order ID for consistency
export const generateTableOrderId = (tableNumber: number): string => {
  const baseId = generateOrderId();
  return `${baseId}-T${String(tableNumber).padStart(2, '0')}`;
};

// Extract order number from order ID for display
export const getOrderDisplayNumber = (orderId: string): string => {
  return orderId.replace('ORD-', '').replace(/-T\d+$/, '');
};