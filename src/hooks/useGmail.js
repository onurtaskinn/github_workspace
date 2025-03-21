import { useNotification } from '../contexts/NotificationContext';

export const useGmail = () => {
  const { showNotification } = useNotification();

  const authenticateGmail = () => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'authenticate' }, (response) => {
        if (response && response.success) {
          resolve(response.token);
        } else {
          showNotification('Gmail authentication failed: ' + (response?.error || 'Unknown error'), 'error');
          reject(new Error(response?.error || 'Authentication failed'));
        }
      });
    });
  };

  const sendEmail = (to, subject, body) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'sendEmail',
        to,
        subject,
        body
      }, (response) => {
        if (response && response.success) {
          showNotification('Email sent successfully', 'success');
          resolve(response.result);
        } else {
          showNotification(`Failed to send email: ${response?.error || 'Unknown error'}`, 'error');
          reject(new Error(response?.error || 'Send failed'));
        }
      });
    });
  };

  return { authenticateGmail, sendEmail };
};