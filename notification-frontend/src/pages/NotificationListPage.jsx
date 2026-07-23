import { useCallback, useEffect, useState } from 'react';
import { fetchNotifications, retryNotification } from '../services/notificationService';
import { extractErrorMessage } from '../utils/errorUtils';
import { formatDateTime } from '../utils/formatDate';
import { NOTIFICATION_TYPES, NOTIFICATION_STATUSES } from '../constants/notificationConstants';
import Alert from '../components/Alert';
import Loader from '../components/Loader';

const PAGE_SIZE = 10;

function NotificationListPage() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryingId, setRetryingId] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetchNotifications({
        page,
        size: PAGE_SIZE,
        status: statusFilter,
        type: typeFilter,
      });
      setNotifications(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function handleRetry(id) {
    setRetryingId(id);
    setErrorMessage('');
    try {
      await retryNotification(id);
      await loadNotifications();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setRetryingId(null);
    }
  }

  function handleStatusFilterChange(event) {
    setStatusFilter(event.target.value);
    setPage(0);
  }

  function handleTypeFilterChange(event) {
    setTypeFilter(event.target.value);
    setPage(0);
  }

  return (
    <div className="page">
      <h1>Notifications</h1>

      <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />

      <div className="filters">
        <div className="form-field">
          <label htmlFor="statusFilter">Status</label>
          <select id="statusFilter" value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="">All</option>
            {NOTIFICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="typeFilter">Type</label>
          <select id="typeFilter" value={typeFilter} onChange={handleTypeFilterChange}>
            <option value="">All</option>
            {NOTIFICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Retry Count</th>
                  <th>Schedule Time</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 && (
                  <tr>
                    <td colSpan="9" className="empty-row">
                      No notifications found
                    </td>
                  </tr>
                )}
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td>{notification.id}</td>
                    <td>{notification.userId}</td>
                    <td>{notification.type}</td>
                    <td>{notification.message}</td>
                    <td>
                      <span className={`status-badge status-${notification.status.toLowerCase()}`}>
                        {notification.status}
                      </span>
                    </td>
                    <td>{notification.retryCount}</td>
                    <td>{formatDateTime(notification.scheduleTime)}</td>
                    <td>{formatDateTime(notification.createdAt)}</td>
                    <td>
                      {notification.status === 'FAILED' && (
                        <button
                          type="button"
                          onClick={() => handleRetry(notification.id)}
                          disabled={retryingId === notification.id}
                        >
                          {retryingId === notification.id ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button type="button" disabled={page === 0} onClick={() => setPage((prev) => prev - 1)}>
              Previous
            </button>
            <span>
              Page {totalPages === 0 ? 0 : page + 1} of {totalPages} ({totalElements} total)
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationListPage;
