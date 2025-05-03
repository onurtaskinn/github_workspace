console.log('E-SBSL Background script loaded');

// Initialize header modification when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request.action || request.type);
  
  // Handle PRIVATE_SECTION_DETECTED from content script
  if (request.action === 'PRIVATE_SECTION_DETECTED') {
    console.log('Content script detected private section:', request.url);
    // Only process if we haven't processed this tab already
    if (!processedTabs.has(sender.tab.id)) {
      console.log('Tab not processed yet, initiating authentication');
      processedTabs.add(sender.tab.id);
      
      // Create a details object and call handleTargetNavigation
      const details = {
        tabId: sender.tab.id,
        url: request.url
      };
      
      handleTargetNavigation(details);
    } else {
      console.log('Tab already processed, skipping');
    }
    return true;
  }
  
  // Handle the account creation request
  if ((request.type === 'FROM_PAGE_TO_EXTENSION_API' && request.action === 'CREATE_ACCOUNT') || 
     (request.type === 'FROM_PAGE_TO_EXTENSION_API' && request.action === 'INITIATE_ACCOUNT_CREATION')) {
    handleAccountCreation(request.data, sender.tab.id)
      .then(response => {
        console.log('Account creation response:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Account creation error:', error);
        sendResponse({
          action: 'CREATE_ACCOUNT_RESPONSE',
          data: {
            success: false,
            error: error.message || 'Unknown error occurred'
          }
        });
      });
    return true;
  }
  
  // Handle the login request
  if ((request.type === 'FROM_PAGE_TO_EXTENSION_API' && request.action === 'LOGIN') || 
     (request.type === 'FROM_PAGE_TO_EXTENSION_API' && request.action === 'INITIATE_LOGIN')) {
    handleLogin(request.data, sender.tab.id)
      .then(response => {
        console.log('Login response:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Login error:', error);
        sendResponse({
          action: 'LOGIN_RESPONSE',
          data: {
            success: false,
            error: error.message || 'Unknown error occurred'
          }
        });
      });
    return true;
  }
  
  // Gmail authentication handler
  if (request.action === 'authenticate') {
    authenticate()
      .then(token => {
        console.log('Authentication successful');
        sendResponse({ success: true, token });
      })
      .catch(error => {
        console.error('Authentication failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  // Email sending handler
  if (request.action === 'sendEmail') {
    console.log('Processing sendEmail request');
    
    // Get attachments if available
    const attachments = request.attachments || [];
    
    sendEmail(request.to, request.subject, request.body, attachments)
      .then(result => {
        console.log('Email sent successfully');
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Email sending failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  // Check sender email
  if (request.action === 'checkSenderEmail') {
    console.log('Processing checkSenderEmail request for:', request.email);
    
    checkSenderEmail(request.email)
      .then(result => {
        console.log('Email check result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Email check error:', error);
        sendResponse({
          success: false,
          message: error.message
        });
      });
    return true;
  }
  
  // Timer management
  if (request.action === 'resetTimer') {
    resetTimer();
    sendResponse({ status: 'Timer reset' });
    return true;
  }
  
  if (request.action === 'updateTimeout') {
    timeOutTimeMin = request.timeoutDuration;
    timeoutTimeMsec = timeOutTimeMin * 60 * 1000;
    console.log(`Timeout duration updated to ${timeOutTimeMin} minutes`);
    sendResponse({ status: 'Timeout updated' });
    return true;
  }
  
  // Handle secure compose
  if (request.action === 'openSecureCompose' || 
     (request.type === 'FROM_PAGE_TO_EXTENSION' && request.action === 'OPEN_SECURE_COMPOSE')) {
    console.log('Received request to open secure compose');
    
    chrome.action.openPopup().then(() => {
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'openGmailCompose',
          source: 'gmail'
        });
      }, 500);
    }).catch(error => {
      console.error('Error opening popup:', error);
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup.html?action=composeEmail')
      });
    });
    
    sendResponse({ success: true });
    return true;
  }
  
  // Handle decryption UI
  if (request.action === 'openDecryptionUI') {
    console.log('Opening decryption UI with encrypted content');
    
    // Store encrypted content
    chrome.storage.session.set({
      'encryptedEmailContent': request.encryptedContent
    }, function() {
      // Open popup
      chrome.action.openPopup().then(() => {
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'showDecryptView',
            encryptedContent: request.encryptedContent
          });
        }, 500);
      }).catch(error => {
        console.error('Error opening popup:', error);
        chrome.tabs.create({
          url: chrome.runtime.getURL('popup.html?action=decryptEmail')
        });
      });
    });
    
    return true;
  }
  
  console.log("Unhandled message action:", request.action || request.type);
  sendResponse({ success: false, error: "Unknown action" });
  return false;
});

