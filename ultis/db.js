import knex from 'knex';

const db = knex({
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'FINAL_PROJECT_OOSE'
    },
    pool: { min: 0, max: 10 }
});

export default db;