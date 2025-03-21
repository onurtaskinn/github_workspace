// src/components/features/settings/SettingsTab.jsx
import React, {useState, useEffect} from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
        <span>Dark Mode</span>
        <button
          onClick={toggleDarkMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
        <label htmlFor="timeoutDuration" className="block text-sm font-medium text-gray-700">
          Timeout Duration (minutes)
        </label>
        <input
          id="timeoutDuration"
          type="number"
          value={timeoutDuration}
          onChange={handleTimeoutChange}
          min="1"
          className="w-full p-2 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
        />
      </div>
      <button
        onClick={handleLogout}
        className="w-full text-left px-6 py-4 bg-red-200 text-red-700 rounded-xl hover:bg-red-300 transition-colors duration-200 ease-in-out text-base font-medium"
      >
        🚪 Logout
      </button>
    </div>
  );
};

