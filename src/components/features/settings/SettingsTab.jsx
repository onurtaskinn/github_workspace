import React, {useState, useEffect} from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import Input from '../../common/Input';
import Button from '../../common/Button';

export const SettingsTab = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { handleLogout } = useAuth();
  const [timeoutDuration, setTimeoutDuration] = useState(1);

  useEffect(() => {
    chrome.storage.local.get('timeoutDuration', (data) => {
      if (data.timeoutDuration) {
        setTimeoutDuration(data.timeoutDuration);
      }
    });
  }, []);

  const handleTimeoutChange = (event) => {
    const newTimeout = Number(event.target.value);
    setTimeoutDuration(newTimeout);

    chrome.storage.local.set({ timeoutDuration: newTimeout }, () => {
      chrome.runtime.sendMessage({ action: 'updateTimeout', timeoutDuration: newTimeout });
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <h3 className="font-medium mb-4 text-gray-800 dark:text-gray-200">Display Settings</h3>
        
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <h3 className="font-medium mb-4 text-gray-800 dark:text-gray-200">Security Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Timeout Duration (minutes)
            </label>
            <Input
              type="number"
              value={timeoutDuration}
              onChange={handleTimeoutChange}
              min="1"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The extension will automatically log out after this period of inactivity
            </p>
          </div>
        </div>
      </div>
      
      <Button
        onClick={handleLogout}
        variant="danger"
        fullWidth={true}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        }
      >
        Logout
      </Button>
    </div>
  );
};