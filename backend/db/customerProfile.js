const FIELD_MAP = {
  techStack: "tech_stack",
  phone: "phone",
  linkedin: "linkedin",
  github: "github",
  email: "email",
  street: "street",
  city: "city",
  state: "state",
  zipCode: "zip_code",
  ssnLast4: "ssn_last4",
  dateOfBirth: "date_of_birth",
  hourlyRateRange: "hourly_rate_range",
  salaryRange: "salary_range",
  citizenship: "citizenship",
  nationality: "nationality",
};

export const CUSTOMER_PROFILE_KEYS = Object.keys(FIELD_MAP);

function trimOrNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

export function mapCustomerProfileFromRow(row) {
  if (!row) return {};
  const profile = {};
  for (const [camel, snake] of Object.entries(FIELD_MAP)) {
    profile[camel] = row[snake] ?? null;
  }
  return profile;
}

export function customerProfileToRow(data) {
  const row = {};
  for (const key of CUSTOMER_PROFILE_KEYS) {
    if (data[key] !== undefined) {
      row[FIELD_MAP[key]] = trimOrNull(data[key]);
    }
  }
  return row;
}

export function pickCustomerProfile(body) {
  const profile = {};
  for (const key of CUSTOMER_PROFILE_KEYS) {
    if (body[key] !== undefined) {
      profile[key] = body[key];
    }
  }
  return profile;
}

export function validateCustomerProfile(body) {
  const ssn = body.ssnLast4?.toString().trim();
  if (ssn && !/^\d{4}$/.test(ssn)) {
    return "Last 4 digits of SSN must be exactly 4 digits";
  }
  return null;
}

export function buildCustomerProfileResponse(user, extra = {}) {
  const profile = {};
  for (const key of CUSTOMER_PROFILE_KEYS) {
    profile[key] = user[key] ?? null;
  }
  return {
    id: user.id,
    username: user.username,
    ...profile,
    ...extra,
  };
}
