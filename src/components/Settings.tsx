import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Save, Bell, Shield, Globe, Printer, Download, Upload, Database, ImageIcon, Users, Plus, Edit, Trash2, X, User, Eye, EyeOff, Key } from 'lucide-react';
import { DatabaseSettings } from '../database/localStorage';
import { database } from '../database/localStorage';

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  roleId: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}

interface SettingsProps {
  settings: DatabaseSettings | null;
  onUpdateSettings: (settings: Partial<DatabaseSettings>) => void;
  users: User[];
  roles: UserRole[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  currentUserPermissions: string[];
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  onUpdateSettings, 
  users, 
  roles, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser,
  currentUserPermissions
}) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'users' | 'roles'>('general');
  
  // Available permissions
  const [permissions] = useState<Permission[]>([
    { id: 'pos_access', name: 'POS Access', description: 'Access to POS system and table management' },
    { id: 'pos_create_order', name: 'Create Orders', description: 'Create new orders for tables' },
    { id: 'pos_complete_order', name: 'Complete Orders', description: 'Complete and finalize orders' },
    { id: 'pos_cancel_order', name: 'Cancel Orders', description: 'Cancel existing orders' },
    { id: 'pos_print_order', name: 'Print Orders', description: 'Print order receipts' },
    { id: 'table_manage', name: 'Manage Tables', description: 'Add, edit, and delete tables' },
    { id: 'reports_view', name: 'View Reports', description: 'Access to reports and analytics' },
    { id: 'reports_export', name: 'Export Reports', description: 'Export reports to PDF/Excel' },
    { id: 'menu_view', name: 'View Menu', description: 'View menu items and categories' },
    { id: 'menu_manage', name: 'Manage Menu', description: 'Add, edit, and delete menu items' },
    { id: 'category_manage', name: 'Manage Categories', description: 'Add and delete menu categories' },
    { id: 'settings_view', name: 'View Settings', description: 'Access to settings page' },
    { id: 'settings_manage', name: 'Manage Settings', description: 'Modify system settings' },
    { id: 'user_manage', name: 'Manage Users', description: 'Add, edit, and delete users' },
    { id: 'role_manage', name: 'Manage Roles', description: 'Create and modify user roles' },
    { id: 'database_manage', name: 'Database Management', description: 'Export and import database' }
  ]);

  // Local state for role management (only for custom roles)
  const [customRoles, setCustomRoles] = useState<UserRole[]>([]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [newUser, setNewUser] = useState<Omit<User, 'id' | 'createdAt'>>({
    name: '',
    email: '',
    password: '',
    roleId: 'waiter',
    avatar: '',
    isActive: true
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [newRole, setNewRole] = useState<Omit<UserRole, 'id'>>({
    name: '',
    permissions: []
  });
  
  const [localSettings, setLocalSettings] = useState(settings || {
    id: 1,
    restaurantName: t('restaurantPOS'),
    description: t('professionalPOS'),
    logo: '',
    currency: 'MMK',
    taxRate: 8.5,
    serviceCharge: 0,
    serviceChargeEnabled: false,
    theme: 'light' as 'light' | 'dark',
    language: 'en',
  });

  // Check if user has permission
  const hasPermission = (permission: string) => {
    return currentUserPermissions.includes(permission);
  };

  // Get all roles (default + custom)
  const allRoles = [...roles, ...customRoles];

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes('jpeg') && !file.type.includes('jpg') && !file.type.includes('png') && !file.type.includes('svg')) {
      alert('Please upload only JPG, PNG, or SVG images.');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set fixed size for logo
        canvas.width = 120;
        canvas.height = 80;
        
        if (ctx) {
          // Draw image with fixed dimensions
          ctx.drawImage(img, 0, 0, 120, 80);
          
          // Convert to base64
          const resizedImageData = canvas.toDataURL('image/jpeg', 0.8);
          setLocalSettings({ ...localSettings, logo: resizedImageData });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUserAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes('jpeg') && !file.type.includes('jpg') && !file.type.includes('png')) {
      alert('Please upload only JPG or PNG images.');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set fixed size for avatar
        canvas.width = 100;
        canvas.height = 100;
        
        if (ctx) {
          // Draw image with fixed dimensions
          ctx.drawImage(img, 0, 0, 100, 100);
          
          // Convert to base64
          const resizedImageData = canvas.toDataURL('image/jpeg', 0.8);
          
          if (isEdit && editingUser) {
            setEditingUser({ ...editingUser, avatar: resizedImageData });
          } else {
            setNewUser({ ...newUser, avatar: resizedImageData });
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Please fill in all required fields.');
      return;
    }

    if (newUser.password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    // Check if email already exists
    if (users.some(user => user.email === newUser.email)) {
      alert('Email already exists. Please use a different email.');
      return;
    }

    const user = {
      ...newUser,
      createdAt: new Date().toISOString()
    };

    onAddUser(user);
    setNewUser({ name: '', email: '', password: '', roleId: 'waiter', avatar: '', isActive: true });
    setConfirmPassword('');
    setShowUserModal(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setConfirmPassword(user.password);
    setShowUserModal(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    if (!editingUser.name || !editingUser.email || !editingUser.password) {
      alert('Please fill in all required fields.');
      return;
    }

    if (editingUser.password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (editingUser.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    // Check if email already exists (excluding current user)
    if (users.some(user => user.email === editingUser.email && user.id !== editingUser.id)) {
      alert('Email already exists. Please use a different email.');
      return;
    }

    onUpdateUser(editingUser);
    setEditingUser(null);
    setConfirmPassword('');
    setShowUserModal(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (users.length === 1) {
      alert('Cannot delete the last user. At least one user must exist.');
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      onDeleteUser(userId);
    }
  };

  const handleAddRole = () => {
    if (!newRole.name) {
      alert('Please enter a role name.');
      return;
    }

    if (allRoles.some(role => role.name.toLowerCase() === newRole.name.toLowerCase())) {
      alert('Role name already exists. Please use a different name.');
      return;
    }

    const role: UserRole = {
      ...newRole,
      id: newRole.name.toLowerCase().replace(/\s+/g, '_')
    };

    setCustomRoles([...customRoles, role]);
    setNewRole({ name: '', permissions: [] });
    setShowRoleModal(false);
  };

  const handleEditRole = (role: UserRole) => {
    setEditingRole({ ...role });
    setShowRoleModal(true);
  };

  const handleUpdateRole = () => {
    if (!editingRole) return;

    if (!editingRole.name) {
      alert('Please enter a role name.');
      return;
    }

    // Check if role name already exists (excluding current role)
    if (allRoles.some(role => role.name.toLowerCase() === editingRole.name.toLowerCase() && role.id !== editingRole.id)) {
      alert('Role name already exists. Please use a different name.');
      return;
    }

    if (roles.some(r => r.id === editingRole.id)) {
      // Cannot edit default roles
      alert('Cannot edit default system roles.');
      return;
    }

    setCustomRoles(customRoles.map(role => 
      role.id === editingRole.id ? editingRole : role
    ));
    setEditingRole(null);
    setShowRoleModal(false);
  };

  const handleDeleteRole = (roleId: string) => {
    // Check if any users are using this role
    const usersWithRole = users.filter(user => user.roleId === roleId);
    if (usersWithRole.length > 0) {
      alert(`Cannot delete role. ${usersWithRole.length} user(s) are assigned to this role.`);
      return;
    }

    // Don't allow deleting default roles
    if (['admin', 'manager', 'cashier', 'waiter'].includes(roleId)) {
      alert('Cannot delete default system roles.');
      return;
    }

    if (confirm('Are you sure you want to delete this role?')) {
      setCustomRoles(customRoles.filter(role => role.id !== roleId));
    }
  };

  const toggleRolePermission = (roleId: string, permissionId: string) => {
    if (editingRole && editingRole.id === roleId) {
      const hasPermission = editingRole.permissions.includes(permissionId);
      if (hasPermission) {
        setEditingRole({
          ...editingRole,
          permissions: editingRole.permissions.filter(p => p !== permissionId)
        });
      } else {
        setEditingRole({
          ...editingRole,
          permissions: [...editingRole.permissions, permissionId]
        });
      }
    }
  };

  const toggleNewRolePermission = (permissionId: string) => {
    const hasPermission = newRole.permissions.includes(permissionId);
    if (hasPermission) {
      setNewRole({
        ...newRole,
        permissions: newRole.permissions.filter(p => p !== permissionId)
      });
    } else {
      setNewRole({
        ...newRole,
        permissions: [...newRole.permissions, permissionId]
      });
    }
  };

  const getRoleName = (roleId: string) => {
    const role = allRoles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  const handleSave = () => {
    // Update theme and language contexts
    setTheme(localSettings.theme);
    setLanguage(localSettings.language as 'en' | 'my');
    
    onUpdateSettings(localSettings);
    alert(t('settingsSaved'));
  };

  const handleExportDatabase = () => {
    try {
      // Get all data from localStorage
      const exportData = {
        settings: database.getSettings(),
        tables: database.getTables(),
        menuItems: database.getMenuItems(),
        categories: database.getCategories(),
        orderHistory: database.getOrderHistory(),
        users: users,
        roles: roles,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `restaurant-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      alert('Database exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export database. Please try again.');
    }
  };

  const handleImportDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('Please select a valid JSON file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        // Validate import data structure
        if (!importData.settings || !importData.tables || !importData.menuItems || !importData.categories) {
          alert('Invalid backup file format. Please select a valid restaurant POS backup file.');
          return;
        }

        // Confirm import
        const confirmed = window.confirm(
          'This will replace all current data with the imported data. Are you sure you want to continue?'
        );
        
        if (!confirmed) return;

        // Import data to localStorage
        localStorage.setItem('restaurant_pos_settings', JSON.stringify(importData.settings));
        localStorage.setItem('restaurant_pos_tables', JSON.stringify(importData.tables));
        localStorage.setItem('restaurant_pos_menuItems', JSON.stringify(importData.menuItems));
        localStorage.setItem('restaurant_pos_categories', JSON.stringify(importData.categories));
        
        if (importData.orderHistory) {
          localStorage.setItem('restaurant_pos_orderHistory', JSON.stringify(importData.orderHistory));
        }

        // Import users and roles if available
        if (importData.users) {
          setUsers(importData.users);
        }
        if (importData.roles) {
          setRoles(importData.roles);
        }

        alert('Database imported successfully! The page will reload to apply changes.');
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import database. Please check the file format and try again.');
      }
    };
    
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  if (!settings) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('settings')}</h2>
        <p className="text-gray-600">Configure your restaurant POS system</p>
      </div>

      {/* Settings Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveSettingsTab('general')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeSettingsTab === 'general'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {t('generalSettings')}
        </button>
        {hasPermission('user_manage') && (
          <button
            onClick={() => setActiveSettingsTab('users')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeSettingsTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {t('userManagement')}
          </button>
        )}
        {hasPermission('role_manage') && (
          <button
            onClick={() => setActiveSettingsTab('roles')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeSettingsTab === 'roles'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Roles & Permissions
          </button>
        )}
      </div>

      {activeSettingsTab === 'general' ? (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">{t('databaseManagement')}</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('exportDatabase')}</label>
              <p className="text-sm text-gray-600 mb-3">
                Download a backup of all your restaurant data including settings, tables, menu items, users, roles, and order history.
              </p>
              <button
                onClick={handleExportDatabase}
                className="w-full flex items-center justify-center px-4 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('exportDatabase')}
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('importDatabase')}</label>
              <p className="text-sm text-gray-600 mb-3">
                Restore your restaurant data from a previously exported backup file. This will replace all current data.
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportDatabase}
                  className="hidden"
                  id="database-import"
                />
                <label
                  htmlFor="database-import"
                  className="w-full flex items-center justify-center px-4 py-3 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('importDatabase')}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <Globe className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">{t('generalSettings')}</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('uploadLogo')}</label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <ImageIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-gray-600">Upload Logo (JPG/PNG/SVG, 120x80px, max 2MB)</span>
                </label>
                {localSettings.logo && (
                  <div className="flex items-center space-x-3">
                    <img
                      src={localSettings.logo}
                      alt="Logo Preview"
                      className="w-20 h-14 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => setLocalSettings({ ...localSettings, logo: '' })}
                      className="px-3 py-1 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('restaurantName')}</label>
              <input
                type="text"
                value={localSettings.restaurantName}
                onChange={(e) => setLocalSettings({ ...localSettings, restaurantName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
              <input
                type="text"
                value={localSettings.description || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('currency')}</label>
              <select
                value={localSettings.currency}
                onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MMK">MMK (K)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('taxRate')}</label>
              <input
                type="number"
                step="0.1"
                value={localSettings.taxRate}
                onChange={(e) => setLocalSettings({ ...localSettings, taxRate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('serviceChargeRate')}</label>
              <input
                type="number"
                step="0.1"
                value={localSettings.serviceCharge}
                onChange={(e) => setLocalSettings({ ...localSettings, serviceCharge: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localSettings.serviceChargeEnabled}
                  onChange={(e) => setLocalSettings({ ...localSettings, serviceChargeEnabled: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">{t('enableServiceCharge')}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">{t('preferences')}</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('theme')}</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={localSettings.theme === 'light'}
                    onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value as 'light' | 'dark' })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{t('light')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={localSettings.theme === 'dark'}
                    onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value as 'light' | 'dark' })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{t('dark')}</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('language')}</label>
              <select
                value={localSettings.language}
                onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="my">Myanmar</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Save className="h-4 w-4 mr-2" />
          {t('saveSettings')}
        </button>
      </div>
      </>
      ) : activeSettingsTab === 'users' ? (
        /* User Management Section */
        <div className="space-y-6">
          {/* Add User Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">{t('userManagement')}</h3>
            <button
              onClick={() => {
                setEditingUser(null);
                setNewUser({ name: '', email: '', password: '', roleId: 'waiter', avatar: '', isActive: true });
                setConfirmPassword('');
                setShowUserModal(true);
              }}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addUser')}
            </button>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6">
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border border-gray-300"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.roleId === 'admin' 
                              ? 'bg-red-100 text-red-800'
                              : user.roleId === 'manager'
                              ? 'bg-purple-100 text-purple-800'
                              : user.roleId === 'cashier'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {getRoleName(user.roleId)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              <h2 className="text-xl font-bold text-white">Roles ({allRoles.length})</h2>
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                {allRoles.map((role) => (
                  <div key={role.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      </div>
                    </div>
                        <h4 className="font-semibold text-gray-900">{role.name}</h4>
                      <button
                          {role.permissions.length} permissions assigned
                        className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditRole(role)}
                          disabled={['admin', 'manager', 'cashier', 'waiter'].includes(role.id)}
                          className="p-2 text-blue-600 hover:text-blue-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                          title={['admin', 'manager', 'cashier', 'waiter'].includes(role.id) ? 'Cannot edit default roles' : 'Edit role'}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={['admin', 'manager', 'cashier', 'waiter'].includes(role.id)}
                          className="p-2 text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                          title={['admin', 'manager', 'cashier', 'waiter'].includes(role.id) ? 'Cannot delete default roles' : 'Delete role'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {role.permissions.map(permissionId => {
                        const permission = permissions.find(p => p.id === permissionId);
                        return permission ? (
                          <span
                            key={permissionId}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {permission.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Roles & Permissions Section */
        <div className="space-y-6">
          {/* Add Role Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Roles & Permissions</h3>
            <button
              onClick={() => {
                setEditingRole(null);
                setNewRole({ name: '', permissions: [] });
                setShowRoleModal(true);
              }}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </button>
          </div>

          {/* Roles List */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6">
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{role.name}</h4>
                        <p className="text-sm text-gray-600">{role.permissions.length} permissions assigned</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditRole(role)}
                          className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={['admin', 'manager', 'cashier', 'waiter'].includes(role.id)}
                          className="p-2 text-red-600 hover:text-red-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map(permissionId => {
                        const permission = permissions.find(p => p.id === permissionId);
                        return permission ? (
                          <span
                            key={permissionId}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {permission.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? t('editUser') : t('addUser')}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    setConfirmPassword('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('userAvatar')}</label>
                  <div className="flex items-center space-x-4">
                    {(editingUser?.avatar || newUser.avatar) ? (
                      <img
                        src={editingUser?.avatar || newUser.avatar}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleUserAvatarUpload(e, !!editingUser)}
                        className="hidden"
                        id="user-avatar-upload"
                      />
                      <label
                        htmlFor="user-avatar-upload"
                        className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Upload Avatar
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('userName')}</label>
                  <input
                    type="text"
                    value={editingUser?.name || newUser.name}
                    onChange={(e) => {
                      if (editingUser) {
                        setEditingUser({ ...editingUser, name: e.target.value });
                      } else {
                        setNewUser({ ...newUser, name: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('userEmail')}</label>
                  <input
                    type="email"
                    value={editingUser?.email || newUser.email}
                    onChange={(e) => {
                      if (editingUser) {
                        setEditingUser({ ...editingUser, email: e.target.value });
                      } else {
                        setNewUser({ ...newUser, email: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editingUser?.password || newUser.password}
                      onChange={(e) => {
                        if (editingUser) {
                          setEditingUser({ ...editingUser, password: e.target.value });
                        } else {
                          setNewUser({ ...newUser, password: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('userRole')}</label>
                  <select
                    value={editingUser?.roleId || newUser.roleId}
                    onChange={(e) => {
                      if (editingUser) {
                        setEditingUser({ ...editingUser, roleId: e.target.value });
                      } else {
                        setNewUser({ ...newUser, roleId: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allRoles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingUser?.isActive ?? newUser.isActive}
                      onChange={(e) => {
                        if (editingUser) {
                          setEditingUser({ ...editingUser, isActive: e.target.checked });
                        } else {
                          setNewUser({ ...newUser, isActive: e.target.checked });
                        }
                      }}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active User</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={editingUser ? handleUpdateUser : handleAddUser}
                  className="flex-1 flex items-center justify-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingUser ? t('updateUser') : t('addUser')}
                </button>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    setConfirmPassword('');
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRole ? 'Edit Role' : 'Add Role'}
                </h3>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={editingRole?.name || newRole.name}
                    onChange={(e) => {
                      if (editingRole) {
                        setEditingRole({ ...editingRole, name: e.target.value });
                      } else {
                        setNewRole({ ...newRole, name: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter role name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {permissions.map(permission => (
                      <div key={permission.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          id={`permission-${permission.id}`}
                          checked={editingRole ? editingRole.permissions.includes(permission.id) : newRole.permissions.includes(permission.id)}
                          onChange={() => {
                            if (editingRole) {
                              toggleRolePermission(editingRole.id, permission.id);
                            } else {
                              toggleNewRolePermission(permission.id);
                            }
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <label htmlFor={`permission-${permission.id}`} className="text-sm font-medium text-gray-900 cursor-pointer">
                            {permission.name}
                          </label>
                          <p className="text-xs text-gray-600 mt-1">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={editingRole ? handleUpdateRole : handleAddRole}
                  className="flex-1 flex items-center justify-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingRole ? 'Update Role' : 'Add Role'}
                </button>
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;