export function parseApiError(error) {
  const data = error?.response?.data

  if (!data) return 'Network error — check your connection and try again.'

  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  if (data.non_field_errors) return data.non_field_errors[0]

  // field-specific errors: {"email": ["This field is required."]}
  const firstKey = Object.keys(data)[0]
  if (firstKey && Array.isArray(data[firstKey])) {
    const label = firstKey.replace(/_/g, ' ')
    return `${label}: ${data[firstKey][0]}`
  }

  return 'Something went wrong. Please try again.'
}