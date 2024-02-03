## Vector DB Todo List

I thought it would be fun to see if I can make a password protected todo list app by using a vector database as my only storage solution. 

To be clear, I don't think this is a good idea and it's definitely not the purpose of vector databases. But, it was fun!

## Tech 
- Vector DB: [Upstash Vector](https://upstash.com/docs/vector/) with the [TS SDK](https://github.com/upstash/vector-js)
- Embedding model: [OpenAI text-embedding-3-small](https://openai.com/blog/new-embedding-models-and-api-updates)
- Next.js 14
- [Shadcn](https://ui.shadcn.com)

## Setup
If you want to run this locally, this is my `.env` setup:

```
UPSTASH_VECTOR_REST_URL="<FROM_UPSTASH_CONSOLE>"
UPSTASH_VECTOR_REST_TOKEN="<FROM_UPSTASH_CONSOLE>
OPENAI_API_KEY="<FROM_OPENAI>"
```