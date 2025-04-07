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
async function sendEmail(to, subject, body, attachments = []) {
  console.log('Sending email with attachments to:', to);
  try {
      const token = await getStoredToken();
      console.log('Got auth token for email sending');

      // Generate a unique boundary string
      const boundary = `----=Part_Boundary_${Date.now()}`;
      let emailLines = [];

      // --- Construct the MIME message ---

      // 1. Common Headers
      emailLines.push(`To: ${to}`);
      emailLines.push(`Subject: ${subject}`);
      emailLines.push('MIME-Version: 1.0');
      emailLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      emailLines.push(''); // Empty line before first boundary

      // 2. Body Part (Plain Text)
      // Note: To send HTML, this part should be multipart/alternative
      emailLines.push(`--${boundary}`); // Boundary marker
      emailLines.push('Content-Type: text/plain; charset="UTF-8"');
      emailLines.push('MIME-Version: 1.0');
      emailLines.push('Content-Transfer-Encoding: 7bit'); // Use 7bit/8bit for plain text, or base64/quoted-printable if needed
      emailLines.push(''); // Empty line before body content
      emailLines.push(body);
      emailLines.push(''); // Empty line after body content

      // 3. Attachment Parts
      for (const attachment of attachments) {
          emailLines.push(`--${boundary}`); // Boundary marker
          emailLines.push(`Content-Type: ${attachment.mimeType}`); // Use the MIME type from the file object
          emailLines.push('Content-Transfer-Encoding: base64');
          // Use filename*=UTF-8'' syntax for broader compatibility with non-ASCII filenames
          const encodedFilename = encodeURIComponent(attachment.filename);
          emailLines.push(`Content-Disposition: attachment; filename*=UTF-8''${encodedFilename}`);
          // Fallback filename for older clients
          // emailLines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`); // Simpler alternative if UTF-8 filenames aren't needed
          emailLines.push(''); // Empty line before attachment content
          // Add base64 content, ensuring it's chunked correctly if very large (though usually handled by fetch)
          emailLines.push(attachment.content);
          emailLines.push(''); // Empty line after attachment content
      }

      // 4. Final Boundary Marker
      emailLines.push(`--${boundary}--`);

      // Join all lines with CRLF (\r\n) which is standard for email
      const email = emailLines.join('\r\n');

      // --- Base64URL Encode the entire MIME message ---
      // Standard requires UTF-8 -> bytes -> base64url
      // Using btoa after unescape(encodeURIComponent(email)) simulates this for common characters
      
      console.log('email_lines:', emailLines);
      console.log('email:', email);

      const encodedEmail = btoa(unescape(encodeURIComponent(email)))
          .replace(/\+/g, '-') // Replace + with -
          .replace(/\//g, '_') // Replace / with _
          .replace(/=+$/, ''); // Remove trailing = padding

      console.log('Encoded email:', encodedEmail);

      console.log('Sending request to Gmail API with attachments');

      // --- Make the API Call ---
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              'raw': encodedEmail // Send the base64url encoded MIME message
          })
      });

      // --- Handle Response ---
      if (!response.ok) {
          const errorText = await response.text();
          console.error('Gmail API error response:', errorText);
          // Attempt to parse error JSON for more details if possible
          let errorDetail = `Email sending failed: ${response.status} ${response.statusText}`;
           try {
             const errorJson = JSON.parse(errorText);
             if (errorJson.error && errorJson.error.message) {
               errorDetail += ` - ${errorJson.error.message}`;
             }
           } catch (e) { /* Ignore parsing error */ }
          throw new Error(errorDetail);
      }

      const result = await response.json();
      console.log('Email with attachments sent successfully:', result);
      return result;

  } catch (error) {
      console.error('Error sending email with attachments:', error);
      // Rethrow the error so the caller knows it failed
      throw error;
  }
}



// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request.action);

  // Gmail authentication handler (Keep as is)
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

  // MODIFIED: Email sending handler (handles attachments)
  if (request.action === 'sendEmail') {
    console.log('Processing sendEmail request:', request);

    // Ensure attachments is an array, even if undefined/null
    const attachments = request.attachments || [];

    sendEmail(request.to, request.subject, request.body, attachments) // Pass attachments array
      .then(result => {
        console.log('Email sent successfully callback');
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Email sending failed callback:', error);
        // Send back the specific error message from the sendEmail function
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates asynchronous response
  }

  // Handler for opening popup from content script (Keep as is)
  if (request.action === 'openSecureCompose') {
      console.log('Received request to open secure compose from Gmail');
      chrome.action.openPopup().then(() => {
          setTimeout(() => {
              chrome.runtime.sendMessage({ action: 'openGmailCompose', source: 'gmail' });
          }, 500);
      }).catch(error => {
          console.error('Error opening popup:', error);
          chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?action=composeEmail') });
      });
      sendResponse({ success: true });
      return true;
  }

   // Handlers for timeout timer (Keep as is)
   if (request.action === 'resetTimer') {
      resetTimer(); // Assuming resetTimer exists
      sendResponse({ status: 'Timer reset' });
      return true;
   }
   if (request.action === 'updateTimeout') {
     // Assuming timeout variables exist (timeOutTimeMin, timeoutTimeMsec)
     timeOutTimeMin = request.timeoutDuration ;
     timeoutTimeMsec = timeOutTimeMin * 60 * 1000;
     console.log(`Timeout duration updated to ${timeOutTimeMin} minutes`);
     sendResponse({ status: 'Timeout updated' });
     return true;
   }

   console.log("Unhandled message action:", request.action);
   sendResponse({ success: false, error: "Unknown action" });
   return false; // Or true if any handler might be async
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

