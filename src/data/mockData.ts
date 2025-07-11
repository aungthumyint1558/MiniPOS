import { Table, MenuItem, Order, Staff } from '../types';

export const mockTables: Table[] = [
  { id: '1', number: 1, seats: 2, status: 'available' },
  { id: '2', number: 2, seats: 4, status: 'occupied', orderId: 'order-1' },
  { id: '3', number: 3, seats: 6, status: 'available' },
  { id: '4', number: 4, seats: 2, status: 'reserved', reservationTime: new Date(), customer: 'John Doe' },
  { id: '5', number: 5, seats: 4, status: 'available' },
  { id: '6', number: 6, seats: 8, status: 'occupied', orderId: 'order-2' },
  { id: '7', number: 7, seats: 2, status: 'available' },
  { id: '8', number: 8, seats: 4, status: 'reserved', reservationTime: new Date(), customer: 'Jane Smith' },
];

export const mockMenuItems: MenuItem[] = [
  { id: '1', name: 'Mohinga', price: 2500, category: 'Appetizers', description: 'Traditional fish noodle soup' },
  { id: '2', name: 'Samosa Thoke', price: 2000, category: 'Appetizers', description: 'Samosa salad with chickpeas' },
  { id: '3', name: 'Shan Noodles', price: 3500, category: 'Main Course', description: 'Traditional Shan style noodles' },
  { id: '4', name: 'Tea Leaf Salad', price: 2800, category: 'Appetizers', description: 'Traditional Myanmar tea leaf salad' },
  { id: '5', name: 'Coconut Rice', price: 1500, category: 'Main Course', description: 'Fragrant coconut rice with curry' },
  { id: '6', name: 'Myanmar Beer', price: 1200, category: 'Beverage', description: 'Local Myanmar beer' },
];

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    tableId: '2',
    items: [
      { id: '1', menuItem: mockMenuItems[0], quantity: 2, notes: 'Extra cheese' },
      { id: '2', menuItem: mockMenuItems[5], quantity: 2 },
    ],
    status: 'preparing',
    total: 47.96,
    createdAt: new Date(),
  },
  {
    id: 'order-2',
    tableId: '6',
    items: [
      { id: '3', menuItem: mockMenuItems[1], quantity: 1 },
      { id: '4', menuItem: mockMenuItems[2], quantity: 1 },
    ],
    status: 'ready',
    total: 37.98,
    createdAt: new Date(),
  },
];

export const mockStaff: Staff[] = [
  { id: '1', name: 'Administrator', role: 'admin', email: 'admin@restaurant.com' },
  { id: '2', name: 'John Manager', role: 'manager', email: 'manager@restaurant.com' },
  { id: '3', name: 'Sarah Waiter', role: 'waiter', email: 'waiter@restaurant.com' },
  { id: '4', name: 'Mike Chef', role: 'kitchen', email: 'kitchen@restaurant.com' },
];