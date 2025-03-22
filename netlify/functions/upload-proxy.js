const axios = require('axios');
const FormData = require('form-data');
const busboy = require('busboy');

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

  // Parse multipart form data
  const parseMultipartForm = (event) => {
    return new Promise((resolve, reject) => {
      // Create FormData object to collect the parsed data
      const formData = new FormData();
      const fields = {};
      let fileBuffer = null;
      let fileName = '';
      let fileType = '';
      
      // Initialize busboy
      const bb = busboy({ headers: event.headers });
      
      // Handle file data
      bb.on('file', (name, file, info) => {
        const { filename, encoding, mimeType } = info;
        fileName = filename;
        fileType = mimeType;
        
        const chunks = [];
        file.on('data', (data) => {
          chunks.push(data);
        });
        
        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });
      
      // Handle text fields
      bb.on('field', (name, val) => {
        fields[name] = val;
        formData.append(name, val);
      });
      
      // Final event
      bb.on('close', () => {
        if (fileBuffer) {
          formData.append('file', fileBuffer, {
            filename: fileName,
            contentType: fileType
          });
        }
        
        resolve({ formData, fields });
      });
      
      // Parse the event body
      bb.write(Buffer.from(event.body, 'base64'));
      bb.end();
    });
  };
  
  try {
    console.log('Received upload request');
    
    // Parse the multipart form data
    const { formData, fields } = await parseMultipartForm(event);
    
    console.log('Form fields:', fields);
    console.log('File received, forwarding to server');
    
    // Forward the request to the actual server
    const response = await axios.post(UPLOAD_SERVER_URL, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('Server response:', response.status);
    
    // Return the server's response
    return {
      statusCode: response.status,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error in serverless function:', error);
    
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