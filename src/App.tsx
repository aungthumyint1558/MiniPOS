import React, { useState } from 'react';
import { useTheme } from './contexts/ThemeContext';
import { useLanguage } from './contexts/LanguageContext';
import { useDatabase } from './hooks/useDatabase';
import { generateOrderId, generateTableOrderId } from './utils/orderIdGenerator';
import Login from './components/Login';
import Header from './components/Header';
import NavigationTabs from './components/NavigationTabs';
import TableManagement from './components/TableManagement';
import Reports from './components/Reports';
import ManageSection from './components/ManageSection';
import Settings from './components/Settings';
import { Table, MenuItem, OrderItem } from './types';

function App() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('pos');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [users] = useState([
    { name: 'Admin User', email: 'admin@restaurant.com', role: 'Admin', password: 'admin' },
    { name: 'Cashier User', email: 'cashier@restaurant.com', role: 'Cashier', password: 'cashier123' },
    { name: 'Waiter User', email: 'waiter@restaurant.com', role: 'Waiter', password: 'waiter123' }
  ]);

  const {
    settings,
    tables,
    menuItems,
    categories,
    orderHistory,
    updateSettings,
    addTable,
    updateTable,
    deleteTable,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategory,
    deleteCategory,
    addOrderHistory,
    clearOrderHistory
  } = useDatabase();

  const handleUpdateTable = (updatedTable: Table) => {
    updateTable(updatedTable);
  };

  const handleDeleteTable = (tableId: string) => {
    deleteTable(tableId);
  };

  const handleAddTable = () => {
    const existingNumbers = tables.map(t => t.number);
    const newNumber = Math.max(...existingNumbers, 0) + 1;
    
    const newTableData = {
      number: newNumber,
      seats: 4,
      status: 'available' as const,
    };
    addTable(newTableData);
  };

  const handleUpdateMenuItem = (updatedItem: MenuItem) => {
    updateMenuItem(updatedItem);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    deleteMenuItem(itemId);
  };

  const handleAddMenuItem = (newItem: Omit<MenuItem, 'id'>) => {
    addMenuItem(newItem);
  };

  const handleCompleteOrder = (tableId: string, orderItems: OrderItem[], total: number) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      // Add to order history
      const orderData = {
        id: table.orderId || generateTableOrderId(table.number),
        tableNumber: table.number,
        customerName: table.customer || 'Walk-in Customer',
        orderDate: new Date().toISOString().split('T')[0],
        status: 'completed',
        total: total,
        items: orderItems.map(item => ({
          id: item.id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity
        }))
      };
      
      addOrderHistory(orderData);
      
      // Free the table
      handleUpdateTable({ 
        ...table, 
        status: 'available', 
        customer: undefined, 
        orderId: undefined,
        orderItems: undefined,
        orderTotal: undefined
      });
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      setIsLoggedIn(false);
      setCurrentUser('');
      setCurrentUserRole('');
      setActiveTab('pos');
    }
  };

  const handleLogin = (username: string, role: string) => {
    setCurrentUser(username);
    setCurrentUserRole(role);
    setIsLoggedIn(true);
  };

  // Check if user has access to the current tab
  const hasAccessToTab = (tabId: string) => {
    switch (currentUserRole) {
      case 'Admin':
        return true;
      case 'Cashier':
        return ['pos', 'reports'].includes(tabId);
      case 'Waiter':
        return tabId === 'pos';
      default:
        return tabId === 'pos';
    }
  };

  // Redirect if user doesn't have access to current tab
  React.useEffect(() => {
    if (!hasAccessToTab(activeTab)) {
      setActiveTab('pos');
    }
  }, [activeTab, currentUserRole]);

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'pos':
        return (
          <TableManagement
            tables={tables}
            menuItems={menuItems}
            onUpdateTable={handleUpdateTable}
            onDeleteTable={handleDeleteTable}
            onAddTable={handleAddTable}
            serviceChargeRate={settings?.serviceCharge || 10}
            serviceChargeEnabled={settings?.serviceChargeEnabled ?? true}
            taxRate={settings?.taxRate || 8.5}
            onCompleteOrder={handleCompleteOrder}
            settings={settings}
          />
        );
      case 'reports':
        return <Reports tables={tables} orderHistory={orderHistory} onClearOrderHistory={clearOrderHistory} />;
      case 'manage':
        return (
          <ManageSection
            menuItems={menuItems}
            categories={categories}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
            onAddMenuItem={handleAddMenuItem}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
          />
        );
      case 'settings':
        return <Settings settings={settings} onUpdateSettings={updateSettings} />;
      default:
        return (
          <TableManagement
            tables={tables}
            menuItems={menuItems}
            onUpdateTable={handleUpdateTable}
            onDeleteTable={handleDeleteTable}
            serviceChargeRate={settings?.serviceCharge || 10}
            serviceChargeEnabled={settings?.serviceChargeEnabled ?? true}
            taxRate={settings?.taxRate || 8.5}
            onCompleteOrder={handleCompleteOrder}
            settings={settings}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${theme}`}>
      <Header
        currentUser={currentUser}
        currentUserRole={currentUserRole}
        onLogout={handleLogout}
        settings={settings}
      />
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} userRole={currentUserRole} />
      <main className="pb-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;