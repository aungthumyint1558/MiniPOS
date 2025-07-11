import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { User, LogOut, Calendar, Settings, Menu, X } from 'lucide-react';
import { DatabaseSettings } from '../database/localStorage';

interface HeaderProps {
  currentUser: string;
  currentDate: string;
  onLogout: () => void;
  onSettings: () => void;
  settings: DatabaseSettings | null;
}

const Header: React.FC<HeaderProps> = ({ currentUser, currentDate, onLogout, onSettings, settings }) => {
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            {settings?.logo && (
              <img 
                src={settings.logo} 
                alt="Restaurant Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 rounded-full object-cover"
              />
            )}
            <div className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {settings?.restaurantName || t('restaurantPOS')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                {t('professionalPOS')}
              </p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="hidden lg:inline">{currentDate}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden lg:block">
                <div className="text-sm font-medium text-gray-900">{currentUser}</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            
            <button
              onClick={onSettings}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={t('settings')}
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            <button
              onClick={onLogout}
              className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden lg:inline">{t('logout')}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="h-6 w-6 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{currentUser}</div>
                    <div className="text-xs text-gray-500">Admin</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                {currentDate}
              </div>
              
              <div className="flex space-x-4 pt-2">
                <button
                  onClick={() => {
                    onSettings();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t('settings')}
                </button>
                
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;