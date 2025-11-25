export default function handler(request, response) {
  response.status(200).json({ 
    message: 'API route is working!',
    timestamp: new Date().toISOString(),
    route: '/api/test'
  });
}