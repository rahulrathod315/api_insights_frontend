import './FormField.css'

export default function FormField({
  label,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  rightElement,
  rightLabel,
  error,
}) {
  return (
    <div className={`form-field${error ? ' form-field--error' : ''}`}>
      <div className="form-field__label-row">
        <label className="form-field__label">{label}</label>
        {rightLabel}
      </div>
      <div className="form-field__input-wrap">
        {icon && <span className="form-field__icon">{icon}</span>}
        <input
          className="form-field__input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
          autoComplete="off"
        />
        {rightElement}
      </div>
      {error && <p className="form-field__error">{error}</p>}
    </div>
  )
}
