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
                port = null;
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

                connectToNativeHost();

                return new Promise((resolve, reject) => {
                    if (port) {
                        port.postMessage(message);
                        port.onMessage.addListener(function listener(response) {
                            console.log('Native host response:', response);
                            port.onMessage.removeListener(listener);
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
                { filename }
            );
        },

        signPDFDocument: async (filename) => {
            return await browserApi.sendMessageToNative(
                'sign',
                'sign_pdf',
                { filename }
            );
        },

        signOfficeDocument: async (filename) => {
            return await browserApi.sendMessageToNative(
                'sign',
                'sign_office',
                { filename }
            );
        },

        signText: async (text) => {
            return await browserApi.sendMessageToNative(
                'sign',
                'sign_text_method',
                { text }
            );
        },

        // Yeni fonksiyon: E-posta metnini �ifrelemek i�in
        encryptEmail: async (text, keypath) => {
            return await browserApi.sendMessageToNative(
                'encrypt',
                'encrypt_email',
                { text, keypath }
            );
        },

        // E-posta metninin �ifresini ��zmek i�in
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
                { filename }
            );
        },

        decryptData: async (filename, keyfile) => {
            return await browserApi.sendMessageToNative(
                'encrypt',
                'decrypt_method',
                { filename, keyfile }
            );
        },

        verifySignature: async (filename, signature) => {
            return await browserApi.sendMessageToNative(
                'sign',
                'verify_method',
                { filename, signature }
            );
        },

        savePubkey: async (file) => {
            return await browserApi.sendMessageToNative(
                'save',
                'pub_key',
                { file }
            );
        },

        encryptWithPubkey: async (filename, keypath) => {
            return await browserApi.sendMessageToNative(
                'encrypt',
                'encrypt_method_pk',
                { filename, keypath }
            );
        }
    };
})();

export default browserApi;