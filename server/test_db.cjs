const db = require('./db');
require('dotenv').config({ path: '../.env.local' });

async function checkConnection() {
    console.log('🔄 Checking database connection...');
    console.log(`📡 Trying to connect to database: [${process.env.DB_NAME || 'lahlah'}] at [${process.env.DB_HOST || 'localhost'}]`);

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
