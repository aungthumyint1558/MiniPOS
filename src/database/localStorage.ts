import { Table, MenuItem, OrderItem } from '../types';

// Database interface types
export interface DatabaseSettings {
  id: number;
  restaurantName: string;
  logo?: string;
  currency: string;
  taxRate: number;
  serviceCharge: number;
  serviceChargeEnabled: boolean;
  theme: 'light' | 'dark';
  language: string;
}

export interface DatabaseOrderHistory {
  id: string;
  tableNumber: number;
  customerName: string;
  orderDate: string;
  status: string;
  total: number;
  items: string; // JSON string
  createdAt: string;
}

class LocalStorageDatabase {
  private storageKeys = {
    settings: 'restaurant_pos_settings',
    tables: 'restaurant_pos_tables',
    menuItems: 'restaurant_pos_menu_items',
    categories: 'restaurant_pos_categories',
    orderHistory: 'restaurant_pos_order_history'
  };

  constructor() {
    this.initializeDatabase();
    console.log('LocalStorage database initialized');
  }

  private initializeDatabase() {
    this.insertDefaultData();
  }

  private insertDefaultData() {
    // Insert default settings if not exists
    if (!localStorage.getItem(this.storageKeys.settings)) {
      const defaultSettings: DatabaseSettings = {
        id: 1,
        restaurantName: 'Restaurant POS',
        currency: 'MMK',
        taxRate: 8.5,
        serviceCharge: 10,
        serviceChargeEnabled: true,
        notifications: true,
        autoBackup: true,
        printReceipts: true,
        language: 'en'
      };
      localStorage.setItem(this.storageKeys.settings, JSON.stringify(defaultSettings));
    }

    // Insert default categories if not exists
    if (!localStorage.getItem(this.storageKeys.categories)) {
      const categories = ['Appetizers', 'Main Course', 'Pasta', 'Pizza', 'Dessert', 'Beverage'];
      localStorage.setItem(this.storageKeys.categories, JSON.stringify(categories));
    }

    // Insert default tables if not exists
    if (!localStorage.getItem(this.storageKeys.tables)) {
      const defaultTables: Table[] = [
        { id: '1', number: 1, seats: 2, status: 'available', orderId: null, customer: null },
        { id: '2', number: 2, seats: 4, status: 'occupied', orderId: 'order-1', customer: null },
        { id: '3', number: 3, seats: 6, status: 'available', orderId: null, customer: null },
        { id: '4', number: 4, seats: 2, status: 'reserved', orderId: null, customer: 'John Doe' },
        { id: '5', number: 5, seats: 4, status: 'available', orderId: null, customer: null },
        { id: '6', number: 6, seats: 8, status: 'occupied', orderId: 'order-2', customer: null },
        { id: '7', number: 7, seats: 2, status: 'available', orderId: null, customer: null },
        { id: '8', number: 8, seats: 4, status: 'reserved', orderId: null, customer: 'Jane Smith' },
      ];
      localStorage.setItem(this.storageKeys.tables, JSON.stringify(defaultTables));
    }

    // Insert default menu items if not exists
    if (!localStorage.getItem(this.storageKeys.menuItems)) {
      const defaultMenuItems: MenuItem[] = [
        { id: '1', name: 'Mohinga', price: 2500, category: 'Appetizers', description: 'Traditional fish noodle soup' },
        { id: '2', name: 'Samosa Thoke', price: 2000, category: 'Appetizers', description: 'Samosa salad with chickpeas' },
        { id: '3', name: 'Shan Noodles', price: 3500, category: 'Main Course', description: 'Traditional Shan style noodles' },
        { id: '4', name: 'Tea Leaf Salad', price: 2800, category: 'Appetizers', description: 'Traditional Myanmar tea leaf salad' },
        { id: '5', name: 'Coconut Rice', price: 1500, category: 'Main Course', description: 'Fragrant coconut rice with curry' },
        { id: '6', name: 'Myanmar Beer', price: 1200, category: 'Beverage', description: 'Local Myanmar beer' },
      ];
      localStorage.setItem(this.storageKeys.menuItems, JSON.stringify(defaultMenuItems));
    }

    // Insert default order history if not exists
    if (!localStorage.getItem(this.storageKeys.orderHistory)) {
      const defaultOrderHistory = [
        {
          id: 'ORD001',
          tableNumber: 2,
          customerName: 'John Doe',
          orderDate: '2024-01-15',
          status: 'completed',
          total: 25000,
          items: JSON.stringify([{ id: '1', name: 'Mohinga', price: 2500, quantity: 2 }]),
          createdAt: new Date().toISOString()
        },
        {
          id: 'ORD002',
          tableNumber: 4,
          customerName: 'Jane Smith',
          orderDate: '2024-01-14',
          status: 'completed',
          total: 18500,
          items: JSON.stringify([{ id: '2', name: 'Samosa Thoke', price: 2000, quantity: 1 }]),
          createdAt: new Date().toISOString()
        },
        {
          id: 'ORD003',
          tableNumber: 1,
          customerName: 'Mike Johnson',
          orderDate: '2024-01-13',
          status: 'completed',
          total: 32000,
          items: JSON.stringify([{ id: '3', name: 'Shan Noodles', price: 3500, quantity: 1 }]),
          createdAt: new Date().toISOString()
        },
        {
          id: 'ORD004',
          tableNumber: 6,
          customerName: 'Sarah Wilson',
          orderDate: '2024-01-12',
          status: 'completed',
          total: 27500,
          items: JSON.stringify([{ id: '4', name: 'Tea Leaf Salad', price: 2800, quantity: 1 }]),
          createdAt: new Date().toISOString()
        },
        {
          id: 'ORD005',
          tableNumber: 3,
          customerName: 'David Brown',
          orderDate: '2024-01-11',
          status: 'completed',
          total: 21000,
          items: JSON.stringify([{ id: '5', name: 'Coconut Rice', price: 1500, quantity: 1 }]),
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.storageKeys.orderHistory, JSON.stringify(defaultOrderHistory));
    }
  }

  // Settings methods
  getSettings(): DatabaseSettings | null {
    try {
      const settings = localStorage.getItem(this.storageKeys.settings);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  }

  updateSettings(settings: Partial<DatabaseSettings>): void {
    try {
      const currentSettings = this.getSettings();
      if (currentSettings) {
        const updatedSettings = { ...currentSettings, ...settings };
        localStorage.setItem(this.storageKeys.settings, JSON.stringify(updatedSettings));
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }

  // Tables methods
  getTables(): Table[] {
    try {
      const tables = localStorage.getItem(this.storageKeys.tables);
      return tables ? JSON.parse(tables) : [];
    } catch (error) {
      console.error('Error getting tables:', error);
      return [];
    }
  }

  addTable(table: Omit<Table, 'id'>): Table {
    try {
      const tables = this.getTables();
      const id = Date.now().toString();
      const newTable: Table = { ...table, id };
      
      tables.push(newTable);
      localStorage.setItem(this.storageKeys.tables, JSON.stringify(tables));
      
      return newTable;
    } catch (error) {
      console.error('Error adding table:', error);
      throw error;
    }
  }

  updateTable(table: Table): void {
    try {
      const tables = this.getTables();
      const index = tables.findIndex(t => t.id === table.id);
      if (index !== -1) {
        tables[index] = table;
        localStorage.setItem(this.storageKeys.tables, JSON.stringify(tables));
      }
    } catch (error) {
      console.error('Error updating table:', error);
    }
  }

  deleteTable(id: string): void {
    try {
      const tables = this.getTables();
      const filteredTables = tables.filter(t => t.id !== id);
      localStorage.setItem(this.storageKeys.tables, JSON.stringify(filteredTables));
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  }

  // Categories methods
  getCategories(): string[] {
    try {
      const categories = localStorage.getItem(this.storageKeys.categories);
      return categories ? JSON.parse(categories) : [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  addCategory(name: string): void {
    try {
      const categories = this.getCategories();
      if (!categories.includes(name)) {
        categories.push(name);
        categories.sort();
        localStorage.setItem(this.storageKeys.categories, JSON.stringify(categories));
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  }

  deleteCategory(name: string): void {
    try {
      const categories = this.getCategories();
      const filteredCategories = categories.filter(cat => cat !== name);
      localStorage.setItem(this.storageKeys.categories, JSON.stringify(filteredCategories));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  }

  // Menu items methods
  getMenuItems(): MenuItem[] {
    try {
      const menuItems = localStorage.getItem(this.storageKeys.menuItems);
      return menuItems ? JSON.parse(menuItems) : [];
    } catch (error) {
      console.error('Error getting menu items:', error);
      return [];
    }
  }

  addMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    try {
      const menuItems = this.getMenuItems();
      const id = Date.now().toString();
      const newItem: MenuItem = { ...item, id };
      
      menuItems.push(newItem);
      localStorage.setItem(this.storageKeys.menuItems, JSON.stringify(menuItems));
      
      return newItem;
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  }

  updateMenuItem(item: MenuItem): void {
    try {
      const menuItems = this.getMenuItems();
      const index = menuItems.findIndex(i => i.id === item.id);
      if (index !== -1) {
        menuItems[index] = item;
        localStorage.setItem(this.storageKeys.menuItems, JSON.stringify(menuItems));
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  }

  deleteMenuItem(id: string): void {
    try {
      const menuItems = this.getMenuItems();
      const filteredItems = menuItems.filter(item => item.id !== id);
      localStorage.setItem(this.storageKeys.menuItems, JSON.stringify(filteredItems));
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  }

  // Order history methods
  getOrderHistory(): DatabaseOrderHistory[] {
    try {
      const orderHistory = localStorage.getItem(this.storageKeys.orderHistory);
      return orderHistory ? JSON.parse(orderHistory) : [];
    } catch (error) {
      console.error('Error getting order history:', error);
      return [];
    }
  }

  addOrderHistory(order: Omit<DatabaseOrderHistory, 'createdAt'>): void {
    try {
      const orderHistory = this.getOrderHistory();
      const newOrder = {
        ...order,
        createdAt: new Date().toISOString()
      };
      orderHistory.unshift(newOrder); // Add to beginning for newest first
      localStorage.setItem(this.storageKeys.orderHistory, JSON.stringify(orderHistory));
    } catch (error) {
      console.error('Error adding order history:', error);
    }
  }

  clearOrderHistory(): void {
    try {
      localStorage.setItem(this.storageKeys.orderHistory, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing order history:', error);
    }
  }
}

export const database = new LocalStorageDatabase();