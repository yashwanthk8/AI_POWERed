const axios = require('axios');

// Target server URL
const UPLOAD_SERVER_URL = 'https://ai-powered-5nqe.onrender.com/upload';

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('Received upload request');
    
    // Instead of trying to parse the multipart form, simply forward the request
    // This is a simpler approach that lets the backend handle the parsing
    const response = await axios({
      method: 'post',
      url: UPLOAD_SERVER_URL,
      // Just pass through the headers and body as-is
      headers: {
        ...event.headers,
        // These headers might need to be adjusted
        'origin': 'https://finalaipowered.netlify.app',
        'host': 'ai-powered-5nqe.onrender.com'
      },
      // The body is already the raw form data
      data: Buffer.from(event.body, 'base64'),
      // Don't transform the data
      transformRequest: [(data) => data],
    });
    
    console.log('Server response status:', response.status);
    
    // Return the server's response
    return {
      statusCode: response.status,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error in serverless function:', error.message);
    
    // Return appropriate error response
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: 'Error processing upload',
        message: error.message,
        details: error.response?.data || 'No additional details available'
      })
    };
  }
}; 