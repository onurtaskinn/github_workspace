
const serverDomain = 'https://getauth.com.tr:3030';

async function fetchDataFromServer(dataLocation) {
    const url = serverDomain + '/' + dataLocation;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function sendDataToServer(dataLocation, payload) {
    const url = serverDomain + '/' + dataLocation;
    console.log("url: " + url);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Server Response:', data);
        return data;
    } catch (error) {
        console.error('Error sending data:', error);
    }
}

const serverApi = {
  sendMessageToServer: async (module, method, params = {}) => {
    try {
      console.log(`Sending message to server - Module: ${module}, Method: ${method}, Params:`, params);

      const message = {
        module,
        method,
        params,
      };

      let url = 'api/data';
      if (module === 'database') {
        if (method === 'getPublicKey') {
          url = 'api/getPublicKey';
        } else if (method === 'savePublicKey') {
          url = 'api/savePublicKey';
        }
      }
      console.log('url: ' + url);
      console.log('JSON.stringify(message): ' + JSON.stringify(message));
      console.log('message: ' + message);


      const response = await sendDataToServer(url, message);
      return response;

    } catch (error) {
      console.error('Error sending message to server:', error);
      throw error;
    }
  },

  fetchMessageFromServer: async (module, method, params = {}) => {
    try {
      const message = {
        module,
        method,
        params,
      };

      const url = 'api/data'; 

      const response = await fetchDataFromServer(url); 
      return response;

    } catch (error) {
      console.error('Error fetching message from server:', error);
      throw error;
    }
  },
};

export default serverApi;

