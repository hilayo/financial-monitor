import { NavLink, Route, Routes } from 'react-router-dom';
import { AddTransaction } from './routes/AddTransaction';
import { MonitorDashboard } from './routes/MonitorDashboard';
import './App.css';

function App() {
  return (
    <div className="app-shell">
      <nav className="app-nav">
        <strong className="brand">Financial Monitor</strong>
        <NavLink to="/add" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          Simulator
        </NavLink>
        <NavLink to="/monitor" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          Dashboard
        </NavLink>
      </nav>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<MonitorDashboard />} />
          <Route path="/add" element={<AddTransaction />} />
          <Route path="/monitor" element={<MonitorDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
