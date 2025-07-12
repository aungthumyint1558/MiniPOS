import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Cloud, 
  CloudOff, 
  Settings as SettingsIcon, 
  Upload, 
  Download, 
  User, 
  Building, 
  CheckCircle,
  AlertCircle,
  Loader,
  Key,
  Save
} from 'lucide-react';
import { googleDriveService, GoogleDriveConnection } from '../utils/googleDrive';

interface GoogleDriveSettingsProps {
  onExportToGoogleDrive?: (data: any) => Promise<void>;
}

const GoogleDriveSettings: React.FC<GoogleDriveSettingsProps> = ({ onExportToGoogleDrive }) => {
  const { t } = useLanguage();
  const [connection, setConnection] = useState<GoogleDriveConnection>({ isConnected: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiConfig, setApiConfig] = useState({
    clientId: localStorage.getItem('google_drive_client_id') || '',
    apiKey: localStorage.getItem('google_drive_api_key') || ''
  });

  useEffect(() => {
    // Load existing connection on component mount
    const existingConnection = googleDriveService.getConnection();
    setConnection(existingConnection);
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSaveApiConfig = () => {
    if (!apiConfig.clientId.trim() || !apiConfig.apiKey.trim()) {
      setError('Please enter both Client ID and API Key');
      return;
    }

    localStorage.setItem('google_drive_client_id', apiConfig.clientId.trim());
    localStorage.setItem('google_drive_api_key', apiConfig.apiKey.trim());
    setSuccess('API configuration saved successfully');
    setShowApiConfig(false);
    
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleConnect = async () => {
    clearMessages();
    setIsLoading(true);

    try {
      if (!apiConfig.clientId || !apiConfig.apiKey) {
        throw new Error('Please configure Google Drive API credentials first');
      }

      // Initialize Google Drive API
      const initialized = await googleDriveService.initialize(apiConfig.clientId, apiConfig.apiKey);
      if (!initialized) {
        throw new Error('Failed to initialize Google Drive API');
      }

      // Sign in to Google Drive
      const newConnection = await googleDriveService.signIn();
      setConnection(newConnection);
      setSuccess(`Successfully connected to Google Drive as ${newConnection.userName}`);
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: any) {
      console.error('Google Drive connection failed:', error);
      setError(error.message || 'Failed to connect to Google Drive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    clearMessages();
    setIsLoading(true);

    try {
      await googleDriveService.signOut();
      setConnection({ isConnected: false });
      setSuccess('Successfully disconnected from Google Drive');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Google Drive disconnection failed:', error);
      setError(error.message || 'Failed to disconnect from Google Drive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToGoogleDrive = async () => {
    clearMessages();
    setIsLoading(true);

    try {
      if (!connection.isConnected) {
        throw new Error('Not connected to Google Drive');
      }

      // Prepare export data
      const exportData = {
        settings: JSON.parse(localStorage.getItem('restaurant_pos_settings') || '{}'),
        tables: JSON.parse(localStorage.getItem('restaurant_pos_tables') || '[]'),
        menuItems: JSON.parse(localStorage.getItem('restaurant_pos_menu_items') || '[]'),
        categories: JSON.parse(localStorage.getItem('restaurant_pos_categories') || '[]'),
        orderHistory: JSON.parse(localStorage.getItem('restaurant_pos_order_history') || '[]'),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const result = await googleDriveService.exportToGoogleDrive(exportData);
      setSuccess(`Successfully exported data to Google Drive: ${result.name}`);
      
      if (onExportToGoogleDrive) {
        await onExportToGoogleDrive(exportData);
      }
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (error: any) {
      console.error('Export to Google Drive failed:', error);
      setError(error.message || 'Failed to export to Google Drive');
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountTypeIcon = (accountType?: string) => {
    return accountType === 'workspace' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getAccountTypeLabel = (accountType?: string) => {
    return accountType === 'workspace' ? 'Workspace Account' : 'Personal Account';
  };

  return (
    <div className="space-y-6">
      {/* Google Drive Connection Status */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
          <div className="flex items-center space-x-3">
            <Cloud className="h-6 w-6 text-white" />
            <div>
              <h3 className="text-lg font-semibold text-white">Google Drive Integration</h3>
              <p className="text-blue-100 text-sm">Connect your Google Drive for automatic backups</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* API Configuration */}
          {!showApiConfig && (!apiConfig.clientId || !apiConfig.apiKey) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">API Configuration Required</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    You need to configure Google Drive API credentials to use this feature.
                  </p>
                  <button
                    onClick={() => setShowApiConfig(true)}
                    className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
                  >
                    Configure API Credentials
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API Configuration Form */}
          {showApiConfig && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Google Drive API Configuration</h4>
                <button
                  onClick={() => setShowApiConfig(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={apiConfig.clientId}
                    onChange={(e) => setApiConfig({ ...apiConfig, clientId: e.target.value })}
                    placeholder="Enter Google Drive Client ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={apiConfig.apiKey}
                    onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                    placeholder="Enter Google Drive API Key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveApiConfig}
                    className="flex items-center px-3 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 text-sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Configuration
                  </button>
                  <button
                    onClick={() => setShowApiConfig(false)}
                    className="px-3 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                <p className="font-medium mb-1">How to get API credentials:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                  <li>Create a new project or select existing one</li>
                  <li>Enable Google Drive API</li>
                  <li>Create credentials (OAuth 2.0 Client ID and API Key)</li>
                  <li>Add your domain to authorized origins</li>
                </ol>
              </div>
            </div>
          )}

          {/* Connection Status */}
          {connection.isConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Connected to Google Drive</h4>
                    <div className="text-sm text-green-700 mt-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{connection.userName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>📧</span>
                        <span>{connection.userEmail}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getAccountTypeIcon(connection.accountType)}
                        <span>{getAccountTypeLabel(connection.accountType)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="flex items-center px-3 py-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 text-sm"
                >
                  <CloudOff className="h-4 w-4 mr-1" />
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CloudOff className="h-5 w-5 text-gray-500" />
                  <div>
                    <h4 className="font-medium text-gray-900">Not Connected</h4>
                    <p className="text-sm text-gray-600">Connect to Google Drive to enable automatic backups</p>
                  </div>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={isLoading || !apiConfig.clientId || !apiConfig.apiKey}
                  className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Cloud className="h-4 w-4 mr-2" />
                  )}
                  Connect
                </button>
              </div>
            </div>
          )}

          {/* Export to Google Drive */}
          {connection.isConnected && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Export Data</h4>
                  <p className="text-sm text-gray-600">Save your restaurant data to Google Drive</p>
                </div>
                <button
                  onClick={handleExportToGoogleDrive}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Export to Google Drive
                </button>
              </div>
            </div>
          )}

          {/* API Configuration Button */}
          {(apiConfig.clientId && apiConfig.apiKey) && !showApiConfig && (
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowApiConfig(true)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                <Key className="h-4 w-4 mr-1" />
                Update API Configuration
              </button>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveSettings;