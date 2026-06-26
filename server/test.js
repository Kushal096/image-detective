import {
  AutoProcessor,
  CLIPVisionModelWithProjection,
  RawImage,
  env,
} from "@xenova/transformers";

// Load processor and model
const processor = await AutoProcessor.from_pretrained(
  "Xenova/clip-vit-base-patch32"
);

const model = await CLIPVisionModelWithProjection.from_pretrained(
  "Xenova/clip-vit-base-patch32"
);

// Load two images
const image1 = await RawImage.read(
  "./tiger.jpg"
);

const image2 = await RawImage.read(
  "./tiger.jpg"
);

// Get embeddings
async function getEmbedding(image) {
  const inputs = await processor(image);
  const output = await model(inputs);

  // Convert tensor to normal array
  return Array.from(output.image_embeds.data);
}

const embedding1 = await getEmbedding(image1);
const embedding2 = await getEmbedding(image2);

// Cosine similarity
function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const similarity = cosineSimilarity(embedding1, embedding2);

console.log("Similarity:", similarity);

console.log({
  cacheDir: env.cacheDir,
  localModelPath: env.localModelPath,
  allowLocalModels: env.allowLocalModels,
  allowRemoteModels: env.allowRemoteModels,
});