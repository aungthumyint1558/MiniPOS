import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Save, Bell, Shield, Globe, Printer, Download, Upload, Database } from 'lucide-react';
import { DatabaseSettings } from '../database/localStorage';
import { database } from '../database/localStorage';

interface SettingsProps {
  settings: DatabaseSettings | null;
  onUpdateSettings: (settings: Partial<DatabaseSettings>) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings }) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
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
    </div>
  );
};

export default Settings;