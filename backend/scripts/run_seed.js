import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const seedSqlPath = path.join(__dirname, '../db/seed.sql');
  const sql = fs.readFileSync(seedSqlPath, 'utf8');

  console.log('Connecting to NeonDB...');
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('Executing seed.sql...');
  await client.query(sql);
  console.log('Seed executed successfully!');

  // Verify categories
  const catRes = await client.query('SELECT slug, name, image_url FROM categories ORDER BY sort_order');
  console.log('\nCATEGORIES:');
  catRes.rows.forEach(r => console.log(`  ${r.slug}: ${r.image_url}`));

  // Verify hero banners
  const heroRes = await client.query('SELECT kicker, title, image_url FROM hero_banners ORDER BY sort_order');
  console.log('\nHERO BANNERS:');
  heroRes.rows.forEach(r => console.log(`  ${r.title}: ${r.image_url}`));

  // Verify product images
  const imgRes = await client.query(`
    SELECT p.slug, p.name, pi.image_url 
    FROM products p 
    JOIN product_images pi ON pi.product_id = p.id
    ORDER BY p.name
  `);
  console.log(`\nPRODUCT IMAGES (Count: ${imgRes.rows.length}):`);
  imgRes.rows.forEach(r => console.log(`  ${r.slug}: ${r.image_url}`));

  await client.end();
}

run().catch(err => {
  console.error('Seed execution error:', err);
  process.exit(1);
});