// Heartbeat connection handler
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "heartbeat") {
    console.log("Heartbeat connection established");
    
    // FIX: Using a named function for the listener
    const messageListener = function(msg) {
      if (msg.ping) {
        console.log("Heartbeat ping received");
        port.postMessage({ pong: true });
      }
    };
    
    port.onMessage.addListener(messageListener);
    
    port.onDisconnect.addListener(function() {
      console.log("Heartbeat connection closed");
      port.onMessage.removeListener(messageListener);
    });
  }
});

// Timer and timeout handling
let lastCallTime = Date.now();
let timeOutTimeMin = 1;
let timeoutTimeMsec = timeOutTimeMin * 60 * 1000;
let timeoutReached = false;

// Function to reset the timer
const resetTimer = () => {
  lastCallTime = Date.now();
  timeoutReached = false; 
};

// Function for notifications
function showNotification(message, type) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'E-Signature Authentication',
    message: message,
    priority: 1
  });
}

// Timeout check function
const checkTimeout = async () => {
  const currentTime = Date.now();
  if (currentTime - lastCallTime >= timeoutTimeMsec && !timeoutReached) {
    console.log('Timeout reached');
    timeoutReached = true;
    chrome.runtime.sendMessage({ timeoutReached: true });

    const response = await browserApi.logout();
    if (response.success) {
      console.log('Logged out successfully', 'info');
    }
    else {
      console.log("Failed to logout: " + response);
    }
  }
};

// Initial server connection test
serverAPI.testConnection().then(result => {
  console.log('Initial server connection test result:', result);
});

// Set interval for timeout checking
setInterval(checkTimeout, 10000);
});

// Maintain state of which tabs we've already processed
const processedTabs = new Set();

// Reset state when a tab is closed or navigated away
chrome.tabs.onRemoved.addListener((tabId) => {
  processedTabs.delete(tabId);
});

// Main navigation listener
chrome.webNavigation.onCommitted.addListener((details) => {
  // Only process main frame navigations (not iframes)
  if (details.frameId !== 0) return;
  
  console.log('Navigation committed:', details.url, 'Type:', details.transitionType);
  
  // Clear state on new navigation
  if (details.transitionType === 'reload' || 
      details.transitionType === 'typed' || 
      details.transitionType === 'auto_bookmark') {
    processedTabs.delete(details.tabId);
  }
  
  if (details.url.startsWith('https://144.122.219.194/')) {
    // Get the full URL including hash
    chrome.tabs.get(details.tabId, (tab) => {
      console.log('Full tab URL:', tab.url);
      
      // Skip if we've already processed this tab in this session
      if (processedTabs.has(details.tabId)) {
        console.log('Tab already processed, skipping');
        return;
      }
      
      // Check if it has the #Private hash
      if (tab.url.includes('#Private')) {
        console.log('Private URL detected, will process request');
        processedTabs.add(details.tabId);
        handleTargetNavigation(details);
      } else {
        console.log('Not a private URL, ignoring');
      }
    });
  }
}, { url: [{ urlPrefix: 'https://144.122.219.194/' }] });

// Also listen for hash changes as they don't trigger the onCommitted event
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId !== 0) return;
  
  console.log('History state updated:', details.url);
  
  if (details.url.startsWith('https://144.122.219.194/')) {
    chrome.tabs.get(details.tabId, (tab) => {
      console.log('Hash change detected, full URL:', tab.url);
      
      // If we're changing to #Private and haven't processed this tab
      if (tab.url.includes('#Private') && !processedTabs.has(details.tabId)) {
        console.log('Private URL via hash change detected');
        processedTabs.add(details.tabId);
        handleTargetNavigation(details);
      }
    });
  }
}, { url: [{ urlPrefix: 'https://144.122.219.194/' }] });

