// src/hooks/useSigning.js
import { useFileSelection } from './useFileSelection';
import { useNotification } from '../contexts/NotificationContext'; // NotificationContext'ten import ediyoruz
import browserApi from '../utils/browserApi';

export const useSigning = () => {
  const { handleFileSelection, selectPdfFile, selectOfficeFile } = useFileSelection();
  const { showNotification } = useNotification();

  const handleSignDocument = () => {
    handleFileSelection('*.*', async (file) => {
      try {
        console.log('Signing file:', file.name); // Debug log
        const response = await browserApi.signDocument(file.name);
        console.log('Signing response:', response); // Debug log

        if (response.success) {
          showNotification('Document signed successfully', 'success');
        } else {
          showNotification(response.message || 'Failed to sign document', 'error');
        }
      } catch (error) {
        console.error('Error signing document:', error);
        showNotification('Error signing document', 'error');
      }
    });
  };

  const handleSignPDFDocument = () => {
    selectPdfFile( async (file) => {
      try {
        console.log('Signing PDF document:', file.name); // Debug log
        if(file.name.split('.').pop() !== 'pdf') {
          showNotification('Please select a PDF document', 'error');
          return;
        }
        const response = await browserApi.signPDFDocument(file.name);
        console.log('Signing response:', response); // Debug log

        if (response.success) {
          showNotification('PDF signed successfully', 'success');
        } else {
          showNotification(response.message || 'Failed to sign PDF document', 'error');
        }
      } catch (error) {
        console.error('Error signing PDF document:', error);
        showNotification('Error signing PDF document', 'error');
      }
    });
  };


  const handleSignOfficeDocument = () => {
    selectOfficeFile( async (file) => {
      try {
        console.log('Signing Office document:', file.name); // Debug log
        if(file.name.split('.').pop() !== 'docx' 
          && file.name.split('.').pop() !== 'pptx'
          && file.name.split('.').pop() !== 'xlsx') {
          showNotification('Please select a DOCX, PPTX or XLSX document', 'error');
          return;
        }

        const response = await browserApi.signOfficeDocument(file.name);
        console.log('Signing Office response:', response); // Debug log

        if (response.success) {
          showNotification('Office document signed successfully', 'success');
        } else {
          showNotification(response.message || 'Failed to sign Office document', 'error');
        }
      } catch (error) {
        console.error('Error signing Office document:', error);
        showNotification('Error signing Office document', 'error');
      }
    });
  };


  const handleVerifySignature = () => {
    handleFileSelection('*.*', async (file) => {
      // Sonra imza dosyasını seç
      handleFileSelection('*.*', async (signatureFile) => {
        try {
          console.log('Verifying file:', file.name, 'with signature:', signatureFile.name); // Debug log
          const response = await browserApi.verifySignature(file.name, signatureFile.name);
          console.log('Verification response:', response); // Debug log

          if (response.success) {
            showNotification('Signature is valid', 'success');
          } else {
            showNotification(response.message || 'Invalid signature', 'error');
          }
        } catch (error) {
          console.error('Error verifying signature:', error);
          showNotification('Error verifying signature', 'error');
        }
      });
    });
  };

  return { handleSignDocument, handleVerifySignature, handleSignOfficeDocument, handleSignPDFDocument };
};

