import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', port: PORT });
});

// Generic proxy endpoint if needed for server-side operations
app.get('/api/init', async (req, res) => {
    try {
        // This would normally fetch from Supabase, but since we're using client-side Supabase,
        // the frontend handles all data operations directly
        res.json({ 
            message: 'Data should be fetched directly from Supabase in the frontend',
            projects: [],
            tasks: [],
            documents: []
        });
    } catch (err) {
        console.error('Error in /api/init:', err);
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Supabase integration: Client-side operations');
});

export default app;