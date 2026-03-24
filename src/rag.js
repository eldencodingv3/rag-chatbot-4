const path = require('path');
const hasApiKey = !!process.env.OPENAI_API_KEY;

let openai, getEmbedding, getEmbeddings, initVectorStore, searchSimilar;
if (hasApiKey) {
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddings = require('./embeddings');
  getEmbedding = embeddings.getEmbedding;
  getEmbeddings = embeddings.getEmbeddings;
  const vs = require('./vectorStore');
  initVectorStore = vs.initVectorStore;
  searchSimilar = vs.searchSimilar;
}

let faqData = [];

function simpleSimilarity(query, text) {
  const queryWords = new Set(query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const textWords = new Set(text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  let matches = 0;
  for (const w of queryWords) {
    if (textWords.has(w)) matches++;
  }
  return queryWords.size > 0 ? matches / queryWords.size : 0;
}

function searchFallback(query, limit = 3) {
  const scored = faqData.map(faq => ({
    ...faq,
    score: simpleSimilarity(query, `${faq.question} ${faq.answer}`)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

async function loadAndIndexFaqs() {
  faqData = require(path.join(__dirname, '..', 'data', 'faqs.json'));
  if (hasApiKey) {
    await initVectorStore(faqData, getEmbeddings);
    console.log('Using OpenAI embeddings + LanceDB (full RAG mode)');
  } else {
    console.warn('OPENAI_API_KEY not set — using fallback text matching mode');
  }
  return faqData.length;
}

async function getAnswer(userMessage) {
  if (hasApiKey) {
    // Full RAG mode
    const queryEmbedding = await getEmbedding(userMessage);
    const results = await searchSimilar(queryEmbedding, 3);
    const context = results.map((r, i) =>
      `FAQ ${i + 1}:\nQ: ${r.question}\nA: ${r.answer}`
    ).join('\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful customer support assistant. Answer the user's question based on the following FAQ context. If the context doesn't contain relevant information, say you don't have that information and suggest contacting support directly.\n\nContext:\n${context}`
        },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    return completion.choices[0].message.content;
  } else {
    // Fallback mode — simple text matching
    const results = searchFallback(userMessage, 3);
    if (results.length > 0 && results[0].score > 0) {
      const top = results[0];
      return top.answer;
    }
    return "I couldn't find a specific answer to your question in our FAQ. Please contact our support team at support@example.com or call 1-800-SUPPORT for further assistance.";
  }
}

module.exports = { loadAndIndexFaqs, getAnswer };
