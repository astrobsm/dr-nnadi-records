// Test database connection
const { sql } = require('@vercel/postgres');

async function testConnection() {
    try {
        console.log('Testing database connection...');
        
        // Test query
        const result = await sql`SELECT version()`;
        
        console.log('✓ Connected to database successfully!');
        console.log('PostgreSQL version:', result.rows[0].version);
        
        // Test creating tables
        console.log('\nInitializing tables...');
        
        await sql`
            CREATE TABLE IF NOT EXISTS patients (
                folder_number VARCHAR(100) PRIMARY KEY,
                patient_name VARCHAR(255) NOT NULL,
                first_visit DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✓ Patients table ready');
        
        await sql`
            CREATE TABLE IF NOT EXISTS records (
                id BIGSERIAL PRIMARY KEY,
                patient_name VARCHAR(255) NOT NULL,
                folder_number VARCHAR(100) NOT NULL,
                review_date DATE NOT NULL,
                hospital_name VARCHAR(255) NOT NULL,
                service_type VARCHAR(255) NOT NULL,
                service_details TEXT NOT NULL,
                fee DECIMAL(10, 2) NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (folder_number) REFERENCES patients(folder_number) ON DELETE CASCADE
            )
        `;
        console.log('✓ Records table ready');
        
        await sql`
            CREATE INDEX IF NOT EXISTS idx_records_date ON records(review_date DESC)
        `;
        await sql`
            CREATE INDEX IF NOT EXISTS idx_records_folder ON records(folder_number)
        `;
        console.log('✓ Indexes created');
        
        console.log('\n✓ Database is ready for use!');
        console.log('\nYou can now:');
        console.log('1. Deploy to Vercel');
        console.log('2. Access your app from any device');
        console.log('3. All data will sync across devices');
        
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
