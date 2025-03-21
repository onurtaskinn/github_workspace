import React, { useState, useEffect } from 'react';

import  serverApi  from './serverCommunication';
import { FaClipboard } from 'react-icons/fa'; 
import { useNotification } from '../../../contexts/NotificationContext';

export const ServerTab = () => {
  const { showNotification } = useNotification();
  const [nameGetData, setNameGetData] = useState(''); 
  const [nameSaveData, setNameSaveData] = useState(''); 
  const [key, setKey] = useState(''); 
  const [resultMessage, setResultMessage] = useState(''); // State to store the result

  const handleSaveKey = async () => {
    try {
      const result = await serverApi.sendMessageToServer(
        'database',
        'savePublicKey',
        JSON.stringify({ name: nameSaveData, key })
      );
      console.log('handleSaveKey result: ', result);

      if(result.message === 'Success'){
        setResultMessage({ type: 'success', message: 'Saved key successfully!' });
      }
      else{
        setResultMessage({ type: 'error', message: result.message });
      }
    } catch (error) {
      console.error('Error in handleSaveKey:', error);
      setResultMessage({ type: 'error', message: 'Failed to save key.' });
    }
  };

  const handleGetKey= async () => {
    try {
      const result = await serverApi.sendMessageToServer(
        'database',
        'getPublicKey',
        JSON.stringify({ name: nameGetData })
      );
      console.log('handleGetKey result: ', result);
      if(result.message === 'Success'){
        setResultMessage({
            type: 'key',
            name: nameGetData,
            key: result.key,
          });
      }
      else{
        ssetResultMessage({ type: 'error', message: 'Failed to get key.' });
      }
    } catch (error) {
      console.error('Error in handleGetKey:', error);
      setResultMessage('Failed to fetch key.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Key copied to clipboard!');
    }).catch((error) => {
      console.error('Failed to copy: ', error);
    });
  };
  

  return (
      <div className="space-y-6">
          <div className="space-y-2">
            <input
            type="text"
            placeholder="Enter Name"
            value={nameGetData}
            onChange={(e) => setNameGetData(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            />

            <button
                onClick={handleGetKey}
                className="w-full text-left px-4 py-2 bg-blue-300 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors duration-200 ease-in-out text-base font-medium"
            >
                GetKey
            </button>

            </div>
            <div className="space-y-2">
            <input
            type="text"
            placeholder="Enter Name"
            value={nameSaveData}
            onChange={(e) => setNameSaveData(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            />
            <input
            type="text"
            placeholder="Enter Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            />
            <button
                onClick={handleSaveKey}
                className="w-full text-left px-4 py-2 bg-blue-300 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors duration-200 ease-in-out text-base font-medium"
            >
                RegisterKey
            </button>
        </div>

        {resultMessage && (
         <div className="mt-4 px-4 py-2 border rounded-lg bg-gray-100 relative">
         {resultMessage ? (
           resultMessage.type === 'key' ? (
             <>
               <p>{`Name: ${resultMessage.name}`}</p>
               <div className="flex items-center">
                 <p
                   className="truncate" // Ensures the key stays on one line
                   style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                 >
                   {`Key: ${resultMessage.key}`}
                 </p>
                 <button
                   onClick={() => copyToClipboard(resultMessage.key)}
                   className="absolute top-2 right-2 flex items-center text-blue-500 hover:text-blue-700"
                 >
                   <FaClipboard className="mr-2" /> Copy Key
                 </button>
               </div>
             </>
           ) : resultMessage.type === 'success' ? (
             <p className="text-green-500">{resultMessage.message}</p>
           ) : (
             <p className="text-red-500">{resultMessage.message}</p>
           )
         ) : null}
       </div>
      )}
      </div>
  );
};