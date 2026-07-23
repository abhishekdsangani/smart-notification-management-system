import { useState } from 'react';
import { createNotification } from '../services/notificationService';
import { extractErrorMessage } from '../utils/errorUtils';
import { getCurrentLocalDateTime } from '../utils/formatDate';
import { NOTIFICATION_TYPES } from '../constants/notificationConstants';
import Alert from '../components/Alert';
import Loader from '../components/Loader';

const initialFormState = {
  userId: '',
  type: NOTIFICATION_TYPES[0],
  message: '',
  scheduleTime: '',
};

function CreateNotificationPage() {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const minScheduleTime = getCurrentLocalDateTime();

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.userId || Number(form.userId) <= 0) {
      nextErrors.userId = 'Enter a valid user id';
    }
    if (!form.type) {
      nextErrors.type = 'Select a notification type';
    }
    if (!form.message.trim()) {
      nextErrors.message = 'Message cannot be empty';
    }
    if (form.scheduleTime && form.scheduleTime < minScheduleTime) {
      nextErrors.scheduleTime = 'Schedule time cannot be in the past';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        userId: Number(form.userId),
        type: form.type,
        message: form.message.trim(),
        scheduleTime: form.scheduleTime ? `${form.scheduleTime}:00` : null,
      };
      const response = await createNotification(payload);
      setSuccessMessage(`Notification #${response.data.id} created with status ${response.data.status}`);
      setForm(initialFormState);
      setErrors({});
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Create Notification</h1>

      <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
      <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="userId">User ID</label>
          <input
            id="userId"
            name="userId"
            type="number"
            min="1"
            value={form.userId}
            onChange={handleChange}
          />
          {errors.userId && <span className="field-error">{errors.userId}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" value={form.type} onChange={handleChange}>
            {NOTIFICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.type && <span className="field-error">{errors.type}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="message">Message</label>
          <textarea id="message" name="message" rows="4" value={form.message} onChange={handleChange} />
          {errors.message && <span className="field-error">{errors.message}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="scheduleTime">Schedule Time (optional)</label>
          <input
            id="scheduleTime"
            name="scheduleTime"
            type="datetime-local"
            min={minScheduleTime}
            value={form.scheduleTime}
            onChange={handleChange}
          />
          {errors.scheduleTime && <span className="field-error">{errors.scheduleTime}</span>}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Notification'}
        </button>

        {submitting && <Loader />}
      </form>
    </div>
  );
}

export default CreateNotificationPage;
