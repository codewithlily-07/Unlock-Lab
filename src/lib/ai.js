/**
 * UNLOCKLAB - SAFE AI INTEGRATION MODULE (Section 10)
 *
 * Rules:
 * 1. AI NEVER approves, rejects, or penalizes anything.
 * 2. Incident summaries are strictly advisory and labelled:
 *    "AI-generated summary - review before acting".
 * 3. Falls back cleanly to template-based summary if GEMINI_API_KEY is not set or fails.
 */

export async function generateIncidentSummary({
  resourceName,
  incidentType,
  severity,
  description,
  initialCondition,
  returnCondition,
}) {
  const fallback = `AI-generated summary - review before acting: A ${severity}-severity ${incidentType} incident was recorded on ${resourceName}. Condition changed from ${initialCondition || 'good'} to ${returnCondition || 'damaged'}. Key reported issue: ${description.substring(0, 120)}...`;

  const apiKey = import.meta.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallback;
  }

  try {
    const prompt = `You are a neutral laboratory equipment safety technician. Write a concise 2-3 sentence factual summary of the following incident report for lab managers.
Resource: ${resourceName}
Type: ${incidentType}
Severity: ${severity}
Description: ${description}
Initial Condition: ${initialCondition}
Final Condition: ${returnCondition}

Format response starting exactly with: "AI-generated summary - review before acting: "`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) return fallback;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : fallback;
  } catch (err) {
    console.warn('AI summary fallback triggered:', err.message);
    return fallback;
  }
}

export function matchSuggestedResources(queryText, allResources) {
  if (!queryText || !queryText.trim()) return [];
  const lower = queryText.toLowerCase();
  const keywords = lower.split(/\s+/).filter((w) => w.length > 2);

  return allResources.filter((res) => {
    const text = `${res.name} ${res.category} ${res.description} ${res.location}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });
}

