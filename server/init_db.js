import mysql from 'mysql2/promise';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const DB_NAME = process.env.DB_NAME || 'lahlah_os_db';

async function initializeDatabase() {
    console.log('🔄 Initializing database...');

    // Connect without database first to create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        // Create database if not exists
        console.log(`📦 Creating database "${DB_NAME}" if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
        await connection.query(`USE ${DB_NAME}`);

        // Read and execute schema
        console.log('📋 Creating tables...');
        const schemaPath = join(__dirname, 'schema.sql');
        let schema = fs.readFileSync(schemaPath, 'utf8');

        // Remove the CREATE DATABASE and USE statements since we already did that
        schema = schema.replace(/CREATE DATABASE IF NOT EXISTS .*?;/gi, '');
        schema = schema.replace(/USE .*?;/gi, '');

        await connection.query(schema);
        console.log('✅ Tables created successfully!');

        // Verify tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('📊 Tables in database:');
        tables.forEach((t) => {
            const tableName = Object.values(t)[0];
            console.log(`   - ${tableName}`);
        });

        console.log('\n✅ Database initialization complete!');
    } catch (err) {
        console.error('❌ Error initializing database:', err.message);
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 The database name might be incorrect.');
        }
    } finally {
        await connection.end();
    }
}

initializeDatabase();
