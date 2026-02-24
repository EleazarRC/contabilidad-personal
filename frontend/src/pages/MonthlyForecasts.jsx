import { useState, useEffect } from 'react';
import { getForecasts, getCategories, createForecast, updateForecast, toggleForecastCompleted, deleteForecast, getForecastSummary } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function MonthlyForecasts() {
  const [forecasts, setForecasts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [filterCompleted, setFilterCompleted] = useState('all');

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    reminder_date: format(new Date(), 'yyyy-MM-dd'),
    month: null,
    notes: '',
    forecast_type: 'monthly'
  });

  useEffect(() => {
    loadCategories();
    loadForecasts();
    loadSummary();
  }, [filterCompleted]);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data.filter(c => c.type === 'gasto'));
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadForecasts = async () => {
    try {
      setLoading(true);
      const params = { forecast_type: 'monthly' };
      if (filterCompleted !== 'all') {
        params.completed = filterCompleted;
      }
      const response = await getForecasts(params);
      setForecasts(response.data);
    } catch (error) {
      console.error('Error al cargar previsiones:', error);
      setError('Error al cargar previsiones');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await getForecastSummary(null, 'monthly');
      setSummary(response.data);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
      setSummary({ total: 0, completed: 0, pending: 0, byCategory: [] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await updateForecast(editingId, formData);
      } else {
        await createForecast(formData);
      }

      resetForm();
      loadForecasts();
      loadSummary();
    } catch (error) {
      setError(error.response?.data?.error || 'Error al guardar previsión');
    }
  };

  const handleEdit = (forecast) => {
    setFormData({
      description: forecast.description,
      amount: forecast.amount,
      category_id: forecast.category_id,
      reminder_date: forecast.reminder_date,
      month: forecast.month,
      notes: forecast.notes || '',
      forecast_type: 'monthly'
    });
    setEditingId(forecast.id);
    setShowForm(true);
  };

  const handleToggleCompleted = async (id) => {
    try {
      await toggleForecastCompleted(id);
      loadForecasts();
      loadSummary();
    } catch (error) {
      setError('Error al actualizar estado');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta previsión?')) {
      try {
        await deleteForecast(id);
        loadForecasts();
        loadSummary();
      } catch (error) {
        setError('Error al eliminar previsión');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category_id: '',
      reminder_date: format(new Date(), 'yyyy-MM-dd'),
      month: null,
      notes: '',
      forecast_type: 'monthly'
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

  const getMonthName = (monthNum) => {
    const month = months.find(m => m.value === monthNum);
    return month ? month.label : '';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)', padding: '1rem', flex: 1, marginRight: '1rem' }}>
          <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>
            <strong>ℹ️ Previsiones Mensuales:</strong> Gastos que se repiten cada mes (alquiler, subscripciones, etc.)
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Previsión Mensual'}
        </button>
      </div>

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3>{editingId ? 'Editar Previsión Mensual' : 'Nueva Previsión Mensual'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Descripción del Gasto Mensual</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Alquiler, Netflix, Gimnasio..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Monto Mensual</label>
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
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha de Cargo (Día del Mes)</label>
                <input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  required
                />
                <small style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  Día aproximado en que se cobra cada mes
                </small>
              </div>
              <div className="form-group">
                <label>Desde qué mes (opcional)</label>
                <select
                  value={formData.month || ''}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value ? parseInt(e.target.value) : null })}
                >
                  <option value="">Todos los meses</option>
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notas (opcional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional..."
                rows="2"
              />
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

      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Mensual Previsto</h3>
            <div className="amount" style={{ color: '#667eea' }}>
              {formatCurrency(summary.total)}
            </div>
          </div>
          <div className="summary-card">
            <h3>Completados Este Mes</h3>
            <div className="amount" style={{ color: '#28a745' }}>
              {formatCurrency(summary.completed)}
            </div>
          </div>
          <div className="summary-card">
            <h3>Pendientes Este Mes</h3>
            <div className="amount" style={{ color: '#dc3545' }}>
              {formatCurrency(summary.pending)}
            </div>
          </div>
        </div>
      )}

      <div className="filters">
        <div className="filter-group">
          <label>Estado</label>
          <select
            value={filterCompleted}
            onChange={(e) => setFilterCompleted(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="false">Pendientes</option>
            <option value="true">Completados</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : forecasts.length === 0 ? (
          <div className="empty-state">
            <h3>No hay previsiones mensuales</h3>
            <p>Comienza agregando tus gastos mensuales recurrentes</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Agregar Previsión Mensual
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>✓</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Monto Mensual</th>
                  <th>Día de Cargo</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map(forecast => (
                  <tr
                    key={forecast.id}
                    style={{
                      backgroundColor: forecast.completed ? '#f0f9ff' : 'transparent',
                      opacity: forecast.completed ? 0.7 : 1
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={forecast.completed === 1}
                        onChange={() => handleToggleCompleted(forecast.id)}
                        style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                      />
                    </td>
                    <td style={{ fontWeight: forecast.completed ? 'normal' : 600 }}>
                      {forecast.description}
                      {forecast.month && (
                        <small style={{ display: 'block', color: '#666', fontSize: '0.75rem' }}>
                          Desde {getMonthName(forecast.month)}
                        </small>
                      )}
                    </td>
                    <td>
                      <span
                        className="category-badge"
                        style={{ backgroundColor: forecast.category_color }}
                      >
                        {forecast.category_name}
                      </span>
                    </td>
                    <td style={{
                      color: '#dc3545',
                      fontWeight: 600,
                      textDecoration: forecast.completed ? 'line-through' : 'none'
                    }}>
                      {formatCurrency(forecast.amount)}
                    </td>
                    <td>
                      {forecast.month ? (
                        <>
                          {format(new Date(forecast.reminder_date), 'dd', { locale: es })} de {getMonthName(forecast.month)}
                        </>
                      ) : (
                        <>
                          Día {format(new Date(forecast.reminder_date), 'dd', { locale: es })} de cada mes
                        </>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: '#666', maxWidth: '200px' }}>
                      {forecast.notes || '-'}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => handleEdit(forecast)}
                          disabled={forecast.completed === 1}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(forecast.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)' }}>
        <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>💡 Ejemplos de Gastos Mensuales</h3>
        <ul style={{ lineHeight: '1.8', color: '#555', columnCount: 2, columnGap: '2rem' }}>
          <li>🏠 Alquiler o hipoteca</li>
          <li>💡 Electricidad, agua, gas</li>
          <li>📱 Teléfono e internet</li>
          <li>🚗 Seguro del coche (cuota)</li>
          <li>📺 Netflix, HBO, Spotify</li>
          <li>💪 Gimnasio</li>
          <li>🚌 Abono de transporte</li>
          <li>📦 Amazon Prime</li>
          <li>☁️ iCloud, Dropbox</li>
          <li>💳 Cuotas de préstamos</li>
        </ul>
      </div>
    </div>
  );
}

export default MonthlyForecasts;
