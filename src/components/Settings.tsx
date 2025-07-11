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
  DollarSign,
  Percent,
  Building,
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import { DatabaseSettings } from '../database/localStorage';

interface SettingsProps {
  settings: DatabaseSettings | null;
  onUpdateSettings: (settings: Partial<DatabaseSettings>) => void;
  users: any[];
  roles: any[];
  onAddUser: (user: any) => void;
  onUpdateUser: (user: any) => void;
  onDeleteUser: (userId: string) => void;
  onAddRole: (role: any) => void;
  onUpdateRole: (role: any) => void;
  onDeleteRole: (roleId: string) => void;
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
  onAddRole,
  onUpdateRole,
  onDeleteRole,
  currentUserPermissions
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<'general' | 'users' | 'roles' | 'email'>('general');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    restaurantName: settings?.restaurantName || 'Restaurant POS',
    description: settings?.description || 'Professional Point of Sale System',
    currency: settings?.currency || 'MMK',
    taxRate: settings?.taxRate || 8.5,
    serviceCharge: settings?.serviceCharge || 0,
    serviceChargeEnabled: settings?.serviceChargeEnabled || false,
    logo: settings?.logo || ''
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'Restaurant POS',
    enableTLS: true,
    testEmail: ''
  });

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    roleId: 'waiter',
    password: '',
    confirmPassword: '',
    isActive: true
  });

  const [newRole, setNewRole] = useState({
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
    { id: 'table_manage', name: 'Table Management', description: 'Manage restaurant tables' },
    { id: 'reports_view', name: 'View Reports', description: 'View sales and analytics reports' },
    { id: 'reports_export', name: 'Export Reports', description: 'Export reports to PDF/Excel' },
    { id: 'menu_view', name: 'View Menu', description: 'View menu items and categories' },
    { id: 'menu_manage', name: 'Manage Menu', description: 'Add, edit, delete menu items' },
    { id: 'category_manage', name: 'Manage Categories', description: 'Manage menu categories' },
    { id: 'settings_view', name: 'View Settings', description: 'View system settings' },
    { id: 'settings_manage', name: 'Manage Settings', description: 'Modify system settings' },
    { id: 'user_manage', name: 'User Management', description: 'Manage user accounts' },
    { id: 'role_manage', name: 'Role Management', description: 'Manage user roles and permissions' },
    { id: 'database_manage', name: 'Database Management', description: 'Export/import database' }
  ];

  const hasPermission = (permission: string) => {
    return currentUserPermissions.includes(permission) || currentUserPermissions.length === 0;
  };

  const handleSaveSettings = () => {
    onUpdateSettings(formData);
    alert(t('settingsSaved'));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image')) {
      alert('Please upload an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const maxSize = 200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedImageData = canvas.toDataURL('image/jpeg', 0.8);
          setFormData({ ...formData, logo: resizedImageData });
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

    if (newUser.password !== newUser.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (users.some(user => user.email === newUser.email)) {
      alert('Email already exists.');
      return;
    }

    onAddUser({
      name: newUser.name,
      email: newUser.email,
      roleId: newUser.roleId,
      password: newUser.password,
      isActive: newUser.isActive
    });

    setNewUser({
      name: '',
      email: '',
      roleId: 'waiter',
      password: '',
      confirmPassword: '',
      isActive: true
    });
    setShowUserModal(false);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      password: '',
      confirmPassword: '',
      isActive: user.isActive
    });
    setShowUserModal(true);
  };

  const handleUpdateUser = () => {
    if (!newUser.name || !newUser.email) {
      alert('Please fill in all required fields.');
      return;
    }

    if (newUser.password && newUser.password !== newUser.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    const updatedUser = {
      ...editingUser,
      name: newUser.name,
      email: newUser.email,
      roleId: newUser.roleId,
      isActive: newUser.isActive
    };

    if (newUser.password) {
      updatedUser.password = newUser.password;
    }

    onUpdateUser(updatedUser);
    setEditingUser(null);
    setShowUserModal(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      onDeleteUser(userId);
    }
  };

  const handleAddRole = () => {
    if (!newRole.name.trim()) {
      alert('Please enter a role name.');
      return;
    }

    if (roles.some(role => role.name.toLowerCase() === newRole.name.toLowerCase())) {
      alert('Role name already exists.');
      return;
    }

    if (newRole.permissions.length === 0) {
      alert('Please select at least one permission.');
      return;
    }

    onAddRole({
      name: newRole.name,
      permissions: newRole.permissions
    });

    setNewRole({ name: '', permissions: [] });
    setShowRoleModal(false);
  };

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setNewRole({
      name: role.name,
      permissions: [...role.permissions]
    });
    setShowRoleModal(true);
  };

  const handleUpdateRole = () => {
    if (!newRole.name.trim()) {
      alert('Please enter a role name.');
      return;
    }

    if (newRole.permissions.length === 0) {
      alert('Please select at least one permission.');
      return;
    }

    const updatedRole = {
      ...editingRole,
      name: newRole.name,
      permissions: newRole.permissions
    };

    onUpdateRole(updatedRole);
    setEditingRole(null);
    setShowRoleModal(false);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    if (role.isSystem) {
      alert('Cannot delete system roles.');
      return;
    }

    const usersWithRole = users.filter(user => user.roleId === roleId);
    if (usersWithRole.length > 0) {
      alert(`Cannot delete role "${role.name}" because it is assigned to ${usersWithRole.length} user(s).`);
      return;
    }

    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      onDeleteRole(roleId);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    const updatedPermissions = newRole.permissions.includes(permissionId)
      ? newRole.permissions.filter(p => p !== permissionId)
      : [...newRole.permissions, permissionId];
    
    setNewRole({ ...newRole, permissions: updatedPermissions });
  };

  const handleSendTestEmail = async () => {
    if (!emailSettings.smtpServer || !emailSettings.smtpUsername || !emailSettings.smtpPassword || !emailSettings.testEmail) {
      alert('Please fill in all SMTP settings and test email address.');
      return;
    }

    setIsTestingEmail(true);
    setEmailTestResult(null);

    try {
      // In a real application, this would make an API call to your backend
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...emailSettings,
          subject: 'Test Email from Restaurant POS',
          message: 'This is a test email to verify your SMTP configuration is working correctly.'
        }),
      });

      const result = await response.json();
      setEmailTestResult(result);
    } catch (error) {
      // Since this is a frontend-only app, show instructions for backend setup
      setEmailTestResult({
        success: false,
        message: 'Email functionality requires a backend server. This is a frontend-only demo. To enable real email sending, you need to:\n\n1. Set up a Node.js backend server\n2. Install nodemailer: npm install nodemailer\n3. Create an API endpoint at /api/send-test-email\n4. Configure your SMTP settings\n\nFor Gmail: Use App Passwords instead of your regular password.'
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg p-6">
          <h3 className="text-xl font-bold text-white">{t('generalSettings')}</h3>
          <p className="text-blue-100">Configure your restaurant information and preferences</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-2" />
                {t('restaurantName')}
              </label>
              <input
                type="text"
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-2" />
                {t('currency')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MMK">Myanmar Kyat (MMK)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="THB">Thai Baht (THB)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="h-4 w-4 inline mr-2" />
                {t('taxRate')}
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="h-4 w-4 inline mr-2" />
                {t('serviceChargeRate')}
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.serviceCharge}
                onChange={(e) => setFormData({ ...formData, serviceCharge: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="serviceChargeEnabled"
              checked={formData.serviceChargeEnabled}
              onChange={(e) => setFormData({ ...formData, serviceChargeEnabled: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="serviceChargeEnabled" className="text-sm font-medium text-gray-700">
              {t('enableServiceCharge')}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('uploadLogo')}
            </label>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </button>
              {formData.logo && (
                <img
                  src={formData.logo}
                  alt="Logo preview"
                  className="h-12 w-12 object-cover rounded-lg border border-gray-300"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="h-4 w-4 inline mr-2" />
                {t('language')}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'my')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="my">Myanmar (မြန်မာ)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {theme === 'light' ? <Sun className="h-4 w-4 inline mr-2" /> : <Moon className="h-4 w-4 inline mr-2" />}
                {t('theme')}
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">{t('light')}</option>
                <option value="dark">{t('dark')}</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full flex items-center justify-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="h-5 w-5 mr-2" />
            {t('saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{t('userManagement')}</h3>
              <p className="text-green-100">Manage user accounts and access</p>
            </div>
            <button
              onClick={() => {
                setEditingUser(null);
                setNewUser({
                  name: '',
                  email: '',
                  roleId: 'waiter',
                  password: '',
                  confirmPassword: '',
                  isActive: true
                });
                setShowUserModal(true);
              }}
              className="flex items-center px-4 py-2 text-green-100 bg-green-500 rounded-lg hover:bg-green-400 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addUser')}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleName(user.roleId)}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRolesPermissions = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{t('rolesPermissions')}</h3>
              <p className="text-purple-100">Manage user roles and their permissions</p>
            </div>
            <button
              onClick={() => {
                setEditingRole(null);
                setNewRole({ name: '', permissions: [] });
                setShowRoleModal(true);
              }}
              className="flex items-center px-4 py-2 text-purple-100 bg-purple-500 rounded-lg hover:bg-purple-400 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addRole')}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {role.name}
                        {role.isSystem && (
                          <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                            System
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {role.permissions.length} permissions assigned
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditRole(role)}
                      disabled={role.isSystem}
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        role.isSystem
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Update Role
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      disabled={role.isSystem}
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        role.isSystem
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'text-red-600 bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {role.permissions.slice(0, 3).map((permission) => {
                    const permissionInfo = availablePermissions.find(p => p.id === permission);
                    return (
                      <span
                        key={permission}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {permissionInfo?.name || permission}
                      </span>
                    );
                  })}
                  {role.permissions.length > 3 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      +{role.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailIntegration = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-t-lg p-6">
          <h3 className="text-xl font-bold text-white">{t('emailIntegration')}</h3>
          <p className="text-indigo-100">Configure SMTP settings for email notifications</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('smtpServer')}
              </label>
              <input
                type="text"
                value={emailSettings.smtpServer}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpServer: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('smtpPort')}
              </label>
              <input
                type="number"
                value={emailSettings.smtpPort}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) || 587 })}
                placeholder="587"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('smtpUsername')}
              </label>
              <input
                type="text"
                value={emailSettings.smtpUsername}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                placeholder="your-email@gmail.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('smtpPassword')}
              </label>
              <input
                type="password"
                value={emailSettings.smtpPassword}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                placeholder="App Password (for Gmail)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fromEmail')}
              </label>
              <input
                type="email"
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                placeholder="noreply@restaurant.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fromName')}
              </label>
              <input
                type="text"
                value={emailSettings.fromName}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                placeholder="Restaurant POS"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableTLS"
              checked={emailSettings.enableTLS}
              onChange={(e) => setEmailSettings({ ...emailSettings, enableTLS: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="enableTLS" className="text-sm font-medium text-gray-700">
              {t('enableTLS')}
            </label>
          </div>

          {/* Test Email Section */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('testEmail')}</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Fill in your SMTP settings above, then enter a test email address below to verify your configuration.
              </p>
              <p className="text-xs text-blue-600 mt-2">
                For Gmail: Use your Gmail address as username and generate an App Password instead of your regular password.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  value={emailSettings.testEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, testEmail: e.target.value })}
                  placeholder="test@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <button
                onClick={handleSendTestEmail}
                disabled={isTestingEmail || !emailSettings.testEmail}
                className="flex items-center justify-center px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isTestingEmail ? (
                  <>
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    Sending Test Email...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    {t('sendTestEmail')}
                  </>
                )}
              </button>
              
              {emailTestResult && (
                <div className={`p-4 rounded-lg border ${
                  emailTestResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    {emailTestResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        emailTestResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {emailTestResult.success ? 'Success!' : 'Error'}
                      </p>
                      <p className={`text-sm mt-1 whitespace-pre-line ${
                        emailTestResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {emailTestResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                <SettingsIcon className="h-6 w-6 mr-3" />
                {t('settings')}
              </h2>
              <p className="text-gray-100">Configure your restaurant POS system</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="flex space-x-1 p-1">
            <button
              onClick={() => setActiveSection('general')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeSection === 'general'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              General Settings
            </button>
            {hasPermission('user_manage') && (
              <button
                onClick={() => setActiveSection('users')}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeSection === 'users'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                User Management
              </button>
            )}
            {hasPermission('role_manage') && (
              <button
                onClick={() => setActiveSection('roles')}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeSection === 'roles'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Roles & Permissions
              </button>
            )}
            <button
              onClick={() => setActiveSection('email')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeSection === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Email Integration
            </button>
          </div>
        </div>

        {/* Content */}
        {activeSection === 'general' && renderGeneralSettings()}
        {activeSection === 'users' && hasPermission('user_manage') && renderUserManagement()}
        {activeSection === 'roles' && hasPermission('role_manage') && renderRolesPermissions()}
        {activeSection === 'email' && renderEmailIntegration()}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? t('editUser') : t('addUser')}
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('userName')}
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('userEmail')}
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('userRole')}
                  </label>
                  <select
                    value={newUser.roleId}
                    onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingUser ? 'New Password (leave blank to keep current)' : t('setPassword')}
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('confirmPassword')}
                  </label>
                  <input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="userActive"
                    checked={newUser.isActive}
                    onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="userActive" className="text-sm font-medium text-gray-700">
                    Active User
                  </label>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
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
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRole ? t('editRole') : t('addRole')}
                </h3>
              </div>
              
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('roleName')}
                  </label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('assignPermissions')}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {availablePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={permission.id}
                          checked={newRole.permissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor={permission.id} className="text-sm font-medium text-gray-900 cursor-pointer">
                            {permission.name}
                          </label>
                          <p className="text-xs text-gray-600">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={editingRole ? handleUpdateRole : handleAddRole}
                    className="flex-1 flex items-center justify-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingRole ? t('updateRole') : t('addRole')}
                  </button>
                  <button
                    onClick={() => {
                      setShowRoleModal(false);
                      setEditingRole(null);
                    }}
                    className="flex-1 flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
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