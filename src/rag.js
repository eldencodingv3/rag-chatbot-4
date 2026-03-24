const OpenAI = require('openai');
const { getEmbedding, getEmbeddings } = require('./embeddings');
const { initVectorStore, searchSimilar } = require('./vectorStore');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function loadAndIndexFaqs() {
  const faqs = require('../data/faqs.json');
  await initVectorStore(faqs, getEmbeddings);
  return faqs.length;
}

async function getAnswer(userMessage) {
  // 1. Embed the user's question
  const queryEmbedding = await getEmbedding(userMessage);

  // 2. Search for relevant FAQs
  const results = await searchSimilar(queryEmbedding, 3);

  // 3. Build context from results
  const context = results.map((r, i) =>
    `FAQ ${i + 1}:\nQ: ${r.question}\nA: ${r.answer}`
  ).join('\n\n');

  // 4. Generate response using GPT-3.5-turbo with context
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `You are a helpful customer support assistant. Answer the user's question based on the following FAQ context. If the context doesn't contain relevant information, say you don't have that information and suggest contacting support directly.\n\nContext:\n${context}`
      },
      {
        role: 'user',
        content: userMessage
      }
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0].message.content;
}

module.exports = { loadAndIndexFaqs, getAnswer };
