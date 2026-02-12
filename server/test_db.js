import db from './db.js';

async function checkConnection() {
    console.log('🔄 Checking database connection...');
    // Accessing environment variables directly might require reloading dotenv if not running via the main app,
    // but db.js handles loading .env.local now.

    // We can't easily access process.env values here unless we export them from db.js or re-import dotenv
    // But for the test msg, let's just use a generic message or re-import.

    console.log(`📡 Trying to connect to database...`);

    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        console.log('✅ Connection Successful! Database is reachable.');
        console.log('Result of test query (1 + 1):', rows[0].solution);
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection Failed!');
        console.error('Error details:', err.message);
        console.error('Code:', err.code);

        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 Hint: The database name might be wrong or it does not exist. Please create it in phpMyAdmin.');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('💡 Hint: MySQL server might be offline. Check XAMPP Control Panel.');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Hint: Check your username and password in db.js or .env.local file.');
        }
        process.exit(1);
    }
}

checkConnection();