// Listen for hash changes that don't trigger history API
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.startsWith('https://144.122.219.194/')) {
    console.log('Tab updated:', tab.url);
    
    // If we're changing to #Private and haven't processed this tab
    if (tab.url.includes('#Private') && !processedTabs.has(tabId)) {
      console.log('Private URL via tab update detected');
      processedTabs.add(tabId);
      
      // Create a details object to match what handleTargetNavigation expects
      const details = {
        tabId: tabId,
        url: tab.url
      };
      
      handleTargetNavigation(details);
    }
  }
});

// Function to send headers to content script
function sendHeadersToContentScript(tabId, headers) {
  console.log('Sending headers to content script in tab:', tabId);
  chrome.tabs.sendMessage(tabId, {
    type: 'HEADERS_FROM_BACKGROUND',
    headers: headers
  }, function(response) {
    if (chrome.runtime.lastError) {
      console.error('Error sending headers to content script:', chrome.runtime.lastError);
    } else if (response && response.success) {
      console.log('Headers successfully delivered to content script');
    }
  });
}

// Separate function to handle the navigation
function handleTargetNavigation(details) {
  console.log('Processing navigation to target URL:', details.url);
  
  // Save original URL
  const originalUrl = details.url;
  
  // Execute script to show loading overlay
  chrome.scripting.executeScript({
    target: { tabId: details.tabId },
    func: function() {
      // Create loading overlay
      const overlay = document.createElement('div');
      overlay.id = 'e-sbsl-loading-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      `;
      
      overlay.innerHTML = `
        <h2>Preparing secure request...</h2>
        <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; 
                   border-top: 5px solid #3498db; border-radius: 50%; 
                   animation: spin 2s linear infinite;"></div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      
      document.body.appendChild(overlay);
    }
  });
  
  // Start authentication process
  showPinPopup('sign', 'Signature Request', 'HTTP Request Signing')
    .then(pin => {
      console.log('PIN received');
      return browserApi.signPayload(pin, originalUrl);
    })
    .then(signResponse => {
      console.log('Sign response:', signResponse);
      
      if (!signResponse.success) {
        throw new Error('Signing failed: ' + (signResponse.error || 'Unknown error'));
      }
      
      // Store the signature and userId for the content script to use
      const authHeaders = {
        'X-E-SBSL-Signature': signResponse.data,
        'X-E-SBSL-UserId': 'yigittesthttp1'
      };
      
      // Store these in local storage for the content script to access
      chrome.storage.local.set({
        'e_sbsl_signature': signResponse.data,
        'e_sbsl_userId': 'yigittesthttp1',
        'e_sbsl_targetUrl': originalUrl,
        'e_sbsl_timestamp': Date.now()
      }, function() {
        console.log('Stored authentication data for content script');
      });
      
      // Send headers to content script as well
      sendHeadersToContentScript(details.tabId, authHeaders);
      
      console.log('Making authenticated fetch request');
      return fetch(originalUrl, {
        headers: {
          'X-E-SBSL-Signature': signResponse.data,
          'X-E-SBSL-UserId': 'yigittesthttp1'
        }
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      console.log('Authenticated response received');
      return response.text();
    })
    .then(authenticatedContent => {
      console.log('Received authenticated content, length:', authenticatedContent.length);
      
      // Replace page content
      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        func: function(content, url) {
          // Remove loading overlay if it exists
          const overlay = document.getElementById('e-sbsl-loading-overlay');
          if (overlay) {
            overlay.remove();
          }
          
          // Replace content
          document.open();
          document.write(content);
          document.close();
          
          // Make sure URL is correct
          if (window.location.href !== url) {
            history.replaceState(null, '', url);
          }
        },
        args: [authenticatedContent, originalUrl]
      });
      
      console.log('Authentication process completed successfully');
    })
    .catch(error => {
      console.error('Authentication error:', error);
      
      // Show error overlay
      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        func: function(errorMessage) {
          // Remove loading overlay if it exists
          const overlay = document.getElementById('e-sbsl-loading-overlay');
          if (overlay) {
            overlay.remove();
          }
          
        },
        args: [error.message]
      });
    });
}

const browserApi = (() => {
  let port = null;
  // Function to initialize the connection
  const connectToNativeHost = () => {
    if (!port) {
      port = chrome.runtime.connectNative('com.esbsl.native_host');
      port.onMessage.addListener((message) => {
        console.log('Received from native:', message);
      });
      port.onDisconnect.addListener(() => {
        console.warn('Native host disconnected');
        port = null; // Reset the port when disconnected
      });
    }
  };
  return {
    sendMessageToNative: async (module, method, params = {}) => {
      try {
        console.log(`Sending message to native host - Module: ${module}, Method: ${method}`);
        
        const message = {
          module,
          method,
          params
        };
        connectToNativeHost(); // Ensure connection is open
        return new Promise((resolve, reject) => {
          if (port) {
            port.postMessage(message);
            
            // FIX: Using a named function for the listener so we can remove it later
            const messageListener = function(response) {
              console.log('Native host response:', response);
              port.onMessage.removeListener(messageListener); // Remove listener after response
              resolve(response);
            };
            port.onMessage.addListener(messageListener);
          } else {
            reject(new Error('Failed to connect to native host'));
          }
        });
      } catch (error) {
        console.error('Native message error:', error);
        throw error;
      }
    },
    verifyPIN: async (pin) => {
      return await browserApi.sendMessageToNative(
        'auth',
        'login',
        { pin }
      );
    },
    logout: async () => {
      return await browserApi.sendMessageToNative(
        'auth',
        'logout'
      );
    },
    signPayload: async (pin, payload) => {
      return await browserApi.sendMessageToNative(
        'http',
        'signPayload',
        { pin, payload }
      );
    },
  
    signDocument: async (filename) => {
      return await browserApi.sendMessageToNative(
        'sign',
        'sign_method',
        {filename}
      );
    },

    signText: async (text) => {
      return await browserApi.sendMessageToNative(
          'sign',
          'sign_text_method',
          { text }
      );
  },

  // Yeni fonksiyon: E-posta metnini şifrelemek için
  encryptEmail: async (text, keypath) => {
      return await browserApi.sendMessageToNative(
          'encrypt',
          'encrypt_email',
          { text, keypath }
      );
  },

  // E-posta metninin şifresini çözmek için
  decryptEmail: async (encryptedText) => {
      return await browserApi.sendMessageToNative(
          'encrypt',
          'decrypt_email',
          { encryptedText }
      );
  },

  
    encryptData: async (filename) => {
      return await browserApi.sendMessageToNative(
        'encrypt',
        'encrypt_method',
        {filename}
      );
    },
    decryptData: async (filename, keyfile) => {
      return await browserApi.sendMessageToNative(
        'encrypt',
        'decrypt_method',
        {filename, keyfile}
      );
    },
    verifySignature: async (filename, signature) => {
      return await browserApi.sendMessageToNative(
        'sign',
        'verify_method',
        {filename, signature}
      );
    },
    savePubkey: async (file) => {
      return await browserApi.sendMessageToNative(
        'save',
        'pub_key',
        {file}
      );
    },
    encryptWithPubkey: async (filename, keypath) => {
      return await browserApi.sendMessageToNative(
        'encrypt',
        'encrypt_method_pk',
        {filename, keypath}
      );
    },
    getPublicKey: async (pin) => {
      return await browserApi.sendMessageToNative(
        'api',
        'sharePubKey',
        { pin }
      );
    },
    signChallenge: async (challenge, pin) => {
      return await browserApi.sendMessageToNative(
        'api',
        'signChallenge',
        { challenge, pin }
      );
    }
  };
})();

function authenticate() {
  return new Promise((resolve, reject) => {
      console.log('Starting Gmail authentication process');

      chrome.identity.getAuthToken({ interactive: true }, function (token) {
          if (chrome.runtime.lastError) {
              console.error('Authentication error:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
              return;
          }

          if (token) {
              console.log('Authentication successful, token received');
              chrome.storage.local.set({ 'authToken': token }, function () {
                  console.log('Authentication token saved successfully');
                  resolve(token);
              });
          } else {
              console.error('No authentication token received');
              reject(new Error('Failed to obtain authentication token'));
          }
      });
  });
}


function getStoredToken() {
  return new Promise((resolve, reject) => {
      chrome.storage.local.get('authToken', function (data) {
          if (chrome.runtime.lastError) {
              console.error('Error retrieving stored token:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
              return;
          }

          if (data.authToken) {
              console.log('Using stored authentication token');
              resolve(data.authToken);
          } else {
              console.log('No stored token found, authenticating...');
              authenticate()
                  .then(resolve)
                  .catch(reject);
          }
      });
  });
}


async function sendEmail(to, subject, body, attachments = []) {
  console.log('Sending email to:', to);
  console.log('Email subject:', subject);
  console.log('Email body length:', body.length);
  console.log('Attachments count:', attachments.length);

  try {
      const token = await getStoredToken();
      console.log('Got authentication token for email sending');

      // Email format - multipart if attachments exist
      let emailLines = [];
      const boundary = `----=Part_Boundary_${Date.now()}`;

      // Headers
      emailLines.push(`To: ${to}`);
      emailLines.push(`Subject: ${subject}`);
      emailLines.push('MIME-Version: 1.0');

      // If we have attachments, use multipart format
      if (attachments && attachments.length > 0) {
          emailLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
          emailLines.push(''); // Empty line before first boundary

          // Body part
          emailLines.push(`--${boundary}`);
          emailLines.push('Content-Type: text/plain; charset="UTF-8"');
          emailLines.push('Content-Transfer-Encoding: 7bit');
          emailLines.push(''); // Empty line before body content
          emailLines.push(body);
          emailLines.push(''); // Empty line after body content

          // Attachment parts
          for (const attachment of attachments) {
              emailLines.push(`--${boundary}`);
              emailLines.push(`Content-Type: ${attachment.mimeType}`);
              emailLines.push('Content-Transfer-Encoding: base64');

              const encodedFilename = encodeURIComponent(attachment.filename);
              emailLines.push(`Content-Disposition: attachment; filename*=UTF-8''${encodedFilename}`);
              emailLines.push(''); // Empty line before attachment content
              emailLines.push(attachment.content);
              emailLines.push(''); // Empty line after attachment content
          }

          // Final boundary
          emailLines.push(`--${boundary}--`);
      } else {
          // Simple format if no attachments
          emailLines.push('Content-Type: text/plain; charset="UTF-8"');
          emailLines.push('Content-Transfer-Encoding: 7bit');
          emailLines.push(''); // Empty line before body content
          emailLines.push(body);
      }

      // Join all lines with CRLF
      const email = emailLines.join('\r\n');

      // Base64 encoding
      const encodedEmail = btoa(unescape(encodeURIComponent(email)))
          .replace(/\+/g, '-') // Replace + with -
          .replace(/\//g, '_') // Replace / with _
          .replace(/=+$/, ''); // Remove trailing = padding

      console.log('Sending request to Gmail API');

      // Make API request
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              'raw': encodedEmail
          })
      });

      // Check response
      if (!response.ok) {
          const errorText = await response.text();
          console.error('Gmail API error response:', errorText);
          throw new Error(`Email sending failed: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const result = await response.json();
      console.log('Email sent successfully:', result);
      return { success: true, result };
  } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
  }
}

async function showPinPopup(actionType, websiteName, email) {
  return new Promise((resolve, reject) => {
    const popupDetails = {
      type: 'popup',
      url: chrome.runtime.getURL('pin-popup.html') + 
           `?action=${actionType}&websiteName=${encodeURIComponent(websiteName)}&email=${encodeURIComponent(email)}`,
      width: 400,
      height: 500
    };
    
    console.log('Opening PIN popup with details:', popupDetails);
    
    // Generate a unique request ID
    const requestId = `pin_request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Created request ID:', requestId);
    
    // Create the message listener first before opening the popup
    // FIX: Using a named function for the listener so we can remove it properly
    const responseListener = function(message, sender, sendResponse) {
      console.log('Received message in background:', message);
      
      if (message.type === 'PIN_RESPONSE' && message.requestId === requestId) {
        console.log('PIN response matched request ID:', requestId);
        
        // Clean up
        chrome.runtime.onMessage.removeListener(responseListener);
        
        // Clear stored data
        chrome.storage.local.remove([requestId, 'currentPinRequestId', 'pinPopupWindowId']);
        
        // Resolve or reject based on response
        if (message.success) {
          console.log('PIN received successfully');
          resolve(message.pin);
        } else {
          console.log('PIN entry failed:', message.error);
          reject(new Error(message.error || 'User cancelled the operation'));
        }
        
        // Acknowledge receipt
        if (sendResponse) {
          sendResponse({ received: true });
        }
        
        return true;
      }
      return false;
    };
    
    // Register listener
    chrome.runtime.onMessage.addListener(responseListener);
    console.log('Registered PIN response listener');
    
    // Store request data
    chrome.storage.local.set({
      [requestId]: {
        action: actionType,
        websiteName,
        email,
        timeStamp: Date.now()
      },
      currentPinRequestId: requestId  // Set this immediately
    }, () => {
      console.log('Stored request data with ID:', requestId);
      
      // Open the popup window
      chrome.windows.create(popupDetails, (window) => {
        if (chrome.runtime.lastError) {
          console.error('Error opening PIN popup:', chrome.runtime.lastError);
          chrome.runtime.onMessage.removeListener(responseListener);
          chrome.storage.local.remove([requestId, 'currentPinRequestId']);
          reject(new Error('Could not open PIN popup: ' + chrome.runtime.lastError.message));
          return;
        }
        
        console.log('Popup window created with ID:', window.id);
        
        // Store the window ID
        chrome.storage.local.set({ 
          pinPopupWindowId: window.id 
        });
        
        // Set a timeout to auto-close after 2 minutes if no response
        const timeoutId = setTimeout(() => {
          console.log('PIN entry timed out for request:', requestId);
          chrome.runtime.onMessage.removeListener(responseListener);
          chrome.storage.local.remove([requestId, 'currentPinRequestId', 'pinPopupWindowId']);
          
          // Try to close the window if it's still open
          chrome.windows.get(window.id, (windowInfo) => {
            if (!chrome.runtime.lastError) {
              chrome.windows.remove(window.id).catch(() => {});
            }
          });
          
          reject(new Error('PIN entry timed out'));
        }, 2 * 60 * 1000);
        
        // Store the timeout ID to clear it if needed
        chrome.storage.local.set({ [`${requestId}_timeout`]: timeoutId });
      });
    });
  });
}

// UPDATED: Account creation handler
async function handleAccountCreation(data, tabId) {
  console.log('Handling account creation for:', data.email);
  
  try {
    // Show PIN popup to collect PIN securely
    const pin = await showPinPopup('register', data.websiteName || 'Unknown Website', data.email);
    
    const pubKeyResponse = await browserApi.getPublicKey(pin);
    
    if (!pubKeyResponse.success) {
      throw new Error('Failed to get public key: ' + (pubKeyResponse.error || 'Unknown error'));
    }
    
    return {
      action: 'CREATE_ACCOUNT_RESPONSE',
      data: {
        success: true,
        publicKey: pubKeyResponse.data
      }
    };
  } catch (error) {
    console.error('Account creation error:', error);
    return {
      action: 'CREATE_ACCOUNT_RESPONSE',
      data: {
        success: false,
        error: error.message || 'Failed to create account'
      }
    };
  }
}

async function handleLogin(data, tabId) {
  console.log('Handling login for:', data.email);
  console.log('With challenge:', data.challenge);
  
  try {
    // Show PIN popup to collect PIN securely
    const pin = await showPinPopup('login', data.websiteName || 'Unknown Website', data.email);
    const signResponse = await browserApi.signChallenge(data.challenge, pin);
    if (!signResponse.success) {
      throw new Error('Failed to sign challenge: ' + (signResponse.error || 'Unknown error'));
    }
    
    return {
      action: 'LOGIN_RESPONSE',
      data: {
        success: true,
        signature: signResponse.data
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      action: 'LOGIN_RESPONSE',
      data: {
        success: false,
        error: error.message || 'Failed to login'
      }
    };
  }
}

const serverAPI = {
  baseUrl: 'https://getauth.com.tr:3030', // Server URL

  // Sunucu bağlantısını test etme
  async testConnection() {
      try {
          console.log('Testing server connection');
          const response = await fetch(`${this.baseUrl}/api/data`);

          if (!response.ok) {
              throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Server test successful:', data);
          return { success: true, data };
      } catch (error) {
          console.error('Server test failed:', error);
          return { success: false, error: error.message };
      }
  },

  // Gmail users tablosunda e-posta adresi arama
  async getGmailUserByEmail(email) {
      try {
          console.log('Getting Gmail user by email:', email);
          const response = await fetch(`${this.baseUrl}/api/getGmailUserByEmail`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  module: 'database',
                  method: 'getGmailUserByEmail',
                  params: { email }
              })
          });

          if (!response.ok) {
              throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Gmail user response:', data);

          if (data.message === 'Success' && data.user) {
              return { success: true, user: data.user };
          }

          return { success: false, message: 'Gmail user not found' };
      } catch (error) {
          console.error('Error getting Gmail user:', error);
          return { success: false, error: error.message };
      }
  },

  // Users tablosunda e-posta adresi arama
  async getUserByEmail(email) {
      try {
          console.log('Getting user by email:', email);
          const response = await fetch(`${this.baseUrl}/api/getUserByEmail`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  module: 'database',
                  method: 'getUserByEmail',
                  params: { email }
              })
          });

          if (!response.ok) {
              throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('User response:', data);

          if (data.message === 'Success' && data.user) {
              return { success: true, user: data.user };
          }

          return { success: false, message: 'User not found' };
      } catch (error) {
          console.error('Error getting user:', error);
          return { success: false, error: error.message };
      }
  },

  // İmza doğrulama
  async verifyEmailSignature(email, signature) {
      try {
          console.log('Verifying email signature for:', email);
          const response = await fetch(`${this.baseUrl}/api/verifyEmailSignature`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  email,
                  signature
              })
          });

          if (!response.ok) {
              throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Signature verification response:', data);

          return data;
      } catch (error) {
          console.error('Error verifying signature:', error);
          return { success: false, error: error.message };
      }
  }
};

async function checkSenderEmail(email) {
  console.log('Checking sender email in database:', email);
  try {
      // Önce Gmail kullanıcıları için endpoint'i dene
      const gmailResponse = await fetch('https://getauth.com.tr:3030/api/getGmailUserByEmail', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
              module: 'database',
              method: 'getGmailUserByEmail',
              params: { email }
          }),
          // SSL sertifikası doğrulamasını atla
          mode: 'no-cors'
      });
      console.log('Gmail user endpoint response status:', gmailResponse.status);
      if (gmailResponse.ok) {
          const gmailData = await gmailResponse.json();
          console.log('Gmail user response:', gmailData);
          if (gmailData.message === 'Success' && gmailData.user) {
              return {
                  success: true,
                  user: gmailData.user
              };
          }
      }
      // Eğer Gmail kullanıcısı bulunamazsa, normal kullanıcılar için dene
      const userResponse = await fetch('https://getauth.com.tr:3030/api/getUserByEmail', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
              module: 'database',
              method: 'getUserByEmail',
              params: { email }
          }),
          // SSL sertifikası doğrulamasını atla
          mode: 'no-cors'
      });
      console.log('User endpoint response status:', userResponse.status);
      if (!userResponse.ok) {
          console.error('Server responded with error:', userResponse.status);
          return {
              success: false,
              message: `Server error: ${userResponse.status}`
          };
      }
      const userData = await userResponse.json();
      console.log('User response:', userData);
      if (userData.message === 'Success' && userData.user) {
          return {
              success: true,
              user: userData.user
          };
      } else {
          return {
              success: false,
              message: userData.message || 'Kullanıcı bulunamadı'
          };
      }
  } catch (error) {
      console.error('Error checking sender in database:', error);
      return {
          success: false,
          message: error.message || 'Bağlantı hatası'
      };
  }
}