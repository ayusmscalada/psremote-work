const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_MIN_SCORE = 55;

function profileForPrompt(customer) {
  return {
    customerId: customer.id,
    username: customer.username,
    techStack: customer.techStack || null,
    hourlyRateRange: customer.hourlyRateRange || null,
    salaryRange: customer.salaryRange || null,
    citizenship: customer.citizenship || null,
    nationality: customer.nationality || null,
    github: customer.github || null,
    linkedin: customer.linkedin || null,
  };
}

function parseMatchResponse(content, validCustomerIds) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON for job matching");
  }

  const rawMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
  const validIds = new Set(validCustomerIds);
  const minScore = Number(process.env.OPENAI_MATCH_MIN_SCORE) || DEFAULT_MIN_SCORE;

  const seen = new Set();
  const matches = [];

  for (const item of rawMatches) {
    const customerId = Number(item.customerId);
    const score = Number(item.score);
    if (!validIds.has(customerId) || seen.has(customerId)) continue;
    if (!Number.isFinite(score) || score < minScore) continue;

    seen.add(customerId);
    matches.push({
      customerId,
      score: Math.round(score),
      rationale: String(item.rationale || "").trim() || "Profile appears to fit this job.",
    });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

export async function matchJobToCustomerProfiles(job, customers) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI is not configured. Set OPENAI_API_KEY in the backend environment.");
  }

  if (!customers.length) {
    return [];
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const candidates = customers.map(profileForPrompt);
  const minScore = Number(process.env.OPENAI_MATCH_MIN_SCORE) || DEFAULT_MIN_SCORE;

  const userPrompt = `Match this job posting to customer profiles. A job may fit MULTIPLE profiles.

Job:
- Title: ${job.jobTitle}
- Company: ${job.companyName}
- Description: ${job.jobDescription}
- Link: ${job.jobLink}

Customer profiles (only choose from these customerId values):
${JSON.stringify(candidates, null, 2)}

Return JSON with this exact shape:
{
  "matches": [
    { "customerId": <number>, "score": <0-100>, "rationale": "<short reason>" }
  ]
}

Rules:
- Include every customer with score >= ${minScore} whose tech stack and background fit the job.
- One job can match several customers.
- score reflects fit strength (tech stack alignment, seniority, domain).
- If no profile fits well, return an empty matches array.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a recruiting assistant that maps job postings to candidate customer profiles. Respond with valid JSON only.",
        },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty matching response");
  }

  return parseMatchResponse(content, customers.map((c) => c.id));
}
