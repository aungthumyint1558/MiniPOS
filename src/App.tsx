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
  const [currentUserPermissions, setCurrentUserPermissions] = useState<string[]>([]);

  // Default roles with permissions - moved to state so they can be managed
  const [roles, setRoles] = useState([
    {
      id: 'admin',
      name: 'Administrator',
      isSystem: true,
      permissions: [
        'pos_access', 'pos_create_order', 'pos_complete_order', 'pos_cancel_order', 'pos_print_order',
        'table_manage', 'reports_view', 'reports_export', 'menu_view', 'menu_manage', 'category_manage',
        'settings_view', 'settings_manage', 'user_manage', 'role_manage', 'database_manage'
      ]
    },
    {
      id: 'manager',
      name: 'Manager',
      isSystem: true,
      permissions: [
        'pos_access', 'pos_create_order', 'pos_complete_order', 'pos_cancel_order', 'pos_print_order',
        'table_manage', 'reports_view', 'reports_export', 'menu_view', 'menu_manage', 'category_manage',
        'settings_view', 'user_manage'
      ]
    },
    {
      id: 'cashier',
      name: 'Cashier',
      isSystem: true,
      permissions: [
        'pos_access', 'pos_create_order', 'pos_complete_order', 'pos_print_order',
        'reports_view', 'menu_view'
      ]
    },
    {
      id: 'waiter',
      name: 'Waiter',
      isSystem: true,
      permissions: [
        'pos_access', 'pos_create_order', 'menu_view'
      ]
    }
  ]);

  // Default users
  const [users, setUsers] = useState<any[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@restaurant.com',
      roleId: 'admin',
      password: 'admin',
      isActive: true
    },
    {
      id: '2',
      name: 'Cashier User',
      email: 'cashier@restaurant.com',
      roleId: 'cashier',
      password: 'cashier',
      isActive: true
    },
    {
      id: '3',
      name: 'Waiter User',
      email: 'waiter@restaurant.com',
      roleId: 'waiter',
      password: 'waiter',
      isActive: true
    }
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

  // Get user permissions based on role
  const getUserPermissions = (roleName: string) => {
    // Handle default admin login
    if (roleName === 'Admin') {
      const adminRole = roles.find(r => r.id === 'admin');
      return adminRole ? adminRole.permissions : [];
    }
    
    const role = roles.find(r => r.name === roleName || r.id === roleName.toLowerCase());
    return role ? role.permissions : [];
  };

  // Check if user has specific permission
  const hasPermission = (permission: string) => {
    return currentUserPermissions.includes(permission);
  };

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
      setCurrentUserPermissions([]);
      setActiveTab('pos');
    }
  };

  const handleLogin = (username: string, role: string) => {
    setCurrentUser(username);
    setCurrentUserRole(role);
    setCurrentUserPermissions(getUserPermissions(role));
    setIsLoggedIn(true);
  };

  // User management functions
  const handleAddUser = (newUser: any) => {
    const user = {
      ...newUser,
      id: Date.now().toString()
    };
    setUsers([...users, user]);
  };

  const handleUpdateUser = (updatedUser: any) => {
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  // Role management functions
  const handleAddRole = (newRole: any) => {
    const role = {
      ...newRole,
      id: Date.now().toString(),
      isSystem: false
    };
    setRoles([...roles, role]);
  };

  // Check if user has access to the current tab
  const hasAccessToTab = (tabId: string) => {
    // Admin has access to everything
    if (currentUserRole === 'Admin' || currentUserPermissions.length === 0) {
      return true;
    }
    
    switch (tabId) {
      case 'pos':
        return hasPermission('pos_access');
      case 'reports':
        return hasPermission('reports_view');
      case 'manage':
        return hasPermission('menu_view') || hasPermission('menu_manage');
      case 'settings':
        return hasPermission('settings_view') || hasPermission('settings_manage');
      default:
        return false;
    }
  };

  // Redirect if user doesn't have access to current tab
  React.useEffect(() => {
    if (isLoggedIn && !hasAccessToTab(activeTab)) {
      setActiveTab('pos');
    }
  }, [activeTab, currentUserRole]);

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} users={users} roles={roles} />;
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
        return <Reports tables={tables} orderHistory={orderHistory} onClearOrderHistory={clearOrderHistory} settings={settings} />;
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
        return (
          <Settings 
            settings={settings} 
            onUpdateSettings={updateSettings}
            users={users}
            roles={roles}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onAddRole={handleAddRole}
            currentUserPermissions={currentUserPermissions}
          />
        );
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
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} userPermissions={currentUserPermissions} />
      <main className="pb-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;