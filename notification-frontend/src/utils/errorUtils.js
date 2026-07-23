export function extractErrorMessage(error) {
  const data = error.response && error.response.data;

  if (data) {
    if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
      return Object.values(data.fieldErrors).join(', ');
    }
    if (data.message) {
      return data.message;
    }
  }

  return 'Something went wrong. Please try again.';
}
