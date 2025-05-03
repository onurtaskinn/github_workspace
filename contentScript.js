console.log('E-SBSL Content script loaded');

// E-Signature Authentication Integration for private URLs
(function() {
  console.log('E-Signature Authentication content script initialized - Hash: ' + window.location.hash);
  
  // Check if this is the private URL and we have auth data to apply
  async function handlePrivateUrl() {
    console.log('handlePrivateUrl called - Current URL: ' + window.location.href);
    console.log('Current hash: ' + window.location.hash);
    
    if (window.location.href.startsWith('https://144.122.219.194/')) {
      console.log('On target domain');
      
      // Check for authentication data regardless of hash
      chrome.storage.local.get(['e_sbsl_signature', 'e_sbsl_userId', 'e_sbsl_targetUrl', 'e_sbsl_timestamp'], async function(data) {
        console.log('Storage data retrieved:', data);
        
        // Check if we have auth data that's recent (less than 30 seconds old)
        const isDataRecent = data.e_sbsl_timestamp && 
                           (Date.now() - data.e_sbsl_timestamp < 30000);
                           
        // Only proceed if we have the auth data and it's recent
        if (data.e_sbsl_signature && data.e_sbsl_userId && isDataRecent) {
          console.log('Found valid authentication data, applying to request');
          
          try {
            // Clear the auth data from storage after we use it
            chrome.storage.local.remove(['e_sbsl_signature', 'e_sbsl_userId', 'e_sbsl_targetUrl', 'e_sbsl_timestamp']);
            
            // Get the base URL without the hash
            const baseUrl = window.location.href.split('#')[0];
            // Create the full URL with the Private hash
            const targetUrl = baseUrl + '#Private';
            
            console.log('Making authenticated fetch request to:', targetUrl);
            
            // Create a fetch request with our custom headers
            const response = await fetch(targetUrl, {
              method: 'GET',
              headers: {
                'X-E-SBSL-Signature': data.e_sbsl_signature,
                'X-E-SBSL-UserId': data.e_sbsl_userId
              }
            });
            
            if (!response.ok) {
              throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            console.log('Received response from server');
            // Get the authenticated response
            const text = await response.text();
            console.log('Response text retrieved, length: ' + text.length);
            
            // Set the hash to #Private if it's not already
            if (window.location.hash !== '#Private') {
              console.log('Setting URL hash to #Private');
              history.replaceState(null, '', targetUrl);
            }
            
            // Store the headers in sessionStorage for the website script
            sessionStorage.setItem('X-E-SBSL-UserId', data.e_sbsl_userId);
            sessionStorage.setItem('X-E-SBSL-Signature', data.e_sbsl_signature);
            
            // Dispatch custom event for the website to use the headers
            console.log('Dispatching extensionHeadersReceived event');
            document.dispatchEvent(new CustomEvent('extensionHeadersReceived', {
              detail: {
                userId: data.e_sbsl_userId,
                signature: data.e_sbsl_signature
              }
            }));
            
            // Direct DOM replacement approach
            console.log('Replacing page content');
            document.documentElement.innerHTML = text;
            
            // After content is loaded, re-dispatch headers event for the new DOM
            setTimeout(() => {
              console.log('Re-dispatching extensionHeadersReceived event after DOM replacement');
              document.dispatchEvent(new CustomEvent('extensionHeadersReceived', {
                detail: {
                  userId: data.e_sbsl_userId,
                  signature: data.e_sbsl_signature
                }
              }));
            }, 500);
            
            console.log('Successfully loaded authenticated content');
          } catch (error) {
            console.error('Error applying authentication:', error);
          }
        } else if (window.location.hash === '#Private') {
          console.log('On Private URL but no recent auth data found');
          
          // Check if we have headers stored in sessionStorage from a previous load
          const storedUserId = sessionStorage.getItem('X-E-SBSL-UserId');
          const storedSignature = sessionStorage.getItem('X-E-SBSL-Signature');
          
          if (storedUserId && storedSignature) {
            console.log('Found stored authentication headers in sessionStorage');
            
            // Notify the website about the stored headers
            document.dispatchEvent(new CustomEvent('extensionHeadersReceived', {
              detail: {
                userId: storedUserId,
                signature: storedSignature
              }
            }));
          } else {
            console.log('No stored authentication headers found');
            
            // If we're on #Private but have no auth data, notify background script
            console.log('Notifying background script about private section');
            chrome.runtime.sendMessage({
              action: 'PRIVATE_SECTION_DETECTED',
              url: window.location.href
            });
          }
        } else {
          console.log('Not a Private hash: ' + window.location.hash);
        }
      });
    } else {
      console.log('Not on target domain');
    }
  }
  
  // Call our function when the page loads
  console.log('Setting up event listeners');
  
  // We need to handle multiple potential loading points
  window.addEventListener('load', function() {
    console.log('Window load event fired');
    handlePrivateUrl();
  });
  
  window.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    handlePrivateUrl();
  });
  
  // Run immediately as well
  console.log('Running handlePrivateUrl immediately');
  handlePrivateUrl();
  
  // Listen for hash changes to detect #Private navigation
  window.addEventListener('hashchange', function() {
    console.log('Hash changed to: ' + window.location.hash);
    if (window.location.hash === '#Private') {
      handlePrivateUrl();
    }
  });
  
  // Also listen for messages from the website
  window.addEventListener('message', function(event) {
    // We only accept messages from the same window
    if (event.source !== window) return;
    
    const message = event.data;
    
    // Check if the message is intended for our extension
    if (message.type !== 'FROM_PAGE_TO_EXTENSION_API') return;
    
    console.log('Content script received message from page:', message);
    
    // Modify the message for the new PIN handling approach
    let modifiedMessage = { ...message };
    
    // For new PIN-less API approach
    if (message.action === 'INITIATE_ACCOUNT_CREATION') {
      modifiedMessage.action = 'INITIATE_ACCOUNT_CREATION';
      modifiedMessage.data = {
        email: message.data.email,
        websiteName: message.data.websiteName
      };
    }
    else if (message.action === 'INITIATE_LOGIN') {
      modifiedMessage.action = 'INITIATE_LOGIN';
      modifiedMessage.data = {
        email: message.data.email,
        challenge: message.data.challenge,
        websiteName: message.data.websiteName
      };
    }
    
    // Forward the message to the background script
    chrome.runtime.sendMessage(modifiedMessage, function(response) {
      // Handle any response errors
      if (chrome.runtime.lastError) {
        console.error('Error sending message to background script:', chrome.runtime.lastError);
        
        // Send error back to page
        window.postMessage({
          type: 'FROM_EXTENSION_TO_PAGE_API',
          action: message.action + '_RESPONSE',
          data: {
            success: false,
            error: 'Extension communication error: ' + chrome.runtime.lastError.message
          }
        }, '*');
        
        return;
      }
      
      console.log('Received response from background script:', response);
      
      // Forward the background script's response back to the page
      window.postMessage({
        type: 'FROM_EXTENSION_TO_PAGE_API',
        action: response.action,
        data: response.data
      }, '*');
    });
  });
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('Content script received message from background:', message);
    
    // Handle headers from background script
    if (message.type === 'HEADERS_FROM_BACKGROUND') {
      console.log('Received headers from background script:', message.headers);
      
      // Store in sessionStorage for persistence
      sessionStorage.setItem('X-E-SBSL-UserId', message.headers['X-E-SBSL-UserId']);
      sessionStorage.setItem('X-E-SBSL-Signature', message.headers['X-E-SBSL-Signature']);
      
      // Store in local storage with timestamp for recent use
      chrome.storage.local.set({
        'e_sbsl_signature': message.headers['X-E-SBSL-Signature'],
        'e_sbsl_userId': message.headers['X-E-SBSL-UserId'],
        'e_sbsl_targetUrl': window.location.href,
        'e_sbsl_timestamp': Date.now()
      }, function() {
        console.log('Stored authentication headers in local storage');
      });
      
      // Dispatch event for website to use
      document.dispatchEvent(new CustomEvent('extensionHeadersReceived', {
        detail: {
          userId: message.headers['X-E-SBSL-UserId'],
          signature: message.headers['X-E-SBSL-Signature']
        }
      }));
      
      sendResponse({ success: true });
    }
    else if (message.target === 'CONTENT_SCRIPT') {
      // Forward to webpage
      window.postMessage({
        type: 'FROM_EXTENSION_TO_PAGE_API',
        action: message.action,
        data: message.data
      }, '*');
      
      // Acknowledge receipt
      sendResponse({ received: true });
    }
    
    // Required for async sendResponse
    return true;
  });
})();

