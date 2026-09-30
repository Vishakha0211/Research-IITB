import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from '@xenova/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_PATH = path.join(__dirname, '..', '..', 'backend', 'data', 'report.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'professor-embeddings.json');

async function main() {
  console.log('Loading report data from:', REPORT_PATH);
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  const professors = report?.professor_research_interest_database?.professors || [];
  console.log(`Found ${professors.length} professors.`);

  console.log('Initializing feature-extraction pipeline (Xenova/all-MiniLM-L6-v2)...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true
  });

  const embeddings = [];
  const batchSize = 32;

  for (let i = 0; i < professors.length; i += batchSize) {
    const batch = professors.slice(i, i + batchSize);
    const texts = batch.map((p) => {
      const parts = [
        p.Name,
        p.Department,
        p.Topic,
        p.Research_Interest
      ].filter(Boolean);
      return parts.join(' | ');
    });

    const output = await extractor(texts, { pooling: 'mean', normalize: true });
    const data = output.tolist();

    for (let j = 0; j < batch.length; j++) {
      const p = batch[j];
      const id = String(p.Expert_ID || p.Name);
      embeddings.push({
        id,
        name: p.Name,
        vector: data[j].map((v) => Number(v.toFixed(5))) // 5 decimal places keeps JSON ~1.1MB
      });
    }

    console.log(`Processed ${Math.min(i + batchSize, professors.length)} / ${professors.length}...`);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(embeddings));
  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`Successfully saved ${embeddings.length} embeddings to ${OUTPUT_FILE}`);
  console.log(`File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error('Error generating embeddings:', err);
  process.exit(1);
});
