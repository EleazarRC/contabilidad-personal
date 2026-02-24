import { useState, useEffect } from 'react';
import { getDebts, createDebt, updateDebt, deleteDebt, getDebtsSummary, getDebtPayments, createDebtPayment, deleteDebtPayment } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const DEBT_TYPES = [
  { value: 'tarjeta', label: '💳 Tarjeta de Crédito', icon: '💳' },
  { value: 'prestamo', label: '🏦 Préstamo', icon: '🏦' },
  { value: 'hipoteca', label: '🏠 Hipoteca', icon: '🏠' },
  { value: 'otro', label: '📄 Otro', icon: '📄' }
];

function Debts() {
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [debtForm, setDebtForm] = useState({
    name: '', type: 'tarjeta', description: '', color: '#dc3545', initial_amount: ''
  });

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    type: 'pago', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDebt) {
      loadPayments(selectedDebt.id);
    }
  }, [selectedDebt]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [debtsRes, summaryRes] = await Promise.all([
        getDebts(),
        getDebtsSummary()
      ]);
      setDebts(debtsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      showMessage('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (debtId) => {
    try {
      const res = await getDebtPayments(debtId);
      setPayments(res.data);
    } catch (error) {
      showMessage('Error al cargar pagos', 'error');
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const getTypeInfo = (type) => DEBT_TYPES.find(t => t.value === type) || DEBT_TYPES[3];

  // CRUD deudas
  const handleSubmitDebt = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...debtForm,
        initial_amount: parseFloat(debtForm.initial_amount) || 0,
        interest_rate: parseFloat(debtForm.interest_rate) || 0
      };

      if (editingDebt) {
        await updateDebt(editingDebt.id, data);
        showMessage('Deuda actualizada');
      } else {
        await createDebt(data);
        showMessage('Deuda creada');
      }

      resetDebtForm();
      loadData();
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error al guardar', 'error');
    }
  };

  const handleDeleteDebt = async (id) => {
    if (!window.confirm('¿Eliminar esta deuda?')) return;
    try {
      await deleteDebt(id);
      showMessage('Deuda eliminada');
      if (selectedDebt?.id === id) setSelectedDebt(null);
      loadData();
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error al eliminar', 'error');
    }
  };

  const handleEditDebt = (debt) => {
    setEditingDebt(debt);
    setDebtForm({
      name: debt.name,
      type: debt.type,
      description: debt.description || '',
      color: debt.color,
      initial_amount: debt.initial_amount
    });
    setShowForm(true);
  };

  const resetDebtForm = () => {
    setDebtForm({ name: '', type: 'tarjeta', description: '', color: '#dc3545', initial_amount: '' });
    setEditingDebt(null);
    setShowForm(false);
  };

  // Pagos
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedDebt) return;

    try {
      await createDebtPayment({
        debt_id: selectedDebt.id,
        type: paymentForm.type,
        amount: parseFloat(paymentForm.amount),
        description: paymentForm.description,
        date: paymentForm.date
      });

      showMessage(paymentForm.type === 'pago' ? 'Pago registrado' : 'Cargo registrado');
      setPaymentForm({ type: 'pago', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
      loadPayments(selectedDebt.id);
      loadData();
    } catch (error) {
      showMessage(error.response?.data?.error || 'Error al registrar', 'error');
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      await deleteDebtPayment(id);
      showMessage('Registro eliminado');
      loadPayments(selectedDebt.id);
      loadData();
    } catch (error) {
      showMessage('Error al eliminar', 'error');
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  // Datos gráfico — solo deuda actual
  const chartData = summary?.debts?.length > 0 ? {
    labels: summary.debts.map(d => d.name),
    datasets: [
      {
        label: 'Deuda actual',
        data: summary.debts.map(d => d.current_balance),
        backgroundColor: summary.debts.map(d => d.color + 'CC'),
        borderColor: summary.debts.map(d => d.color),
        borderWidth: 2,
        borderRadius: 6
      }
    ]
  } : null;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#dc3545' }}>💳 Deudas y Obligaciones</h2>

      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Resumen global */}
      <div className="summary-cards">
        <div className="summary-card" style={{ borderLeft: '4px solid #dc3545' }}>
          <h3>Deuda Total Actual</h3>
          <div className="amount" style={{ color: '#dc3545' }}>{formatCurrency(summary?.total_debt)}</div>
        </div>
        <div className="summary-card" style={{ borderLeft: '4px solid #667eea' }}>
          <h3>Nº de Deudas</h3>
          <div className="amount" style={{ color: '#667eea' }}>{summary?.debts_count || 0}</div>
        </div>
        <div className="summary-card" style={{ borderLeft: '4px solid #fd7e14' }}>
          <h3>Cuota Mensual Estimada</h3>
          <div className="amount" style={{ color: '#fd7e14' }}>
            {formatCurrency(summary?.total_debt > 0 ? summary.total_debt / 12 : 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
            Para liquidar en 12 meses
          </div>
        </div>
      </div>

      {/* Gráfico */}
      {chartData && (
        <div className="chart-container" style={{ marginBottom: '2rem' }}>
          <h3>Deuda Actual por Cuenta</h3>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                tooltip: {
                  callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` }
                }
              },
              scales: {
                y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } }
              }
            }}
          />
        </div>
      )}

      {/* Layout principal */}
      <div className="savings-layout">
        {/* Panel izquierdo: lista de deudas */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Mis Deudas</h3>
            <button className="btn btn-primary" onClick={() => { resetDebtForm(); setShowForm(!showForm); }}>
              {showForm ? '✕ Cancelar' : '+ Nueva Deuda'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmitDebt} className="savings-form">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={debtForm.name} onChange={(e) => setDebtForm({...debtForm, name: e.target.value})} required placeholder="Ej: Visa Gold" />
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={debtForm.type} onChange={(e) => setDebtForm({...debtForm, type: e.target.value})}>
                    {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input type="color" value={debtForm.color} onChange={(e) => setDebtForm({...debtForm, color: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input type="text" value={debtForm.description} onChange={(e) => setDebtForm({...debtForm, description: e.target.value})} placeholder="Ej: Tarjeta principal BBVA" />
              </div>
              <div className="form-group">
                <label>Saldo Inicial (€)</label>
                <input type="number" step="0.01" min="0" value={debtForm.initial_amount} onChange={(e) => setDebtForm({...debtForm, initial_amount: e.target.value})} required placeholder="0.00" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingDebt ? '💾 Actualizar' : '+ Crear Deuda'}
              </button>
            </form>
          )}

          <div className="savings-accounts-list">
            {debts.length === 0 ? (
              <div className="empty-state"><p>No hay deudas registradas</p></div>
            ) : (
              debts.map(debt => (
                <div
                  key={debt.id}
                  className={`savings-account-item ${selectedDebt?.id === debt.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDebt(debt)}
                >
                  <div>
                    <div className="savings-account-name">
                      <span style={{ marginRight: '0.5rem' }}>{getTypeInfo(debt.type).icon}</span>
                      {debt.name}
                    </div>
                    {debt.description && <div className="savings-account-desc">{debt.description}</div>}
                    <div className="savings-account-meta">
                      {getTypeInfo(debt.type).label}
                      {debt.total_payments > 0 && ` · ${debt.total_payments} pagos`}
                      {debt.last_payment_date && ` · Último: ${format(new Date(debt.last_payment_date), 'dd/MM/yyyy')}`}
                    </div>
                  </div>
                  <div className="savings-account-balance">
                    <span className="savings-balance-amount" style={{ color: debt.current_balance > 0 ? '#dc3545' : '#28a745' }}>
                      {formatCurrency(debt.current_balance)}
                    </span>
                    <div className="savings-account-actions">
                      <button className="btn btn-small" onClick={(e) => { e.stopPropagation(); handleEditDebt(debt); }} title="Editar">✏️</button>
                      <button className="btn btn-small btn-danger" onClick={(e) => { e.stopPropagation(); handleDeleteDebt(debt.id); }} title="Eliminar">🗑️</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho: detalle y pagos */}
        <div className="card">
          {selectedDebt ? (
            <>
              <h3 style={{ marginBottom: '1rem' }}>
                {getTypeInfo(selectedDebt.type).icon} {selectedDebt.name}
              </h3>

              <div className="summary-cards" style={{ gridTemplateColumns: '1fr' }}>
                <div className="summary-card" style={{ borderLeft: `4px solid ${selectedDebt.color}` }}>
                  <h3>Deuda Actual</h3>
                  <div className="amount" style={{ color: selectedDebt.current_balance > 0 ? '#dc3545' : '#28a745', fontSize: '1.5rem' }}>{formatCurrency(selectedDebt.current_balance)}</div>
                </div>
              </div>

              {/* Formulario de pago */}
              <form onSubmit={handleSubmitPayment} className="savings-form">
                <h4 style={{ marginBottom: '0.75rem' }}>Registrar Movimiento</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Tipo</label>
                    <select value={paymentForm.type} onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value})}>
                      <option value="pago">💰 Pago</option>
                      <option value="cargo">📥 Cargo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Monto (€)</label>
                    <input type="number" step="0.01" min="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} required placeholder="0.00" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <input type="text" value={paymentForm.description} onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})} placeholder="Ej: Pago mensualidad enero" />
                </div>
                <div className="form-group">
                  <label>Fecha</label>
                  <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {paymentForm.type === 'pago' ? '💰 Registrar Pago' : '📥 Registrar Cargo'}
                </button>
              </form>

              {/* Historial de pagos */}
              <h4 style={{ margin: '1.5rem 0 1rem' }}>Historial de Movimientos</h4>
              {payments.length === 0 ? (
                <div className="empty-state"><p>No hay movimientos registrados</p></div>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th>Monto</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment.id}>
                          <td>{format(new Date(payment.date), 'dd/MM/yyyy')}</td>
                          <td>
                            <span className={`transaction-type ${payment.type === 'pago' ? 'ingreso' : 'gasto'}`}>
                              {payment.type === 'pago' ? '💰 Pago' : '📥 Cargo'}
                            </span>
                          </td>
                          <td>{payment.description || '-'}</td>
                          <td style={{ color: payment.type === 'pago' ? '#28a745' : '#dc3545', fontWeight: 600 }}>
                            {payment.type === 'pago' ? '-' : '+'}{formatCurrency(payment.amount)}
                          </td>
                          <td>
                            <button className="btn btn-small btn-danger" onClick={() => handleDeletePayment(payment.id)}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <h3>💳 Selecciona una deuda</h3>
              <p>Haz clic en una deuda de la lista para ver su detalle y registrar pagos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Debts;
