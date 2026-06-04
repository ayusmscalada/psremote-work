export const CUSTOMER_PROFILE_FIELDS = [
  { key: "email", label: "Email", type: "email", placeholder: "name@example.com" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "+1 555 000 0000" },
  { key: "linkedin", label: "LinkedIn", type: "url", placeholder: "https://linkedin.com/in/..." },
  { key: "github", label: "Github", type: "url", placeholder: "https://github.com/..." },
  { key: "street", label: "Street", type: "text", placeholder: "Street address" },
  { key: "city", label: "City", type: "text" },
  { key: "state", label: "State", type: "text" },
  { key: "zipCode", label: "Zip code", type: "text", placeholder: "e.g. 78701" },
  {
    key: "ssnLast4",
    label: "Last 4 digits of SSN",
    type: "text",
    placeholder: "1234",
    maxLength: 4,
    inputMode: "numeric",
  },
  { key: "dateOfBirth", label: "Date of birth", type: "date" },
  {
    key: "hourlyRateRange",
    label: "Hourly rate range",
    type: "text",
    placeholder: "e.g. $50–$80/hr",
  },
  {
    key: "salaryRange",
    label: "Salary range",
    type: "text",
    placeholder: "e.g. $100k–$150k",
  },
  { key: "citizenship", label: "Citizenship", type: "text" },
  { key: "nationality", label: "Nationality", type: "text" },
  {
    key: "techStack",
    label: "Tech stack",
    type: "text",
    placeholder: "e.g. React, Node.js, PostgreSQL",
    fullWidth: true,
  },
];

export function emptyCustomerProfile() {
  return Object.fromEntries(CUSTOMER_PROFILE_FIELDS.map((field) => [field.key, ""]));
}

export function customerProfileFromUser(user) {
  const profile = emptyCustomerProfile();
  if (!user) return profile;
  for (const field of CUSTOMER_PROFILE_FIELDS) {
    profile[field.key] = user[field.key] ?? "";
  }
  return profile;
}

export function formatProfileValue(value) {
  const text = value?.toString().trim();
  return text || "—";
}
