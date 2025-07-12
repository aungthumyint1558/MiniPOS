// Google Drive API integration
export interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  discoveryDoc: string;
  scopes: string[];
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
}

export interface GoogleDriveConnection {
  isConnected: boolean;
  userEmail?: string;
  userName?: string;
  accountType?: 'personal' | 'workspace';
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

class GoogleDriveService {
  private gapi: any = null;
  private isInitialized = false;
  private config: GoogleDriveConfig = {
    clientId: '', // Will be set by user
    apiKey: '', // Will be set by user
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ]
  };

  async initialize(clientId: string, apiKey: string): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      this.config.clientId = clientId;
      this.config.apiKey = apiKey;

      // Load Google API script
      await this.loadGoogleAPI();
      
      // Initialize gapi
      await new Promise((resolve) => {
        window.gapi.load('client:auth2', resolve);
      });

      await window.gapi.client.init({
        apiKey: this.config.apiKey,
        clientId: this.config.clientId,
        discoveryDocs: [this.config.discoveryDoc],
        scope: this.config.scopes.join(' ')
      });

      this.gapi = window.gapi;
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      return false;
    }
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<GoogleDriveConnection> {
    try {
      if (!this.isInitialized) {
        throw new Error('Google Drive API not initialized');
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      
      const profile = user.getBasicProfile();
      const authResponse = user.getAuthResponse();
      
      // Determine account type based on email domain
      const email = profile.getEmail();
      const accountType = this.determineAccountType(email);

      const connection: GoogleDriveConnection = {
        isConnected: true,
        userEmail: email,
        userName: profile.getName(),
        accountType,
        accessToken: authResponse.access_token,
        expiresAt: authResponse.expires_at
      };

      // Save connection to localStorage
      localStorage.setItem('google_drive_connection', JSON.stringify(connection));
      
      return connection;
    } catch (error) {
      console.error('Google Drive sign-in failed:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.isInitialized && this.gapi) {
        const authInstance = this.gapi.auth2.getAuthInstance();
        await authInstance.signOut();
      }
      localStorage.removeItem('google_drive_connection');
    } catch (error) {
      console.error('Google Drive sign-out failed:', error);
      throw error;
    }
  }

  getConnection(): GoogleDriveConnection {
    try {
      const stored = localStorage.getItem('google_drive_connection');
      if (stored) {
        const connection = JSON.parse(stored);
        // Check if token is still valid
        if (connection.expiresAt && Date.now() < connection.expiresAt) {
          return connection;
        }
      }
    } catch (error) {
      console.error('Failed to get Google Drive connection:', error);
    }
    
    return { isConnected: false };
  }

  private determineAccountType(email: string): 'personal' | 'workspace' {
    const domain = email.split('@')[1];
    // Common personal email domains
    const personalDomains = ['gmail.com', 'googlemail.com'];
    return personalDomains.includes(domain) ? 'personal' : 'workspace';
  }

  async uploadFile(fileName: string, content: string, mimeType: string = 'application/json'): Promise<GoogleDriveFile> {
    try {
      if (!this.isInitialized) {
        throw new Error('Google Drive API not initialized');
      }

      const connection = this.getConnection();
      if (!connection.isConnected) {
        throw new Error('Not connected to Google Drive');
      }

      // Create file metadata
      const metadata = {
        name: fileName,
        parents: [] // Root folder
      };

      // Create form data
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([content], { type: mimeType }));

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        id: result.id,
        name: result.name,
        mimeType: result.mimeType,
        createdTime: result.createdTime,
        modifiedTime: result.modifiedTime,
        size: result.size
      };
    } catch (error) {
      console.error('Failed to upload file to Google Drive:', error);
      throw error;
    }
  }

  async listFiles(query?: string): Promise<GoogleDriveFile[]> {
    try {
      if (!this.isInitialized) {
        throw new Error('Google Drive API not initialized');
      }

      const connection = this.getConnection();
      if (!connection.isConnected) {
        throw new Error('Not connected to Google Drive');
      }

      let url = 'https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,createdTime,modifiedTime,size)';
      if (query) {
        url += `&q=${encodeURIComponent(query)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`);
      }

      const result = await response.json();
      return result.files || [];
    } catch (error) {
      console.error('Failed to list Google Drive files:', error);
      throw error;
    }
  }

  async exportToGoogleDrive(data: any, fileName?: string): Promise<GoogleDriveFile> {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const defaultFileName = fileName || `restaurant-pos-backup-${timestamp}.json`;
      
      const exportData = {
        ...data,
        exportDate: new Date().toISOString(),
        version: '1.0',
        source: 'Restaurant POS System'
      };

      const content = JSON.stringify(exportData, null, 2);
      return await this.uploadFile(defaultFileName, content, 'application/json');
    } catch (error) {
      console.error('Failed to export to Google Drive:', error);
      throw error;
    }
  }
}

// Global instance
export const googleDriveService = new GoogleDriveService();

// Extend window interface for TypeScript
declare global {
  interface Window {
    gapi: any;
  }
}