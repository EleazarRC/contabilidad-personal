import { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import MonthlyReport from './pages/MonthlyReport';
import AnnualReport from './pages/AnnualReport';
import Forecasts from './pages/Forecasts';
import Settings from './pages/Settings';
import SavingsAccounts from './pages/SavingsAccounts';
import Debts from './pages/Debts';
import Budgets from './pages/Budgets';

function DropdownMenu({ label, children, isActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="nav-dropdown" ref={ref}>
      <span
        className={isActive ? 'active' : ''}
        onClick={() => setOpen(!open)}
      >
        {label} ▾
      </span>
      {open && (
        <div className="dropdown-menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';
  const isAnyActive = (paths) => paths.some(p => location.pathname === p);

  return (
    <div className="navbar">
      <div className="navbar-content">
        <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
          <h1 style={{ cursor: 'pointer' }}>💰 Contabilidad Personal</h1>
        </Link>
        <nav>
          <Link to="/" className={isActive('/')}>Dashboard</Link>
          <Link to="/transactions" className={isActive('/transactions')}>Transacciones</Link>
          <Link to="/savings" className={isActive('/savings')}>🏦 Ahorros</Link>
          <Link to="/debts" className={isActive('/debts')}>💳 Deudas</Link>
          <Link to="/budgets" className={isActive('/budgets')}>📋 Presupuestos</Link>
          <DropdownMenu label="📊 Informes" isActive={isAnyActive(['/monthly', '/annual'])}>
            <Link to="/monthly" className={isActive('/monthly')}>📅 Mensual</Link>
            <Link to="/annual" className={isActive('/annual')}>📆 Anual</Link>
          </DropdownMenu>
          <Link to="/forecasts" className={isActive('/forecasts')}>Previsiones</Link>
          <DropdownMenu label="⚙️ Configuración" isActive={isAnyActive(['/categories', '/settings'])}>
            <Link to="/categories" className={isActive('/categories')}>📂 Categorías</Link>
            <Link to="/settings" className={isActive('/settings')}>🔧 Sistema</Link>
          </DropdownMenu>
        </nav>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/savings" element={<SavingsAccounts />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/forecasts" element={<Forecasts />} />
          <Route path="/monthly" element={<MonthlyReport />} />
          <Route path="/annual" element={<AnnualReport />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
