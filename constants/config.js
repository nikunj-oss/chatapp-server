const corsOptions = {
    origin: [
      "http://localhost:5173", 
      "http://localhost:4173", 
      process.env.CLIENT_URL || "https://chat-app-frontend-9o27j5oey-nikunj-goels-projects.vercel.app"
    ],
    credentials: true, // Allows cookies and authentication headers to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Ensure the correct HTTP methods are allowed
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow custom headers like Authorization
  };

const SYNC_TOKEN="sync-token"

export {corsOptions,SYNC_TOKEN}