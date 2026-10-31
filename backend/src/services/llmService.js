const { GoogleGenAI, Type } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "[Gemini] CRITICAL: GEMINI_API_KEY is not defined in your .env file!",
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Models prioritized by free-tier availability and throughput
const CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-3.8-flash",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fallback extractor in case of external API 503 spikes or quota limits
function fallbackExtractFaqs(pageTitle, rawText) {
  console.log(
    `[LLM Fallback] Generating heuristic FAQs directly from text content...`,
  );
  const lines = rawText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 25);

  const faqs = [];

  faqs.push({
    question: `What services does ${pageTitle.split(/[-|,]/)[0].trim()} provide?`,
    answer: lines.slice(0, 3).join(" ").slice(0, 280) + ".",
    keywords: ["services", "overview", "offerings"],
  });

  for (let i = 3; i < Math.min(lines.length, 12); i += 2) {
    if (lines[i] && lines[i + 1]) {
      faqs.push({
        question: `About ${lines[i].slice(0, 50)}?`,
        answer: lines[i + 1].slice(0, 250) + ".",
        keywords: ["details", "info", "general"],
      });
    }
  }

  return faqs.slice(0, 4);
}

async function callModel(modelName, prompt) {
  return await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["question", "answer", "keywords"],
        },
      },
    },
  });
}

async function generateFaqsFromText(pageTitle, rawText) {
  if (!rawText || rawText.trim().length < 50) {
    return [];
  }

  const prompt = `
You are an expert website analyst and customer support bot trainer.
Read the following content from the webpage "${pageTitle}" and generate 8 to 15 comprehensive, high-value Question & Answer pairs that potential clients, visitors, or customers would ask about this company.

Requirements:
- Cover every major aspect found in the text: Core Services, Methodologies, Industries Served, Technologies Used, Experience/Track Record, and Contact/Support.
- Questions must sound natural (e.g., "What custom software development services does the company offer?", "Which technologies are used?").
- Answers must be thorough, factual, and 2 to 4 sentences long.
- Extract 3 to 5 relevant keyword tags for each question.

Webpage Content:
"""
${rawText.slice(0, 10000)}
"""
`;

  // Try available candidate models
  for (const model of CANDIDATE_MODELS) {
    try {
      console.log(`[LLM] Attempting generation with model: "${model}"...`);
      const response = await callModel(model, prompt);

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(
            `[LLM] Successfully generated ${parsed.length} FAQs using "${model}"`,
          );
          return parsed;
        }
      }
    } catch (error) {
      const errMsg = error.message || "";
      console.warn(
        `[Gemini Warning] Model "${model}" unavailable (${errMsg.slice(0, 120)}...)`,
      );
      await sleep(1000);
    }
  }

  // Graceful fallback: Extract structured FAQs directly from the scraped content
  return fallbackExtractFaqs(pageTitle, rawText);
}

module.exports = { generateFaqsFromText };
