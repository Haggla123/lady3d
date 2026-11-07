export function FormField({ label, error, children, required = false }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#334155' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px', display: 'block' }}>{error}</span>}
    </div>
  )
}
