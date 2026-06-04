export const CUSTOMER_PROFILE_FIELDS = [
  { key: "email", label: "Email", type: "email", placeholder: "name@example.com" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "+1 555 000 0000" },
  { key: "linkedin", label: "LinkedIn", type: "url", placeholder: "https://linkedin.com/in/..." },
  { key: "github", label: "GitHub", type: "url", placeholder: "https://github.com/..." },
  { key: "street", label: "Street", type: "text", placeholder: "123 Main St" },
  { key: "city", label: "City", type: "text", placeholder: "City" },
  { key: "state", label: "State", type: "text", placeholder: "State / Province" },
  { key: "zipCode", label: "Zip code", type: "text", placeholder: "e.g. 78701" },
  { key: "ssnLast4", label: "Last 4 digits of SSN", type: "text", placeholder: "1234", maxLength: 4 },
  { key: "dateOfBirth", label: "Date of birth", type: "date" },
  { key: "hourlyRateRange", label: "Hourly rate range", type: "text", placeholder: "e.g. $50–$75/hr" },
  { key: "salaryRange", label: "Salary range", type: "text", placeholder: "e.g. $80k–$120k" },
  { key: "citizenship", label: "Citizenship", type: "text", placeholder: "e.g. US Citizen" },
  { key: "nationality", label: "Nationality", type: "text", placeholder: "e.g. American" },
  { key: "techStack", label: "Tech stack", type: "textarea", placeholder: "React, Node.js, PostgreSQL" },
];

export function emptyCustomerProfile() {
  const profile = {};
  for (const field of CUSTOMER_PROFILE_FIELDS) {
    profile[field.key] = "";
  }
  return profile;
}

export function customerFromUser(user) {
  return {
    username: user?.username || "",
    password: "",
    ...emptyCustomerProfile(),
    ...CUSTOMER_PROFILE_FIELDS.reduce((acc, { key }) => {
      acc[key] = user?.[key] ?? "";
      return acc;
    }, {}),
  };
}

export function displayValue(value) {
  const text = value?.trim();
  return text || "—";
}
