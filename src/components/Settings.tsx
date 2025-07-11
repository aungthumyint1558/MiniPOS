import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Save, Bell, Shield, Globe, Printer, Download, Upload, Database, ImageIcon, Users, Plus, Edit, Trash2, X, User } from 'lucide-react';
import { DatabaseSettings } from '../database/localStorage';
import { database } from '../database/localStorage';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Cashier' | 'Waiter';
  avatar?: string;
  createdAt: string;
}

interface SettingsProps {
  settings: DatabaseSettings | null;
  onUpdateSettings: (settings: Partial<DatabaseSettings>) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings }) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'users'>('general');
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@restaurant.com',
      role: 'Admin',
      createdAt: new Date().toISOString()
    }
  ]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Omit<User, 'id' | 'createdAt'>>({
    name: '',
    email: '',
    role: 'Waiter',
    avatar: ''
  });
  
  const [localSettings, setLocalSettings] = useState(settings || {
    id: 1,
    restaurantName: t('restaurantPOS'),
    logo: '',
    currency: 'MMK',
    taxRate: 8.5,
    serviceCharge: 10,
    theme: 'light' as 'light' | 'dark',
    language: 'en',
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        
        // Set fixed size for logo
        canvas.width = 100;
        canvas.height = 100;
        
        if (ctx) {
          // Draw image with fixed dimensions
          ctx.drawImage(img, 0, 0, 100, 100);
          
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
        canvas.width = 80;
        canvas.height = 80;
        
        if (ctx) {
          // Draw image with fixed dimensions
          ctx.drawImage(img, 0, 0, 80, 80);
          
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
    if (!newUser.name || !newUser.email) {
      alert('Please fill in all required fields.');
      return;
    }

    const user: User = {
      ...newUser,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: 'Waiter', avatar: '' });
    setShowUserModal(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setShowUserModal(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    setUsers(users.map(user => 
      user.id === editingUser.id ? editingUser : user
    ));
    setEditingUser(null);
    setShowUserModal(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (users.length === 1) {
      alert('Cannot delete the last user. At least one user must exist.');
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
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
                Download a backup of all your restaurant data including settings, tables, menu items, and order history.
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
                  accept=".jpg,.jpeg,.png"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <ImageIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-gray-600">Upload Logo (JPG/PNG, max 2MB)</span>
                </label>
                {localSettings.logo && (
                  <div className="flex items-center space-x-3">
                    <img
                      src={localSettings.logo}
                      alt="Logo Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-300"
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
      ) : (
        /* User Management Section */
        <div className="space-y-6">
          {/* Add User Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">{t('userManagement')}</h3>
            <button
              onClick={() => {
                setEditingUser(null);
                setNewUser({ name: '', email: '', role: 'Waiter', avatar: '' });
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'Admin' 
                            ? 'bg-red-100 text-red-800'
                            : user.role === 'Cashier'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {t(user.role.toLowerCase())}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? t('editUser') : t('addUser')}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
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
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {t('uploadAvatar')}
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('userRole')}</label>
                  <select
                    value={editingUser?.role || newUser.role}
                    onChange={(e) => {
                      const role = e.target.value as 'Admin' | 'Cashier' | 'Waiter';
                      if (editingUser) {
                        setEditingUser({ ...editingUser, role });
                      } else {
                        setNewUser({ ...newUser, role });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Admin">{t('admin')}</option>
                    <option value="Cashier">{t('cashier')}</option>
                    <option value="Waiter">{t('waiter')}</option>
                  </select>
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
    </div>
  );
};

export default Settings;