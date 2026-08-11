import { NavLink, Route, Routes } from 'react-router-dom';
import { AddTransaction } from './components/AddTransaction/AddTransaction';
import { MonitorDashboard } from './components/MonitorDashboard/MonitorDashboard';
import { ROUTES } from './types/consts';
import './App.css';

function App() {
  return (
    <div className="app-shell">
      <nav className="app-nav">
        <strong className="brand">Financial Monitor</strong>
        <NavLink to={ROUTES.ADD} className={({ isActive }) => (isActive ? 'active' : undefined)}>
          Simulator
        </NavLink>
        <NavLink to={ROUTES.MONITOR} className={({ isActive }) => (isActive ? 'active' : undefined)}>
          Dashboard
        </NavLink>
      </nav>
      <main className="app-main">
        <Routes>
          <Route path={ROUTES.HOME} element={<MonitorDashboard />} />
          <Route path={ROUTES.ADD} element={<AddTransaction />} />
          <Route path={ROUTES.MONITOR} element={<MonitorDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
