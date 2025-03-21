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
  
    return { handleFileSelection };
  };

  