import { CUSTOMER_PROFILE_FIELDS } from "../constants/customerProfile";

export default function CustomerProfileFields({ values, onChange }) {
  function updateField(key, value) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="customer-profile-fields">
      {CUSTOMER_PROFILE_FIELDS.map((field) => (
        <label
          key={field.key}
          className={`customer-profile-field${field.fullWidth ? " customer-profile-field--full" : ""}`}
        >
          {field.label}
          <input
            type={field.type}
            value={values[field.key] ?? ""}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            inputMode={field.inputMode}
          />
        </label>
      ))}
    </div>
  );
}
