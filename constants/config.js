const corsOptions={
    
    origin:["http://localhost:5173","http://localhost:4173",process.env.CLIENT_URL],
    credentials:true //we can send headers
    
}

const SYNC_TOKEN="sync-token"

export {corsOptions,SYNC_TOKEN}