// src/components/features/gmail/ComposeModal.jsx
import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { useNotification } from '../../../contexts/NotificationContext';

export const ComposeModal = ({ onClose }) => {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const { showNotification } = useNotification();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validateForm = () => {
    // Check for recipients
    if (!recipients.trim()) {
      showNotification('Please enter at least one recipient', 'error');
      return false;
    }
    
    // Validate email format
    const emails = recipients.split(',').map(email => email.trim());
    for (const email of emails) {
      if (!validateEmail(email)) {
        showNotification(`"${email}" is not a valid email address`, 'error');
        return false;
      }
    }
    
    // Check for subject
    if (!subject.trim()) {
      showNotification('Please enter a subject', 'error');
      return false;
    }
    
    // Check for message content
    if (!message.trim()) {
      showNotification('Please enter a message', 'error');
      return false;
    }
    
    return true;
  };

  const handleSend = () => {
    if (!validateForm()) {
      return;
    }

    setIsSending(true);
    
    // Send email using background script
    chrome.runtime.sendMessage({
      action: 'sendEmail',
      to: recipients,
      subject: subject,
      body: message
    }, (response) => {
      setIsSending(false);
      
      if (response && response.success) {
        showNotification('Email sent successfully', 'success');
        setTimeout(() => onClose(), 1500); // Close after notification is shown
      } else {
        showNotification(`Failed to send email: ${response?.error || 'Unknown error'}`, 'error');
      }
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Compose Secure Email</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipients:
            </label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              placeholder="example@gmail.com, another@gmail.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              placeholder="Email subject"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              rows="6"
              placeholder="Your message..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors duration-200 ease-in-out dark:text-gray-300 dark:hover:text-gray-100"
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ease-in-out"
            disabled={isSending}
          >
            {isSending ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Sending...
              </>
            ) : 'Send Email'}
          </button>
        </div>
      </div>
    </Modal>
  );
};