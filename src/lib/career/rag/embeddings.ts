const EMBEDDING_DIMENSION = 1024;

interface EmbeddingResponse {
  data?: Array<{
    index?: number;
    embedding?: number[];
  }>;
}

function normalize(vector: number[]) {
  const length = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return length === 0 ? vector : vector.map((value) => value / length);
}

function hashToken(token: string) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function localHashEmbedding(text: string) {
  const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0);
  const tokens = text
    .toLowerCase()
    .match(/[a-z0-9+#.]+|[\u4e00-\u9fff]/g) ?? [];
  const features = [
    ...tokens,
    ...tokens.slice(0, -1).map((token, index) => `${token}_${tokens[index + 1]}`),
  ];

  for (const feature of features) {
    const hash = hashToken(feature);
    const position = hash % EMBEDDING_DIMENSION;
    vector[position] += (hash & 1) === 0 ? 1 : -1;
  }

  return normalize(vector);
}

function validateVector(vector: unknown): number[] {
  if (
    !Array.isArray(vector) ||
    vector.length !== EMBEDDING_DIMENSION ||
    vector.some((value) => typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw new Error(`Embedding must contain ${EMBEDDING_DIMENSION} numeric dimensions`);
  }
  return vector as number[];
}

async function requestRemoteEmbeddings(input: string[]) {
  const apiKey = process.env.EMBEDDING_API_KEY;
  const baseUrl = process.env.EMBEDDING_BASE_URL?.replace(/\/$/, "");
  const model = process.env.EMBEDDING_MODEL;

  if (!apiKey || !baseUrl || !model) return null;

  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Embedding request failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as EmbeddingResponse;
  const rows = [...(payload.data ?? [])].sort(
    (left, right) => (left.index ?? 0) - (right.index ?? 0),
  );
  if (rows.length !== input.length) {
    throw new Error("Embedding response count does not match input count");
  }

  return rows.map((row) => validateVector(row.embedding));
}

export function getEmbeddingProviderName() {
  return process.env.EMBEDDING_API_KEY && process.env.EMBEDDING_MODEL
    ? process.env.EMBEDDING_MODEL
    : "local-feature-hash";
}

export async function embedTexts(input: string[]) {
  if (input.length === 0) return [];
  const remote = await requestRemoteEmbeddings(input);
  return remote ?? input.map(localHashEmbedding);
}

export async function embedQuery(query: string) {
  const [vector] = await embedTexts([query]);
  return vector;
}
