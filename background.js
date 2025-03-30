console.log('E-SBSL Background script loaded');

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
                    port.onMessage.addListener(function listener(response) {
                        console.log('Native host response:', response);
                        port.onMessage.removeListener(listener); // Remove listener after response
                        resolve(response);
                    });
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
  
    signDocument: async (filename) => {
      return await browserApi.sendMessageToNative(
        'sign',
        'sign_method',
        {filename}
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
    }

  };
})();



// Gmail OAuth authentication
function authenticate() {
  return new Promise((resolve, reject) => {
    console.log('Starting Gmail authentication process');
    
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        console.error('Authentication error:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      
      if (token) {
        console.log('Authentication successful, token received');
        chrome.storage.local.set({ 'authToken': token }, function() {
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

// Get stored token or authenticate if needed
function getStoredToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('authToken', function(data) {
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

// Send email using Gmail API
async function sendEmail(to, subject, body) {
  console.log('Sending email to:', to);
  
  try {
    const token = await getStoredToken();
    console.log('Got authentication token for email sending');
    
    const email = [
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      'Content-Transfer-Encoding: 7bit',
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\r\n');
    
    const encodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    console.log('Sending request to Gmail API');
    
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
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gmail API error response:', errorText);
      throw new Error(`Email sending failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}


// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request.action);

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
    return true; // Indicates asynchronous response
  }

  // Email sending handler
  else if (request.action === 'sendEmail') { // Changed to else if
    console.log('Processing sendEmail request:', request);
    sendEmail(request.to, request.subject, request.body)
      .then(result => {
        console.log('Email sent successfully');
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Email sending failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates asynchronous response
  }

  // Secure compose handler
  else if (request.action === 'openSecureCompose') { // Added else if
    console.log('Received request to open secure compose from Gmail');
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
    return true; // Indicates asynchronous response
  }

  // Optional: Handle other messages or do nothing
  // else {
  //   console.log('Received unhandled message action:', request.action);
  //   // sendResponse({}); // Send an empty response if needed
  // }

  // If none of the conditions match and you're not sending an async response,
  // you might not need to return true. Returning true is essential only when
  // sendResponse will be called asynchronously (after the listener function initially returns).
});


////////////////////////

let lastCallTime = Date.now();
let timeOutTimeMin = 1;
let timeoutTimeMsec = timeOutTimeMin * 60 * 1000;
let timeoutReached = false;

// Function to reset the timer
const resetTimer = () => {
  lastCallTime = Date.now();
  timeoutReached = false; 
  console.log('Timer reset');
};

const checkTimeout = async () => {
  const currentTime = Date.now();
  if (currentTime - lastCallTime >= timeoutTimeMsec && !timeoutReached) {
    console.log('Timeout reached');
    timeoutReached = true;
    chrome.runtime.sendMessage({ timeoutReached: true });

    const response = await browserApi.logout();
    if (response.success) {
      showNotification('Logged out successfully', 'info');
    }
    else{
      console.log("Failed to logout: " + response);
    }
  }
};

setInterval(checkTimeout, 10000);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'resetTimer') {
    resetTimer();
    sendResponse({ status: 'Timer reset' });
  }
  else if (message.action === 'updateTimeout') {
    timeOutTimeMin = message.timeoutDuration ;
    timeoutTimeMsec = timeOutTimeMin * 60 * 1000;
    console.log(`Timeout duration updated to ${timeOutTimeMin} minutes`);
    sendResponse({ status: 'Timeout updated' });
  }
});

