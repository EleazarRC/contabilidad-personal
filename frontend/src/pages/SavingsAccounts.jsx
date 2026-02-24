import { useState, useEffect } from 'react';
import {
  getSavingsAccounts,
  createSavingsAccount,
  updateSavingsAccount,
  deleteSavingsAccount,
  getSavingsMovements,
  createSavingsMovement,
  deleteSavingsMovement,
  getSavingsSummary
} from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend);

function SavingsAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [message, setMessage] = useState(null);

  const [accountForm, setAccountForm] = useState({
    name: '', description: '', color: '#667eea', initial_balance: 0, target_amount: 0
  });

  const [movementForm, setMovementForm] = useState({
    type: 'ingreso', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadMovements(selectedAccount.id);
    }
  }, [selectedAccount]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsRes, summaryRes] = await Promise.all([
        getSavingsAccounts(),
        getSavingsSummary()
      ]);
      setAccounts(accountsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async (accountId) => {
    try {
      const res = await getSavingsMovements(accountId);
      setMovements(res.data);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency', currency: 'EUR'
    }).format(amount);
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmitAccount = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await updateSavingsAccount(editingAccount.id, accountForm);
        showMessage('Cuenta actualizada correctamente');
      } else {
        await createSavingsAccount(accountForm);
        showMessage('Cuenta creada correctamente');
      }
      setShowAccountForm(false);
      setEditingAccount(null);
      setAccountForm({ name: '', description: '', color: '#667eea', initial_balance: 0, target_amount: 0 });
      loadData();
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error al guardar cuenta', 'error');
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setAccountForm({
      name: account.name,
      description: account.description || '',
      color: account.color,
      initial_balance: account.initial_balance,
      target_amount: account.target_amount || 0
    });
    setShowAccountForm(true);
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cuenta?')) return;
    try {
      await deleteSavingsAccount(id);
      showMessage('Cuenta eliminada correctamente');
      if (selectedAccount?.id === id) {
        setSelectedAccount(null);
        setMovements([]);
      }
      loadData();
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error al eliminar cuenta', 'error');
    }
  };

  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    try {
      await createSavingsMovement({
        account_id: selectedAccount.id,
        type: movementForm.type,
        amount: parseFloat(movementForm.amount),
        description: movementForm.description,
        date: movementForm.date
      });
      showMessage(movementForm.type === 'ingreso' ? 'Ingreso registrado' : 'Retiro registrado');
      setShowMovementForm(false);
      setMovementForm({ type: 'ingreso', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
      loadMovements(selectedAccount.id);
      loadData();
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error al registrar movimiento', 'error');
    }
  };

  const handleDeleteMovement = async (id) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    try {
      await deleteSavingsMovement(id);
      showMessage('Movimiento eliminado');
      loadMovements(selectedAccount.id);
      loadData();
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error al eliminar movimiento', 'error');
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  // Datos para gráfico de barras por cuenta
  const barChartData = {
    labels: summary?.accounts?.map(a => a.name) || [],
    datasets: [{
      label: 'Saldo actual',
      data: summary?.accounts?.map(a => a.current_balance) || [],
      backgroundColor: summary?.accounts?.map(a => a.color + 'CC') || [],
      borderColor: summary?.accounts?.map(a => a.color) || [],
      borderWidth: 2,
      borderRadius: 6
    }]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatCurrency(ctx.parsed.x)
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { callback: (v) => formatCurrency(v) }
      }
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#667eea' }}>🏦 Cuentas de Ahorro</h2>

      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Resumen global */}
      <div className="summary-cards">
        <div className="summary-card" style={{ borderTop: '4px solid #667eea' }}>
          <h3>Total Ahorrado</h3>
          <div className="amount" style={{ color: '#667eea' }}>
            {formatCurrency(summary?.total_saved || 0)}
          </div>
        </div>
        <div className="summary-card" style={{ borderTop: '4px solid #28a745' }}>
          <h3>Total Depositado</h3>
          <div className="amount" style={{ color: '#28a745' }}>
            {formatCurrency(summary?.total_deposited || 0)}
          </div>
        </div>
        <div className="summary-card" style={{ borderTop: '4px solid #dc3545' }}>
          <h3>Total Retirado</h3>
          <div className="amount" style={{ color: '#dc3545' }}>
            {formatCurrency(summary?.total_withdrawn || 0)}
          </div>
        </div>
        <div className="summary-card" style={{ borderTop: '4px solid #764ba2' }}>
          <h3>Nº Cuentas</h3>
          <div className="amount" style={{ color: '#764ba2' }}>
            {summary?.accounts_count || 0}
          </div>
        </div>
      </div>

      {/* Gráfico de barras por cuenta */}
      {summary?.accounts?.length > 0 && (
        <div className="chart-container">
          <h3>Distribución de Ahorros por Cuenta</h3>
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      )}

      <div className="savings-layout">
        {/* Lista de cuentas */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Mis Cuentas</h3>
            <button
              className="btn btn-primary btn-small"
              onClick={() => {
                setShowAccountForm(!showAccountForm);
                setEditingAccount(null);
                setAccountForm({ name: '', description: '', color: '#667eea', initial_balance: 0, target_amount: 0 });
              }}
            >
              {showAccountForm ? '✕ Cerrar' : '+ Nueva Cuenta'}
            </button>
          </div>

          {showAccountForm && (
            <form onSubmit={handleSubmitAccount} className="savings-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                    placeholder="Ej: Fondo emergencia"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Saldo Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    value={accountForm.initial_balance}
                    onChange={(e) => setAccountForm({...accountForm, initial_balance: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={accountForm.description}
                    onChange={(e) => setAccountForm({...accountForm, description: e.target.value})}
                    placeholder="Descripción opcional"
                  />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={accountForm.color}
                      onChange={(e) => setAccountForm({...accountForm, color: e.target.value})}
                    />
                    <input
                      type="text"
                      value={accountForm.color}
                      onChange={(e) => setAccountForm({...accountForm, color: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Objetivo de Ahorro (opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={accountForm.target_amount}
                    onChange={(e) => setAccountForm({...accountForm, target_amount: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary">
                  {editingAccount ? 'Actualizar Cuenta' : 'Crear Cuenta'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowAccountForm(false); setEditingAccount(null); }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {accounts.length === 0 ? (
            <div className="empty-state">
              <h3>No tienes cuentas de ahorro</h3>
              <p>Crea tu primera cuenta para empezar a gestionar tus ahorros</p>
            </div>
          ) : (
            <div className="savings-accounts-list">
              {accounts.map(account => (
                <div
                  key={account.id}
                  className={`savings-account-item ${selectedAccount?.id === account.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAccount(account)}
                  style={{ borderLeft: `4px solid ${account.color}` }}
                >
                  <div className="savings-account-info">
                    <div className="savings-account-name">{account.name}</div>
                    {account.description && (
                      <div className="savings-account-desc">{account.description}</div>
                    )}
                    <div className="savings-account-meta">
                      {account.total_movements} movimientos
                      {account.last_movement_date && (
                        <> · Último: {format(new Date(account.last_movement_date), 'dd/MM/yyyy')}</>
                      )}
                    </div>
                  </div>
                  <div className="savings-account-balance">
                    <div className="savings-balance-amount" style={{ color: account.current_balance >= 0 ? '#28a745' : '#dc3545' }}>
                      {formatCurrency(account.current_balance)}
                    </div>
                    <div className="savings-account-actions">
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={(e) => { e.stopPropagation(); handleEditAccount(account); }}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id); }}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {/* Barra de progreso hacia objetivo */}
                  {account.target_amount > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888', marginBottom: '0.2rem' }}>
                        <span>{Math.min(100, Math.round((account.current_balance / account.target_amount) * 100))}%</span>
                        <span>Objetivo: {formatCurrency(account.target_amount)}</span>
                      </div>
                      <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, (account.current_balance / account.target_amount) * 100)}%`,
                          height: '100%',
                          background: account.current_balance >= account.target_amount
                            ? 'linear-gradient(135deg, #43e97b, #38f9d7)'
                            : `linear-gradient(135deg, ${account.color}, ${account.color}99)`,
                          borderRadius: '4px',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de detalle de cuenta */}
        {selectedAccount && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>
                <span style={{ color: selectedAccount.color }}>●</span>{' '}
                {selectedAccount.name}
              </h3>
              <button
                className="btn btn-primary btn-small"
                onClick={() => setShowMovementForm(!showMovementForm)}
              >
                {showMovementForm ? '✕ Cerrar' : '💰 Nuevo Movimiento'}
              </button>
            </div>

            {showMovementForm && (
              <form onSubmit={handleSubmitMovement} className="savings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo</label>
                    <select
                      value={movementForm.type}
                      onChange={(e) => setMovementForm({...movementForm, type: e.target.value})}
                    >
                      <option value="ingreso">💰 Meter dinero</option>
                      <option value="retiro">💸 Sacar dinero</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Monto</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={movementForm.amount}
                      onChange={(e) => setMovementForm({...movementForm, amount: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Descripción</label>
                    <input
                      type="text"
                      value={movementForm.description}
                      onChange={(e) => setMovementForm({...movementForm, description: e.target.value})}
                      placeholder="Descripción del movimiento"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha</label>
                    <input
                      type="date"
                      value={movementForm.date}
                      onChange={(e) => setMovementForm({...movementForm, date: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="btn-group">
                  <button
                    type="submit"
                    className={`btn ${movementForm.type === 'ingreso' ? 'btn-success' : 'btn-danger'}`}
                  >
                    {movementForm.type === 'ingreso' ? '💰 Meter Dinero' : '💸 Sacar Dinero'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowMovementForm(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {movements.length === 0 ? (
              <div className="empty-state">
                <p>No hay movimientos en esta cuenta</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th>Tipo</th>
                      <th>Monto</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(mov => (
                      <tr key={mov.id}>
                        <td>{format(new Date(mov.date), 'dd/MM/yyyy')}</td>
                        <td>{mov.description || '—'}</td>
                        <td>
                          <span className={`transaction-type ${mov.type === 'ingreso' ? 'ingreso' : 'gasto'}`}>
                            {mov.type === 'ingreso' ? '💰 Ingreso' : '💸 Retiro'}
                          </span>
                        </td>
                        <td style={{
                          color: mov.type === 'ingreso' ? '#28a745' : '#dc3545',
                          fontWeight: 600
                        }}>
                          {mov.type === 'ingreso' ? '+' : '-'}{formatCurrency(mov.amount)}
                        </td>
                        <td>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleDeleteMovement(mov.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Gráfico de evolución del saldo */}
            {movements.length > 1 && (() => {
              const sorted = [...movements].sort((a, b) => new Date(a.date) - new Date(b.date));
              let balance = selectedAccount.initial_balance || 0;
              const points = sorted.map(m => {
                balance += m.type === 'ingreso' ? m.amount : -m.amount;
                return { date: format(new Date(m.date), 'dd/MM/yy'), balance };
              });
              return (
                <div className="chart-container" style={{ marginTop: '1rem' }}>
                  <h4>📈 Evolución del Saldo</h4>
                  <div style={{ height: '200px' }}>
                    <Line
                      data={{
                        labels: points.map(p => p.date),
                        datasets: [{
                          label: 'Saldo',
                          data: points.map(p => p.balance),
                          borderColor: selectedAccount.color,
                          backgroundColor: selectedAccount.color + '20',
                          borderWidth: 2,
                          fill: true,
                          tension: 0.3,
                          pointRadius: 3,
                          pointHoverRadius: 6
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: { label: (ctx) => `Saldo: ${formatCurrency(ctx.parsed.y)}` }
                          }
                        },
                        scales: {
                          y: { ticks: { callback: (v) => formatCurrency(v) } }
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavingsAccounts;
