document.addEventListener('DOMContentLoaded', function() {
    console.log('PIN popup loaded');
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const websiteName = urlParams.get('websiteName');
    const email = urlParams.get('email');
    
    console.log('URL params:', { action, websiteName, email });
    
    // Set the action title
    const actionTitle = document.getElementById('action-title');
    if (action === 'register') {
        actionTitle.textContent = 'E-Signature Registration';
    } else if (action === 'login') {
        actionTitle.textContent = 'E-Signature Login';
    }
    
    // Set website and email information
    document.getElementById('website-name').textContent = decodeURIComponent(websiteName || 'Unknown');
    document.getElementById('user-email').textContent = decodeURIComponent(email || 'Not provided');
    
    // Focus the PIN input
    const pinInput = document.getElementById('pin-input');
    pinInput.focus();
    
    // Get the current request ID
    chrome.storage.local.get(['currentPinRequestId'], function(result) {
        const requestId = result.currentPinRequestId;
        
        console.log('Retrieved current PIN request ID:', requestId);
        
        if (!requestId) {
            console.error('No active PIN request found');
            window.close();
            return;
        }
        
        // Set up button handlers
        const submitButton = document.getElementById('submit-button');
        const cancelButton = document.getElementById('cancel-button');
        
        // Enter key should submit the form
        pinInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                submitButton.click();
            }
        });
        
        submitButton.addEventListener('click', function() {
            const pin = pinInput.value;
            
            if (pin.trim() === '') {
                alert('Please enter your PIN');
                return;
            }
            
            console.log('Sending PIN response for request:', requestId);
            
            // Send the PIN back to the background script
            chrome.runtime.sendMessage({
                type: 'PIN_RESPONSE',
                requestId: requestId,
                success: true,
                pin: pin
            }, function(response) {
                console.log('PIN response acknowledgement:', response);
                
                // Close the popup even if no response
                setTimeout(() => {
                    window.close();
                }, 500);
            });
            
            // Disable the button to prevent multiple submissions
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            
            // Close the popup
            setTimeout(() => {
                window.close();
            }, 1000);
        });
        
        cancelButton.addEventListener('click', function() {
            console.log('Cancelling PIN request:', requestId);
            
            // Cancel the request
            chrome.runtime.sendMessage({
                type: 'PIN_RESPONSE',
                requestId: requestId,
                success: false,
                error: 'User cancelled the operation'
            }, function(response) {
                console.log('Cancel response acknowledgement:', response);
                
                // Close the popup even if no response
                setTimeout(() => {
                    window.close();
                }, 500);
            });
            
            // Close the popup immediately
            setTimeout(() => {
                window.close();
            }, 1000);
        });
    });
});