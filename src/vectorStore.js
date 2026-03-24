const lancedb = require('@lancedb/lancedb');
const path = require('path');

let db;
let table;

async function initVectorStore(faqs, embeddingFn) {
  // Connect to LanceDB (file-based, stored in .lancedb directory)
  db = await lancedb.connect(path.join(process.cwd(), '.lancedb'));

  // Generate embeddings for all FAQ questions + answers combined
  const texts = faqs.map(f => `${f.question} ${f.answer}`);
  const embeddings = await embeddingFn(texts);

  // Create records with embeddings
  const records = faqs.map((faq, i) => ({
    id: faq.id,
    text: `${faq.question} ${faq.answer}`,
    question: faq.question,
    answer: faq.answer,
    category: faq.category || 'general',
    vector: embeddings[i],
  }));

  // Create or overwrite the table
  try {
    await db.dropTable('faqs');
  } catch (e) {
    // Table doesn't exist yet, that's fine
  }
  table = await db.createTable('faqs', records);

  console.log(`Vector store initialized with ${records.length} FAQ entries`);
  return table;
}

async function searchSimilar(queryEmbedding, limit = 3) {
  if (!table) throw new Error('Vector store not initialized');
  const results = await table.vectorSearch(queryEmbedding).limit(limit).toArray();
  return results;
}

module.exports = { initVectorStore, searchSimilar };
