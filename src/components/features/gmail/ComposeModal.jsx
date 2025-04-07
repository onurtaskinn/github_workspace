// src/components/features/gmail/ComposeModal.jsx
import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { useNotification } from '../../../contexts/NotificationContext';
import Button from '../../common/Button'; // Assuming Button handles isLoading
import Input from '../../common/Input';   // Assuming Input exists

export const ComposeModal = ({ onClose }) => {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]); // State for attachments
  const [isSending, setIsSending] = useState(false);
  const { showNotification } = useNotification();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validateForm = () => {
    if (!recipients.trim()) {
      showNotification('Please enter at least one recipient', 'error');
      return false;
    }
    const emails = recipients.split(',').map(email => email.trim());
    for (const email of emails) {
      if (!validateEmail(email)) {
        showNotification(`"${email}" is not a valid email address`, 'error');
        return false;
      }
    }
    if (!subject.trim()) {
      showNotification('Please enter a subject', 'error');
      return false;
    }
    if (!message.trim()) {
      showNotification('Please enter a message', 'error');
      return false;
    }
    return true;
  };

  // Function to handle file selection and reading
  const handleFileChange = (event) => {
    const files = event.target.files;
    if (!files) return;

    const filePromises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          const base64String = dataUrl.substring(dataUrl.indexOf(',') + 1); // Get base64 part
          resolve({
            filename: file.name,
            mimeType: file.type || 'application/octet-stream', // Provide default MIME type
            content: base64String
          });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file); // Read as Data URL to get base64
      });
    });

    Promise.all(filePromises)
      .then(newAttachments => {
        setAttachments(prevAttachments => [...prevAttachments, ...newAttachments]); // Append new files
        showNotification(`${newAttachments.length} file(s) added.`, 'info');
      })
      .catch(error => {
        console.error("Error reading files:", error);
        showNotification('Error reading one or more files.', 'error');
      });

    // Clear the input value so the same file can be selected again if needed
     event.target.value = null;
  };

  // Function to remove an attachment
  const removeAttachment = (index) => {
     setAttachments(prev => prev.filter((_, i) => i !== index));
  };


  const handleSend = () => {
    if (!validateForm()) {
      return;
    }

    setIsSending(true);

    chrome.runtime.sendMessage({
      action: 'sendEmail',
      to: recipients,
      subject: subject,
      body: message,
      attachments: attachments // Pass the attachments array
    }, (response) => {
      setIsSending(false);

      if (response && response.success) {
        showNotification('Email sent successfully', 'success');
        setAttachments([]); // Clear attachments on success
        setTimeout(() => onClose(), 1500);
      } else {
        showNotification(`Failed to send email: ${response?.error || 'Unknown error'}`, 'error');
      }
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2"> {/* Added max height and scroll */}
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Compose Secure Email</h2>

        <div className="space-y-3">
          {/* Recipients Input */}
          <Input
              label="Recipients:"
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="example@gmail.com, another@gmail.com"
           />

          {/* Subject Input */}
           <Input
              label="Subject:"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
           />

          {/* Message Textarea */}
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

          {/* Attachments Section */}
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
               Attachments:
             </label>
             {/* Simple File Input */}
             <input
               type="file"
               multiple
               onChange={handleFileChange}
               className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300
                          hover:file:bg-blue-100 dark:hover:file:bg-blue-800/40"
             />
             {/* Display selected attachments */}
             {attachments.length > 0 && (
               <div className="mt-2 space-y-1 max-h-20 overflow-y-auto border dark:border-gray-600 rounded-md p-2">
                 {attachments.map((att, index) => (
                   <div key={index} className="flex justify-between items-center text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                     <span className="truncate pr-2">{att.filename} ({att.mimeType})</span>
                     <button
                       onClick={() => removeAttachment(index)}
                       className="text-red-500 hover:text-red-700 font-bold"
                       title="Remove attachment"
                     >
                       &times; {/* Simple X for removal */}
                     </button>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t dark:border-gray-700"> {/* Added padding top and border */}
          <Button
            variant="secondary" // Assuming you have variants
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            isLoading={isSending} // Pass loading state to Button
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};