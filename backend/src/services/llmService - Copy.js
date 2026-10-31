const { GoogleGenAI, Type } = require("@google/genai");

// Ensure key is read from environment
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "[Gemini] CRITICAL: GEMINI_API_KEY is not defined in your backend .env file!",
  );
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateFaqsFromText(pageTitle, rawText) {
  if (!rawText || rawText.trim().length < 50) {
    return [];
  }

  const prompt = `
You are an expert website analyst and customer support bot trainer.
Read the following content from the webpage "${pageTitle}" and produce 3 to 5 clear, conversational Question & Answer pairs that potential clients, visitors, or customers would ask about this company/website.

Requirements:
- Questions must sound natural (e.g., "What services does Olive offer?", "How do I request a quote?").
- Answers must be concise, accurate, and 2 to 4 sentences long.
- Extract 3 to 5 keyword tags for each question.

Webpage Content:
"""
${rawText.slice(0, 8000)}
"""
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
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

    const parsed = JSON.parse(response.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`[Gemini Error] on "${pageTitle}":`, error.message);
    return [];
  }
}

module.exports = { generateFaqsFromText };
