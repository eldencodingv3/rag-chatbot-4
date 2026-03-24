# RAG Chatbot

Node.js RAG (Retrieval-Augmented Generation) chatbot for customer support. Uses LanceDB for vector storage and OpenAI for embeddings and chat completions.

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings and chat | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

## Project Structure

```
src/
  index.js          # Express server entry point
public/             # Static frontend files
data/               # FAQ/knowledge base data
```

## Updating the Dataset

Place your FAQ or knowledge base documents in the `data/` directory. The application will index them into LanceDB on startup.

## Deployment

The app auto-deploys to Railway on push to `main`. Railway is configured with:
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`
