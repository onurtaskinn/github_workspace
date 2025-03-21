// Original content script code
console.log('Content script loaded');

// Gmail integration code
(function() {
  let buttonInjected = false;
  

  function injectComposeButton() {
    if (!window.location.href.includes('mail.google.com')) {
      return;
    }
    if (buttonInjected) return;
    
    console.log('Trying to inject secure compose button into Gmail');
    
    const gmailSelectors = [
      '.T-I.T-I-KE.L3', 
      '[role="button"][gh="cm"]',
      '[role="toolbar"] .z0', 
      '.z0 .L3' 
    ];
    
    let gmailComposeButton = null;
    
    for (const selector of gmailSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          console.log('Found Gmail compose button with selector:', selector);
          gmailComposeButton = element;
          break;
        }
      } catch (error) {
        console.error('Error with selector:', selector, error);
      }
    }
    
    if (!gmailComposeButton) {
      console.log('Gmail compose button not found, will retry later');
      return;
    }
    
    // Create our secure compose button
    try {
        const secureButton = document.createElement('div');
        secureButton.className = 'e-sbsl-secure-compose-button';
        secureButton.style.display = 'inline-block';
        secureButton.style.margin = '0 5px';
        console.log("url : ", chrome.runtime.getURL('icons/icon16.png'));
        
        secureButton.innerHTML = `
        <button style="
          background-color: #0b57d0; 
          color: white; 
          border: none; 
          border-radius: 24px; 
          padding: 8px 16px; 
          font-size: 14px;
          font-family: 'Google Sans', Roboto, Arial, sans-serif;
          font-weight: 500;
          letter-spacing: 0.25px;
          height: 36px;
          cursor: pointer; 
          display: flex; 
          align-items: center;
          justify-content: center;
          min-width: 112px;
          text-transform: none;
          outline: none;
          box-shadow: none;
        ">
          <span style="white-space: nowrap;">Secure Email</span>
        </button>
      `;     
      
      secureButton.addEventListener('click', () => {
        console.log('Secure compose button clicked');
        chrome.runtime.sendMessage({ 
          action: 'openSecureCompose'
        });
      });
      
      gmailComposeButton.parentNode.insertBefore(secureButton, gmailComposeButton.nextSibling);
      console.log('Secure compose button injected successfully');
      buttonInjected = true;
    } catch (error) {
      console.error('Error injecting secure compose button:', error);
    }
  }
  
  setTimeout(injectComposeButton, 2000);
  
  setInterval(() => {
    if (!buttonInjected && window.location.href.includes('mail.google.com')) {
      injectComposeButton();
    }
  }, 5000);
  
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && !buttonInjected) {
        injectComposeButton();
      }
    }
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkGmailButton') {
      sendResponse({ injected: buttonInjected });
    }
  });
})();