// Gmail integration code
(function () {
  let buttonInjected = false;
  let emailObserver = null;
  let documentObserver = null;
  let signatureCheckInProgress = false;
  let processedEmails = new Set(); // Zaten işlenmiş e-postaları takip etmek için
  let encryptedEmailsProcessed = new Set(); // İşlenmiş şifreli e-postaları takip etmek için

  // Sayfa ile eklenti arasında iletişim kuracak listener
  window.addEventListener('message', function (event) {
      // Sadece kendi penceremizden gelen mesajları kabul et
      if (event.source !== window) return;

      const message = event.data;

      // Sayfadan eklentiye giden mesajları kontrol et
      if (message.type === 'FROM_PAGE_TO_EXTENSION') {
          console.log('Received message from page:', message);

          // Mesajı background script'e ilet
          chrome.runtime.sendMessage(message, function (response) {
              // Background script'ten gelen cevabı sayfaya geri ilet
              window.postMessage({
                  type: 'FROM_EXTENSION_TO_PAGE',
                  action: message.action + '_RESPONSE',
                  data: response
              }, '*');
          });
      }
  });

  // Chrome runtime bağlantı kontrolü
  function isChromeRuntimeAvailable() {
      try {
          // Basit bir test - chrome runtime mevcut mu?
          chrome.runtime.getURL('');
          return true;
      } catch (e) {
          console.error('Chrome runtime bağlantısı kesildi:', e);
          return false;
      }
  }

  // Kalp atışı bağlantısı kurarak background script'in çalıştığını kontrol et
  function setupHeartbeat() {
      try {
          const port = chrome.runtime.connect({ name: "heartbeat" });

          // 10 saniyede bir ping gönder
          const heartbeatInterval = setInterval(() => {
              try {
                  port.postMessage({ ping: true });
              } catch (e) {
                  console.error('Heartbeat error:', e);
                  clearInterval(heartbeatInterval);
              }
          }, 10000);

          port.onMessage.addListener((response) => {
              if (response.pong) {
                  console.log('Background script is alive (pong received)');
              }
          });

          port.onDisconnect.addListener(() => {
              console.log('Heartbeat connection disconnected');
              clearInterval(heartbeatInterval);
          });

          return port;
      } catch (e) {
          console.error('Failed to setup heartbeat:', e);
          return null;
      }
  }

  // Şifreli e-posta içeriğini tespit edip işleme
  function processEncryptedEmail() {
      try {
          const emailBodySelectors = ['.a3s.aiL', '.a3s', '.ii.gt', '.a3s.m9'];

          let emailBodyElement = null;

          // E-posta içeriğini bul
          for (const selector of emailBodySelectors) {
              emailBodyElement = document.querySelector(selector);
              if (emailBodyElement) break;
          }

          if (!emailBodyElement) return;

          // Bu element zaten işlendi mi kontrol et
          if (emailBodyElement.getAttribute('data-encrypted-processed') === 'true') return;
          emailBodyElement.setAttribute('data-encrypted-processed', 'true');

          // E-posta içeriğinde "[ENCRYPTED]" etiketini ara - innerHTML yerine textContent kullan
          const emailText = emailBodyElement.textContent;
          if (!emailText.includes('[ENCRYPTED]')) return;

          console.log('Found encrypted email content');

          // Basitleştirilmiş yaklaşım: Tüm içeriği bir kapsayıcı ile değiştir
          const originalHTML = emailBodyElement.innerHTML;

          // Kapsayıcı oluştur
          const container = document.createElement('div');

          // Orijinal içeriği blur kısmına ekle, ancak görünmez yap
          const hiddenOriginal = document.createElement('div');
          hiddenOriginal.style.display = 'none';
          hiddenOriginal.innerHTML = originalHTML;
          container.appendChild(hiddenOriginal);

          // Şifreli içerik bildirimi ekle
          const notificationDiv = document.createElement('div');
          notificationDiv.style.padding = '20px';
          notificationDiv.style.backgroundColor = '#f0f7ff';
          notificationDiv.style.borderRadius = '8px';
          notificationDiv.style.border = '1px solid #4285f4';
          notificationDiv.style.margin = '10px 0';
          notificationDiv.style.textAlign = 'center';

          notificationDiv.innerHTML = `
          <div style="margin-bottom: 15px; font-weight: bold; color: #4285f4;">
              Bu e-posta şifrelenmiştir
          </div>
          <button id="decrypt-button" style="
              background-color: #4285f4;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              font-weight: 500;
              cursor: pointer;
          ">
              İçeriği Görüntüle
          </button>
      `;

          container.appendChild(notificationDiv);

          // İçeriği değiştir
          emailBodyElement.innerHTML = '';
          emailBodyElement.appendChild(container);

          // Buton click event'i ekle
          document.getElementById('decrypt-button').addEventListener('click', () => {
              // Regex ile şifreli içeriği çıkar
              const encryptedMatch = emailText.match(/\[ENCRYPTED\]([\s\S]*?)$/);
              if (encryptedMatch) {
                  console.log('Encrypted content clicked, opening extension');
                  chrome.runtime.sendMessage({
                      action: 'openDecryptionUI',
                      encryptedContent: encryptedMatch[1].trim()
                  });
              } else {
                  console.error('Could not extract encrypted content');
              }
          });
      } catch (error) {
          console.error('Error processing encrypted email:', error);
      }
  }
  function checkEmailSignature() {
      // Eğer zaten bir kontrol devam ediyorsa çıkış yap
      if (signatureCheckInProgress) return;

      const emailBodySelectors = ['.a3s.aiL', '.a3s', '.ii.gt', '.a3s.m9'];
      const senderSelectors = [
          '.gD',
          'h3.iw',
          '.gb_Fd',
          '.yW span[email]',
          '[role="listitem"] [email]',
          '.yW span[data-hovercard-id]'
      ];

      let emailBodyElement = null;
      let senderEmail = null;

      // E-posta içeriğini bul
      for (const selector of emailBodySelectors) {
          emailBodyElement = document.querySelector(selector);
          if (emailBodyElement) {
              console.log('Found email body with selector:', selector);
              break;
          }
      }

      // Gönderen e-postasını bul
      for (const selector of senderSelectors) {
          const senderElement = document.querySelector(selector);
          if (senderElement) {
              senderEmail = senderElement.getAttribute('email') ||
                  senderElement.getAttribute('data-hovercard-id') ||
                  senderElement.textContent.trim();

              // E-posta formatını kontrol et
              const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
              if (emailRegex.test(senderEmail)) {
                  console.log('Found sender email:', senderEmail);
                  break;
              }
          }
      }

      // E-posta zaten işaretlenmişse veya daha önce işlenmişse tekrar işleme
      if (!emailBodyElement || !senderEmail ||
          emailBodyElement.querySelector('.e-sbsl-signature-verification') ||
          processedEmails.has(senderEmail)) {
          console.log('Skipping check:', {
              hasEmailBody: !!emailBodyElement,
              hasSenderEmail: !!senderEmail,
              alreadyProcessed: processedEmails.has(senderEmail)
          });
          return;
      }

      signatureCheckInProgress = true;

      const emailText = emailBodyElement.innerText;
      console.log('Email text length:', emailText.length);

      const signatureRegex = /-----BEGIN E-SBSL SIGNATURE-----\n(.*?)\n-----END E-SBSL SIGNATURE-----/s;
      const signatureMatch = emailText.match(signatureRegex);

      if (signatureMatch) {
          console.log('Found signature for email:', senderEmail);
          console.log('Signature:', signatureMatch[1]);

          const signatureHex = signatureMatch[1];
          const originalText = emailText.substring(0, signatureMatch.index).trim();
          console.log('Original text:', originalText);

          // XMLHttpRequest kullan
          var xhr = new XMLHttpRequest();
          xhr.open('POST', 'https://getauth.com.tr:3030/api/verifyGmailSignature', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('Access-Control-Allow-Origin', '*');

          xhr.onload = function () {
              try {
                  var response = JSON.parse(xhr.responseText);
                  console.log('Full server response:', response);

                  var signatureVerificationDiv = document.createElement('div');
                  signatureVerificationDiv.classList.add('e-sbsl-signature-verification');

                  if (xhr.status === 200 && response.success) {
                      signatureVerificationDiv.innerHTML = `
                      <div style="
                          background-color: #e6f3ff; 
                          border: 1px solid #4285f4; 
                          color: #4285f4; 
                          padding: 10px; 
                          margin-top: 10px; 
                          border-radius: 4px;
                          font-size: 14px;
                      ">
                          ✅ Signed by: ${response.fullName}
                      </div>
                  `;
                  } else {
                      signatureVerificationDiv.innerHTML = `
                      <div style="
                          background-color: #ffebee; 
                          border: 1px solid #f44336; 
                          color: #f44336; 
                          padding: 10px; 
                          margin-top: 10px; 
                          border-radius: 4px;
                          font-size: 14px;
                      ">
                          ⚠️ Signature verification failed: ${response.message || 'Unknown error'}
                      </div>
                  `;
                  }

                  emailBodyElement.appendChild(signatureVerificationDiv);
                  processedEmails.add(senderEmail);
              } catch (error) {
                  console.error('Error parsing response:', error);
              } finally {
                  signatureCheckInProgress = false;
              }
          };

          xhr.onerror = function () {
              console.error('Error verifying Gmail signature');
              var signatureVerificationDiv = document.createElement('div');
              signatureVerificationDiv.classList.add('e-sbsl-signature-verification');
              signatureVerificationDiv.innerHTML = `
              <div style="
                  background-color: #ffebee; 
                  border: 1px solid #f44336; 
                  color: #f44336; 
                  padding: 10px; 
                  margin-top: 10px; 
                  border-radius: 4px;
                  font-size: 14px;
              ">
                  ⚠️ Signature verification failed: Network Error
              </div>
          `;
              emailBodyElement.appendChild(signatureVerificationDiv);
              processedEmails.add(senderEmail);
              signatureCheckInProgress = false;
          };

          xhr.send(JSON.stringify({
              email: senderEmail,
              originalText: originalText,
              signatureHex: signatureHex
          }));
      } else {
          console.log('No signature found in email');
          signatureCheckInProgress = false;
      }
  }

  // Observer ve diğer fonksiyonları güncelle
  function setupEmailObserver() {
      try {
          if (emailObserver) {
              emailObserver.disconnect();
          }

          // Observer'ı güncelle
          emailObserver = new MutationObserver((mutations) => {
              // E-posta görüntüleme sayfasında olup olmadığımızı kontrol et
              if (window.location.href.includes('/mail/u/') && window.location.href.includes('#inbox/')) {
                  // İmza kontrolü
                  if (!document.querySelector('.e-sbsl-signature-verification')) {
                      checkEmailSignature();
                  }

                  // Şifreli e-posta kontrolü - sadece belirli selektörler varsa çalıştır
                  const emailBodyElement = document.querySelector('.a3s.aiL, .a3s, .ii.gt, .a3s.m9');
                  if (emailBodyElement && !emailBodyElement.getAttribute('data-encrypted-processed')) {
                      processEncryptedEmail();
                  }
              }
          });

          const contentArea = document.querySelector('.AO');
          if (contentArea) {
              emailObserver.observe(contentArea, {
                  childList: true,
                  subtree: true
              });
          } else {
              emailObserver.observe(document.body, {
                  childList: true,
                  subtree: true
              });
          }
      } catch (error) {
          console.error('Error setting up email observer:', error);
      }
  }

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
                  type: 'FROM_PAGE_TO_EXTENSION',
                  action: 'OPEN_SECURE_COMPOSE'
              });
          });

          gmailComposeButton.parentNode.insertBefore(secureButton, gmailComposeButton.nextSibling);
          console.log('Secure compose button injected successfully');
          buttonInjected = true;
      } catch (error) {
          console.error('Error injecting secure compose button:', error);
      }
  }

  // Sayfa içeriğindeki değişiklikleri izleyecek observer
  function setupDocumentObserver() {
      try {
          // Önceki observer'ı temizle
          if (documentObserver) {
              documentObserver.disconnect();
          }

          documentObserver = new MutationObserver((mutations) => {
              try {
                  for (const mutation of mutations) {
                      if (mutation.type === 'childList' && !buttonInjected) {
                          injectComposeButton();
                      }
                  }

                  // E-posta içeriği değişmiş olabilir, kontrol et
                  checkEmailSignature();

                  // Şifreli e-posta kontrolü
                  processEncryptedEmail();
              } catch (error) {
                  console.error('Document observer callback error:', error);
              }
          });

          documentObserver.observe(document.body, {
              childList: true,
              subtree: true
          });
          console.log('Document observer setup successful');
      } catch (error) {
          console.error('Error setting up document observer:', error);
      }
  }

  // Uzantıyı başlat
  function initializeExtension() {
      console.log('Initializing E-SBSL extension');

      // Kalp atışı başlat
      const heartbeatPort = setupHeartbeat();

      // 2 saniye bekleyip başlat (Gmail'in yüklenmesi için)
      setTimeout(() => {
          try {
              // Güvenli e-posta butonunu enjekte et
              injectComposeButton();

              // Mevcut e-postayı kontrol et
              checkEmailSignature();

              // Şifreli e-postaları kontrol et
              processEncryptedEmail();

              // Observer'ları kur
              setupEmailObserver();
              setupDocumentObserver();

              console.log('E-SBSL extension initialized successfully');
          } catch (error) {
              console.error('Error during extension initialization:', error);
          }
      }, 2000);

      // Temizleme fonksiyonu
      window.addEventListener('beforeunload', () => {
          try {
              if (emailObserver) emailObserver.disconnect();
              if (documentObserver) documentObserver.disconnect();
              if (heartbeatPort) heartbeatPort.disconnect();
              console.log('E-SBSL extension cleanup complete');
          } catch (error) {
              console.error('Error during cleanup:', error);
          }
      });
  }

  // Uygulamayı başlat
  initializeExtension();

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
          if (request.action === 'checkGmailButton') {
              sendResponse({ injected: buttonInjected });
          }
      } catch (error) {
          console.error('Error handling message:', error);
      }
      return true;
  });
})();
