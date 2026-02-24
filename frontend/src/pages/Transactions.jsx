import { useState, useEffect } from 'react';
import { getTransactions, getCategories, createTransaction, updateTransaction, deleteTransaction } from '../services/api';
import { format } from 'date-fns';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    type: '',
    category_id: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'gasto',
    category_id: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [filters, currentPage]);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.type) params.type = filters.type;
      if (filters.category_id) params.category_id = filters.category_id;

      const response = await getTransactions(params);
      // Handle paginated response
      if (response.data.data) {
        setTransactions(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.total);
      } else {
        setTransactions(response.data);
        setTotalPages(1);
        setTotalCount(response.data.length);
      }
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      setError('Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await updateTransaction(editingId, formData);
      } else {
        await createTransaction(formData);
      }

      resetForm();
      loadTransactions();
    } catch (error) {
      setError(error.response?.data?.error || 'Error al guardar transacción');
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category_id: transaction.category_id,
      date: transaction.date
    });
    setEditingId(transaction.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
      try {
        await deleteTransaction(id);
        loadTransactions();
      } catch (error) {
        setError('Error al eliminar transacción');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'gasto',
      category_id: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const months = [
    { value: '', label: 'Todos' },
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#667eea' }}>Transacciones</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Transacción'}
        </button>
      </div>

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3>{editingId ? 'Editar Transacción' : 'Nueva Transacción'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, category_id: '' })}
                  required
                >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Compra de supermercado"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="btn-group">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filters">
        <div className="filter-group">
          <label>Mes</label>
          <select
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Año</label>
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">Todos</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Tipo</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Categoría</label>
          <select
            value={filters.category_id}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
          >
            <option value="">Todas</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <h3>No hay transacciones</h3>
            <p>Comienza agregando tu primera transacción</p>
          </div>
        ) : (
          <>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{format(new Date(transaction.date), 'dd/MM/yyyy')}</td>
                    <td>{transaction.description}</td>
                    <td>
                      <span
                        className="category-badge"
                        style={{ backgroundColor: transaction.category_color }}
                      >
                        {transaction.category_name}
                      </span>
                    </td>
                    <td>
                      <span className={`transaction-type ${transaction.type}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td style={{
                      color: transaction.type === 'ingreso' ? '#28a745' : '#dc3545',
                      fontWeight: 600
                    }}>
                      {transaction.type === 'ingreso' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => handleEdit(transaction)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: '2px solid #667eea' }}>
                  <td colSpan="4" style={{ textAlign: 'right' }}>Totales página:</td>
                  <td>
                    <div style={{ color: '#28a745' }}>+{formatCurrency(transactions.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0))}</div>
                    <div style={{ color: '#dc3545' }}>-{formatCurrency(transactions.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0))}</div>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem', padding: '1rem' }}>
              <button
                className="btn btn-small btn-secondary"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ◀ Anterior
              </button>
              <span style={{ fontWeight: 600, color: '#667eea' }}>
                Página {currentPage} de {totalPages} ({totalCount} transacciones)
              </span>
              <button
                className="btn btn-small btn-secondary"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente ▶
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}

export default Transactions;
