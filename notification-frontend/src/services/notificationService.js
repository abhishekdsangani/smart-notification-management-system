import api from './api';

export function createNotification(payload) {
  return api.post('/notifications', payload);
}

export function fetchNotifications({ page = 0, size = 10, status, type }) {
  return api.get('/notifications', {
    params: {
      page,
      size,
      status: status || undefined,
      type: type || undefined,
    },
  });
}

export function retryNotification(id) {
  return api.post(`/notifications/${id}/retry`);
}

export function fetchDashboard() {
  return api.get('/dashboard');
}
