import { useEffect, useState } from 'react';
import { fetchDashboard } from '../services/notificationService';
import { extractErrorMessage } from '../utils/errorUtils';
import Alert from '../components/Alert';
import Loader from '../components/Loader';

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setErrorMessage('');
      try {
        const response = await fetchDashboard();
        setStats(response.data);
      } catch (error) {
        setErrorMessage(extractErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="page">
      <h1>Dashboard</h1>

      <Alert type="error" message={errorMessage} onClose={() => setErrorMessage('')} />

      {loading && <Loader />}

      {!loading && stats && (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-label">Total</span>
              <span className="summary-value">{stats.totalNotifications}</span>
            </div>
            <div className="summary-card summary-sent">
              <span className="summary-label">Sent</span>
              <span className="summary-value">{stats.sentCount}</span>
            </div>
            <div className="summary-card summary-failed">
              <span className="summary-label">Failed</span>
              <span className="summary-value">{stats.failedCount}</span>
            </div>
            <div className="summary-card summary-retrying">
              <span className="summary-label">Retrying</span>
              <span className="summary-value">{stats.retryCount}</span>
            </div>
          </div>

          <h2>By Type</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.typeWiseStats || {}).map(([type, count]) => (
                <tr key={type}>
                  <td>{type}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
