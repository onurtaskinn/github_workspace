import React, { useState } from 'react';
import serverApi from './serverCommunication';
import { FaClipboard } from 'react-icons/fa';
import { useNotification } from '../../../contexts/NotificationContext';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Card from '../../common/Card';

export const ServerTab = () => {
  const { showNotification } = useNotification();
  const [nameGetData, setNameGetData] = useState('');
  const [nameSaveData, setNameSaveData] = useState('');
  const [key, setKey] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveKey = async () => {
    if (!nameSaveData || !key) {
      showNotification('Please enter both name and key', 'warning');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await serverApi.sendMessageToServer(
        'database',
        'savePublicKey',
        JSON.stringify({ name: nameSaveData, key })
      );
      console.log('handleSaveKey result: ', result);

      if (result.message === 'Success') {
        setResultMessage({ type: 'success', message: 'Saved key successfully!' });
        showNotification('Key saved successfully', 'success');
      } else {
        setResultMessage({ type: 'error', message: result.message });
        showNotification('Failed to save key: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error in handleSaveKey:', error);
      setResultMessage({ type: 'error', message: 'Failed to save key.' });
      showNotification('Error saving key', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetKey = async () => {
    if (!nameGetData) {
      showNotification('Please enter a name', 'warning');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await serverApi.sendMessageToServer(
        'database',
        'getPublicKey',
        JSON.stringify({ name: nameGetData })
      );
      console.log('handleGetKey result: ', result);
      
      if (result.message === 'Success') {
        setResultMessage({
          type: 'key',
          name: nameGetData,
          key: result.key,
        });
        showNotification('Key retrieved successfully', 'success');
      } else {
        setResultMessage({ type: 'error', message: 'Failed to get key: ' + result.message });
        showNotification('Failed to get key', 'error');
      }
    } catch (error) {
      console.error('Error in handleGetKey:', error);
      setResultMessage({ type: 'error', message: 'Failed to fetch key.' });
      showNotification('Error retrieving key', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Key copied to clipboard!', 'success');
    }).catch((error) => {
      console.error('Failed to copy: ', error);
      showNotification('Failed to copy to clipboard', 'error');
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <h3 className="font-medium mb-4 text-gray-800 dark:text-gray-200">Get Public Key</h3>
        
        <div className="space-y-4">
          <Input
            label="User Name"
            placeholder="Enter Name"
            value={nameGetData}
            onChange={(e) => setNameGetData(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          
          <Button
            onClick={handleGetKey}
            isLoading={isLoading}
            fullWidth
          >
            Get Key
          </Button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <h3 className="font-medium mb-4 text-gray-800 dark:text-gray-200">Register Public Key</h3>
        
        <div className="space-y-4">
          <Input
            label="User Name"
            placeholder="Enter Name"
            value={nameSaveData}
            onChange={(e) => setNameSaveData(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          
          <Input
            label="Public Key"
            placeholder="Enter Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            }
          />
          
          <Button
            onClick={handleSaveKey}
            isLoading={isLoading}
            fullWidth
          >
            Register Key
          </Button>
        </div>
      </div>

      {resultMessage && (
        <div className="mt-4 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm relative">
          {resultMessage.type === 'key' ? (
            <>
              <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Key Details</h4>
              <p className="text-sm mb-1"><span className="font-medium">Name:</span> {resultMessage.name}</p>
              <div className="relative">
                <p className="text-sm font-medium mb-1">Key:</p>
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md overflow-x-auto">
                  <p className="text-xs text-gray-700 dark:text-gray-300 break-all pr-10">{resultMessage.key}</p>
                  <button
                    onClick={() => copyToClipboard(resultMessage.key)}
                    className="absolute top-2 right-2 p-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    aria-label="Copy key"
                  >
                    <FaClipboard size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : resultMessage.type === 'success' ? (
            <p className="text-green-600 dark:text-green-400">{resultMessage.message}</p>
          ) : (
            <p className="text-red-600 dark:text-red-400">{resultMessage.message}</p>
          )}
        </div>
      )}
    </div>
  );
};

