import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CreateNotificationPage from './pages/CreateNotificationPage';
import NotificationListPage from './pages/NotificationListPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<CreateNotificationPage />} />
          <Route path="/notifications" element={<NotificationListPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
