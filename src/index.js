const express = require('express');
const path = require('path');
const { loadAndIndexFaqs, getAnswer } = require('./rag');

const app = express();
const PORT = process.env.PORT || 3000;

let isReady = false;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ready: isReady, timestamp: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (!isReady) {
      return res.status(503).json({ error: 'Service is starting up. Please wait...' });
    }
    const reply = await getAnswer(message);
    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Start server first, then load FAQs
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  loadFaqsWithRetry();
});

async function loadFaqsWithRetry() {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log('Loading and indexing FAQ documents...');
      const count = await loadAndIndexFaqs();
      console.log(`Indexed ${count} FAQ documents`);
      isReady = true;
      return;
    } catch (error) {
      console.warn(`Failed to load FAQs (attempt ${i + 1}/${maxRetries}):`, error.message);
      if (i < maxRetries - 1) {
        console.warn('Retrying in 30 seconds...');
        await new Promise(r => setTimeout(r, 30000));
      }
    }
  }
  console.warn('All retry attempts failed. Server running but chat unavailable.');
}
