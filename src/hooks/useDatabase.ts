import { useState, useEffect } from 'react';
import { database, DatabaseSettings } from '../database/localStorage';
import { Table, MenuItem } from '../types';

export const useDatabase = () => {
  const [settings, setSettings] = useState<DatabaseSettings | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    loadSettings();
    loadTables();
    loadMenuItems();
    loadCategories();
    loadOrderHistory();
  }, []);

  const loadSettings = () => {
    try {
      const dbSettings = database.getSettings();
      setSettings(dbSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadTables = () => {
    try {
      const dbTables = database.getTables();
      setTables(dbTables);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadMenuItems = () => {
    try {
      const dbMenuItems = database.getMenuItems();
      setMenuItems(dbMenuItems);
    } catch (error) {
      console.error('Error loading menu items:', error);
    }
  };

  const loadCategories = () => {
    try {
      const dbCategories = database.getCategories();
      setCategories(dbCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadOrderHistory = () => {
    try {
      const dbOrderHistory = database.getOrderHistory();
      const parsedHistory = dbOrderHistory.map(order => ({
        ...order,
        items: JSON.parse(order.items)
      }));
      setOrderHistory(parsedHistory);
    } catch (error) {
      console.error('Error loading order history:', error);
    }
  };

  // Settings methods
  const updateSettings = (newSettings: Partial<DatabaseSettings>) => {
    try {
      database.updateSettings(newSettings);
      loadSettings();
      // Also reload other data that might depend on settings
      loadTables();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  // Tables methods
  const addTable = (tableData: Omit<Table, 'id'>) => {
    try {
      database.addTable(tableData);
      loadTables();
    } catch (error) {
      console.error('Error adding table:', error);
    }
  };

  const updateTable = (table: Table) => {
    try {
      database.updateTable(table);
      loadTables();
    } catch (error) {
      console.error('Error updating table:', error);
    }
  };

  const deleteTable = (id: string) => {
    try {
      database.deleteTable(id);
      loadTables();
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  };

  // Menu items methods
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    try {
      database.addMenuItem(item);
      loadMenuItems();
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  const updateMenuItem = (item: MenuItem) => {
    try {
      database.updateMenuItem(item);
      loadMenuItems();
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const deleteMenuItem = (id: string) => {
    try {
      database.deleteMenuItem(id);
      loadMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  // Categories methods
  const addCategory = (name: string) => {
    try {
      database.addCategory(name);
      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const deleteCategory = (name: string) => {
    try {
      database.deleteCategory(name);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Order history methods
  const addOrderHistory = (order: any) => {
    try {
      database.addOrderHistory({
        ...order,
        items: JSON.stringify(order.items)
      });
      loadOrderHistory();
    } catch (error) {
      console.error('Error adding order history:', error);
    }
  };

  const clearOrderHistory = () => {
    try {
      database.clearOrderHistory();
      loadOrderHistory();
    } catch (error) {
      console.error('Error clearing order history:', error);
    }
  };

  return {
    // Data
    settings,
    tables,
    menuItems,
    categories,
    orderHistory,
    
    // Settings methods
    updateSettings,
    
    // Tables methods
    addTable,
    updateTable,
    deleteTable,
    
    // Menu items methods
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    
    // Categories methods
    addCategory,
    deleteCategory,
    
    // Order history methods
    addOrderHistory,
    clearOrderHistory,
    
    // Reload methods
    loadSettings,
    loadTables,
    loadMenuItems,
    loadCategories,
    loadOrderHistory
  };
};