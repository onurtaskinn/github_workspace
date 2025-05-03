// src/hooks/useFileSelection.js
export const useFileSelection = () => {
    const handleFileSelection = (accept, callback) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          callback(file);
        }
      };
      input.click();
    };
  
    const selectPdfFile = (callback) => {
      handleFileSelection('application/pdf', callback);
    };
  
    const selectOfficeFile = (callback) => {
      const officeMimeTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
      ];
      handleFileSelection(officeMimeTypes.join(','), callback);
    };
  
    return { handleFileSelection, selectPdfFile, selectOfficeFile };
  };