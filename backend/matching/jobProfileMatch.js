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

function collectMatches(rawMatches, validCustomerIds) {
  const validIds = new Set(validCustomerIds);
  const minScore = Number(process.env.OPENAI_MATCH_MIN_SCORE) || DEFAULT_MIN_SCORE;
  const seen = new Set();
  const matches = [];

  for (const item of rawMatches || []) {
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

function parseMatchResponse(content, validCustomerIds) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON for job matching");
  }

  if (parsed.eligible === false) {
    const reason =
      String(parsed.rejectReason || "").trim() ||
      "Job is not eligible: only fully remote roles without security clearance requirements are allowed.";
    return { eligible: false, rejectReason: reason, matches: [] };
  }

  return { eligible: true, matches: collectMatches(parsed.matches, validCustomerIds) };
}

function parseMatchingOnlyResponse(content, validCustomerIds) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON for job matching");
  }
  return collectMatches(parsed.matches, validCustomerIds);
}

function buildJobSection(job) {
  return `Job:
- Title: ${job.jobTitle}
- Company: ${job.companyName}
- Description: ${job.jobDescription}
- Link: ${job.jobLink}`;
}

function buildEligibilityPrompt(job, candidates, minScore) {
  return `Match this job posting to customer profiles. A job may fit MULTIPLE profiles.

${buildJobSection(job)}

Customer profiles (only choose from these customerId values):
${JSON.stringify(candidates, null, 2)}

Return JSON with this exact shape:
{
  "eligible": <boolean>,
  "rejectReason": "<string or empty>",
  "matches": [
    { "customerId": <number>, "score": <0-100>, "rationale": "<short reason>" }
  ]
}

Eligibility (check BEFORE matching):
- Set eligible to false and matches to [] if the job is NOT a remote role (on-site, hybrid, or unclear location that is not fully remote).
- Set eligible to false and matches to [] if the job REQUIRES security clearance (e.g. clearance required, secret/top secret, government clearance, must be a U.S. citizen for clearance, etc.).
- Only proceed to profile matching when the job is fully remote AND does not require security clearance.
- When rejecting, set rejectReason to a short explanation (e.g. "On-site role" or "Requires active security clearance").

Matching rules (only when eligible is true):
- Include every customer with score >= ${minScore} whose tech stack and background fit the job.
- One job can match several customers.
- score reflects fit strength (tech stack alignment, seniority, domain).
- If no profile fits well, return eligible true with an empty matches array.`;
}

function buildMatchingOnlyPrompt(job, candidates, minScore) {
  return `Match this job posting to customer profiles. A job may fit MULTIPLE profiles.
Eligibility rules are skipped — only evaluate profile fit.

${buildJobSection(job)}

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
}

async function callOpenAI({ systemContent, userPrompt }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI is not configured. Set OPENAI_API_KEY in the backend environment.");
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
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
        { role: "system", content: systemContent },
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
  return content;
}

/**
 * @returns {{ blocked: boolean, rejectReason?: string, matches: Array }}
 */
export async function matchJobToCustomerProfiles(job, customers, { forceAccept = false } = {}) {
  if (!customers.length) {
    return { blocked: false, matches: [] };
  }

  const candidates = customers.map(profileForPrompt);
  const minScore = Number(process.env.OPENAI_MATCH_MIN_SCORE) || DEFAULT_MIN_SCORE;
  const customerIds = customers.map((c) => c.id);

  if (forceAccept) {
    const content = await callOpenAI({
      systemContent:
        "You are a recruiting assistant that maps job postings to candidate customer profiles. Ignore remote/clearance eligibility — match on profile fit only. Respond with valid JSON only.",
      userPrompt: buildMatchingOnlyPrompt(job, candidates, minScore),
    });
    return { blocked: false, matches: parseMatchingOnlyResponse(content, customerIds) };
  }

  const content = await callOpenAI({
    systemContent:
      "You are a recruiting assistant that maps job postings to candidate customer profiles. Only allow fully remote jobs with no security clearance requirement. Reject on-site, hybrid, and clearance-required roles. Respond with valid JSON only.",
    userPrompt: buildEligibilityPrompt(job, candidates, minScore),
  });

  const result = parseMatchResponse(content, customerIds);
  if (!result.eligible) {
    return { blocked: true, rejectReason: result.rejectReason, matches: [] };
  }

  return { blocked: false, matches: result.matches };
}
