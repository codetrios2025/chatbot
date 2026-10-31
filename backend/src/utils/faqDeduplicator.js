/**
 * Normalizes a question string into clean lowercase tokens
 */
function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

/**
 * Computes Jaccard word similarity between two sentences (0.0 to 1.0)
 */
function getJaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) intersectionCount++;
  }
  const unionCount = new Set([...setA, ...setB]).size;
  return intersectionCount / unionCount;
}

/**
 * Filters out duplicate and semantically close questions
 * @param {Array<{question: string, answer: string, keywords: string[]}>} faqs
 * @param {number} similarityThreshold - 0.60 means 60% token overlap
 * @returns {Array} Deduplicated FAQs
 */
function deduplicateFaqs(faqs, similarityThreshold = 0.6) {
  const uniqueFaqs = [];
  const tokenizedQuestions = [];

  for (const item of faqs) {
    if (!item.question || !item.answer) continue;

    const currentTokens = tokenize(item.question);
    let isDuplicate = false;

    for (let i = 0; i < uniqueFaqs.length; i++) {
      const existingTokens = tokenizedQuestions[i];
      const similarity = getJaccardSimilarity(currentTokens, existingTokens);

      // If wording is more than 60% identical, treat as duplicate
      if (similarity >= similarityThreshold) {
        isDuplicate = true;
        // Keep whichever answer has more detail/length
        if (item.answer.length > uniqueFaqs[i].answer.length) {
          uniqueFaqs[i] = item;
          tokenizedQuestions[i] = currentTokens;
        }
        break;
      }
    }

    if (!isDuplicate) {
      uniqueFaqs.push(item);
      tokenizedQuestions.push(currentTokens);
    }
  }

  return uniqueFaqs;
}

module.exports = { deduplicateFaqs };
