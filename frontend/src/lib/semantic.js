import { pipeline, env } from '@xenova/transformers';

// Configure transformers to use remote CDN models in browser
env.allowLocalModels = false;
env.useBrowserCache = true;

let extractorPromise = null;
let embeddingsData = null;
let embeddingsPromise = null;
let isReady = false;

// 1. Fetch precomputed professor embeddings (/data/professor-embeddings.json)
export async function loadEmbeddings() {
  if (embeddingsData) return embeddingsData;
  if (!embeddingsPromise) {
    embeddingsPromise = fetch('/data/professor-embeddings.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        embeddingsData = data;
        return data;
      })
      .catch((err) => {
        console.warn('Could not load professor embeddings:', err.message);
        embeddingsPromise = null;
        return null;
      });
  }
  return embeddingsPromise;
}

// 2. Initialize the lightweight all-MiniLM-L6-v2 pipeline in browser
export async function initSemanticEngine() {
  if (isReady) return true;
  if (!extractorPromise) {
    extractorPromise = (async () => {
      try {
        const [extractor] = await Promise.all([
          pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            quantized: true
          }),
          loadEmbeddings()
        ]);
        isReady = true;
        return extractor;
      } catch (err) {
        console.warn('Semantic search model initialization deferred/failed:', err.message);
        extractorPromise = null;
        return null;
      }
    })();
  }
  return extractorPromise;
}

export function isSemanticReady() {
  return isReady && embeddingsData != null;
}

// 3. Dot product of two normalized 384-d vectors (equivalent to cosine similarity)
function dotProduct(a, b) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

// 4. Semantic Search query execution
export async function semanticSearch(query, minScore = 0.25) {
  if (!query || !query.trim()) return [];
  const extractor = await initSemanticEngine();
  if (!extractor || !embeddingsData) return [];

  try {
    const output = await extractor(query.trim(), { pooling: 'mean', normalize: true });
    const queryVector = output.data;

    const results = [];
    for (let i = 0; i < embeddingsData.length; i++) {
      const item = embeddingsData[i];
      const sim = dotProduct(queryVector, item.vector);
      if (sim >= minScore) {
        results.push({ id: item.id, score: sim, name: item.name });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  } catch (err) {
    console.warn('Semantic search error:', err.message);
    return [];
  }
}
