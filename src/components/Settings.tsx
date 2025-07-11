import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Settings as SettingsIcon, 
  Save, 
  Upload, 
  Download, 
  Moon, 
  Sun, 
  Globe,
  User,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  Shield,
  Users,
  Key
} from 'lucide-react';
import { DatabaseSettings } from '../database/localStorage';

interface SettingsProps {
  settings: DatabaseSettings | null;
  onUpdateSettings: (settings: Partial<DatabaseSettings>) => void;
  users: Array<{ 
    id: string; 
    name: string; 
    email: string; 
    roleId: string; 
    password: string; 
    isActive: boolean;
    avatar?: string;
  }>;
  roles: Array<{ 
    id: string; 
    name: string; 
    permissions: string[];
    isSystem?: boolean;
  }>;
  onAddUser: (user: any) => void;
  onUpdateUser: (user: any) => void;
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
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<'general' | 'users' | 'roles'>('general');
  const [localSettings, setLocalSettings] = useState(settings || {});
  const logoInputRef = useRef<HTMLInputElement>(null);

  // User Management States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    roleId: '',
    password: '',
    confirmPassword: '',
    isActive: true,
    avatar: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Role Management States
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    permissions: [] as string[]
  });

  // Available permissions with descriptions
  const availablePermissions = [
    { id: 'pos_access', name: 'POS Access', description: 'Access to POS system' },
    { id: 'pos_create_order', name: 'Create Orders', description: 'Create new orders' },
    { id: 'pos_complete_order', name: 'Complete Orders', description: 'Complete and finalize orders' },
    { id: 'pos_cancel_order', name: 'Cancel Orders', description: 'Cancel existing orders' },
    { id: 'pos_print_order', name: 'Print Orders', description: 'Print order receipts' },
    { id: 'table_manage', name: 'Table Management', description: 'Add, edit, delete tables' },
    { id: 'reports_view', name: 'View Reports', description: 'Access reports and analytics' },
    { id: 'reports_export', name: 'Export Reports', description: 'Export reports to PDF/Excel' },
    { id: 'menu_view', name: 'View Menu', description: 'View menu items' },
    { id: 'menu_manage', name: 'Manage Menu', description: 'Add, edit, delete menu items' },
    { id: 'category_manage', name: 'Manage Categories', description: 'Add, edit, delete categories' },
    { id: 'settings_view', name: 'View Settings', description: 'Access settings page' },
    { id: 'settings_manage', name: 'Manage Settings', description: 'Modify system settings' },
    { id: 'user_manage', name: 'User Management', description: 'Add, edit, delete users' },
    { id: 'role_manage', name: 'Role Management', description: 'Create and manage roles' },
    { id: 'database_manage', name: 'Database Management', description: 'Export/import database' }
  ];

  const hasPermission = (permission: string) => {
    return currentUserPermissions.includes(permission);
  };

  const handleSettingsChange = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    alert(t('settingsSaved'));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
      alert('Please upload an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      handleSettingsChange('logo', result);
    };
    reader.readAsDataURL(file);
  };

  // User Management Functions
  const openUserModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        password: '',
        confirmPassword: '',
        isActive: user.isActive,
        avatar: user.avatar || ''
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        roleId: roles[0]?.id || '',
        password: '',
        confirmPassword: '',
        isActive: true,
        avatar: ''
      });
    }
    setShowUserModal(true);
  };

  const handleUserSubmit = () => {
    // Validation
    if (!userForm.name.trim()) {
      alert('Please enter user name');
      return;
    }
    if (!userForm.email.trim()) {
      alert('Please enter email address');
      return;
    }
    if (!userForm.roleId) {
      alert('Please select a role');
      return;
    }

    // Password validation for new users
    if (!editingUser) {
      if (!userForm.password) {
        alert('Please enter password');
        return;
      }
      if (userForm.password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
      if (userForm.password !== userForm.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
    }

    // Password validation for existing users (only if password is provided)
    if (editingUser && userForm.password) {
      if (userForm.password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
      if (userForm.password !== userForm.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
    }

    // Check email uniqueness
    const emailExists = users.some(u => 
      u.email.toLowerCase() === userForm.email.toLowerCase() && 
      u.id !== editingUser?.id
    );
    if (emailExists) {
      alert('Email address already exists');
      return;
    }

    const userData = {
      name: userForm.name.trim(),
      email: userForm.email.trim().toLowerCase(),
      roleId: userForm.roleId,
      isActive: userForm.isActive,
      avatar: userForm.avatar
    };

    if (editingUser) {
      // Update existing user
      const updatedUser = {
        ...editingUser,
        ...userData,
        // Only update password if provided
        ...(userForm.password && { password: userForm.password })
      };
      onUpdateUser(updatedUser);
    } else {
      // Add new user
      const newUser = {
        ...userData,
        password: userForm.password
      };
      onAddUser(newUser);
    }

    setShowUserModal(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      onDeleteUser(userId);
    }
  };

  // Role Management Functions
  const openRoleModal = (role?: any) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name,
        permissions: [...role.permissions]
      });
    } else {
      setEditingRole(null);
      setRoleForm({
        name: '',
        permissions: []
      });
    }
    setShowRoleModal(true);
  };

  const handleRoleSubmit = () => {
    if (!roleForm.name.trim()) {
      alert('Please enter role name');
      return;
    }
    if (roleForm.permissions.length === 0) {
      alert('Please select at least one permission');
      return;
    }

    // For now, just show alert as role management would need backend implementation
    alert('Role management feature will be implemented in the next update');
    setShowRoleModal(false);
  };

  const togglePermission = (permissionId: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  const sections = [
    { id: 'general', label: 'General Settings', icon: SettingsIcon },
    ...(hasPermission('user_manage') ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
    ...(hasPermission('role_manage') ? [{ id: 'roles', label: 'Roles & Permissions', icon: Shield }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white">{t('settings')}</h2>
          <p className="text-purple-100">Manage your restaurant settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id as any)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeSection === section.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeSection === 'general' && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Restaurant Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('restaurantName')}
                      </label>
                      <input
                        type="text"
                        value={localSettings.restaurantName || ''}
                        onChange={(e) => handleSettingsChange('restaurantName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={localSettings.description || ''}
                        onChange={(e) => handleSettingsChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Restaurant Logo
                    </label>
                    <div className="flex items-center space-x-4">
                      {localSettings.logo && (
                        <img
                          src={localSettings.logo}
                          alt="Restaurant Logo"
                          className="h-16 w-16 rounded-full object-cover border border-gray-300"
                        />
                      )}
                      <div>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="flex items-center px-4 py-2 text-sm text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {t('uploadLogo')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Financial Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('taxRate')}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={localSettings.taxRate || 0}
                        onChange={(e) => handleSettingsChange('taxRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Charge (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={localSettings.serviceCharge || 0}
                        onChange={(e) => handleSettingsChange('serviceCharge', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="serviceChargeEnabled"
                        checked={localSettings.serviceChargeEnabled || false}
                        onChange={(e) => handleSettingsChange('serviceChargeEnabled', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="serviceChargeEnabled" className="ml-2 text-sm text-gray-700">
                        Enable Service Charge
                      </label>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('language')}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'my')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="en">English</option>
                        <option value="my">မြန်မာ</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('theme')}
                      </label>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setTheme('light')}
                          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                            theme === 'light'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Sun className="h-4 w-4 mr-2" />
                          {t('light')}
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                            theme === 'dark'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Moon className="h-4 w-4 mr-2" />
                          {t('dark')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSaveSettings}
                      className="flex items-center px-6 py-3 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {t('saveSettings')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'users' && hasPermission('user_manage') && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                    <button
                      onClick={() => openUserModal()}
                      className="flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-gray-100">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-8 w-8 rounded-full object-cover mr-3"
                                  />
                                ) : (
                                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                    <User className="h-4 w-4 text-gray-600" />
                                  </div>
                                )}
                                <span className="font-medium text-gray-900">{user.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{user.email}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getRoleName(user.roleId)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openUserModal(user)}
                                  className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1 text-red-600 hover:text-red-700 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'roles' && hasPermission('role_manage') && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Roles & Permissions</h3>
                    <button
                      onClick={() => openRoleModal()}
                      className="flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Role
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {roles.map((role) => (
                      <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Shield className="h-5 w-5 text-blue-600 mr-2" />
                            <h4 className="font-semibold text-gray-900">{role.name}</h4>
                            {role.isSystem && (
                              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                System
                              </span>
                            )}
                          </div>
                          {!role.isSystem && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => openRoleModal(role)}
                                className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="mb-2">{role.permissions.length} permissions assigned</p>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((permission) => {
                              const perm = availablePermissions.find(p => p.id === permission);
                              return (
                                <span key={permission} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {perm?.name || permission}
                                </span>
                              );
                            })}
                            {role.permissions.length > 3 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                +{role.permissions.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Name
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter user name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Role
                  </label>
                  <select
                    value={userForm.roleId}
                    onChange={(e) => setUserForm(prev => ({ ...prev, roleId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Set Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={editingUser ? "Enter new password" : "Enter password"}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={userForm.confirmPassword}
                      onChange={(e) => setUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
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
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="userActive"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="userActive" className="ml-2 text-sm text-gray-700">
                    Active User
                  </label>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={handleUserSubmit}
                    className="flex-1 flex items-center justify-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingUser ? 'Update User' : 'Add User'}
                  </button>
                  <button
                    onClick={() => setShowUserModal(false)}
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

        {/* Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingRole ? 'Edit Role' : 'Add New Role'}
                  </h3>
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter role name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Assign Permissions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {availablePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-start">
                        <input
                          type="checkbox"
                          id={permission.id}
                          checked={roleForm.permissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                        />
                        <div className="ml-3">
                          <label htmlFor={permission.id} className="text-sm font-medium text-gray-700">
                            {permission.name}
                          </label>
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={handleRoleSubmit}
                    className="flex-1 flex items-center justify-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingRole ? 'Update Role' : 'Add Role'}
                  </button>
                  <button
                    onClick={() => setShowRoleModal(false)}
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
    </div>
  );
};

export default Settings;