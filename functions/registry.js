import { getRegistry, updateRegistry, authenticate } from './lib/registry-service.js';

export const handler = async (event, context) => {
  // CORS headers
  const headers = {
  'Access-Control-Allow-Origin': '*',  // Allow requests from any origin
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Content-Type': 'application/json'
};

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // GET - Public endpoint to fetch registry
    if (event.httpMethod === 'GET') {
      const registry = await getRegistry();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(registry)
      };
    }
    
    // POST/PUT - Protected endpoints for updates
    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      // Validate authentication token
      const token = event.headers.authorization?.split(' ')[1];
      const isAuthenticated = await authenticate(token);
      
      if (!isAuthenticated) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }
      
      const data = JSON.parse(event.body);
      const result = await updateRegistry(data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
