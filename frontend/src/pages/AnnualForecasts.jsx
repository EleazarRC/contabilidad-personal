import { useState, useEffect } from 'react';
import { getForecasts, getCategories, createForecast, updateForecast, toggleForecastCompleted, deleteForecast, getForecastSummary } from '../services/api';
import { format, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

function AnnualForecasts() {
  const [forecasts, setForecasts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterCompleted, setFilterCompleted] = useState('all');

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    reminder_date: format(new Date(), 'yyyy-MM-dd'),
    year: new Date().getFullYear(),
    notes: '',
    is_recurring: false,
    forecast_type: 'annual'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadForecasts();
    loadSummary();
  }, [selectedYear, filterCompleted]);

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
      const params = { year: selectedYear, forecast_type: 'annual' };
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
      const response = await getForecastSummary(selectedYear, 'annual');
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
      const dataToSend = { ...formData };
      // Si es recurrente, no enviar el año
      if (formData.is_recurring) {
        dataToSend.year = null;
      }

      if (editingId) {
        await updateForecast(editingId, dataToSend);
      } else {
        await createForecast(dataToSend);
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
      year: forecast.year || new Date().getFullYear(),
      notes: forecast.notes || '',
      is_recurring: forecast.is_recurring === 1,
      forecast_type: 'annual'
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
      year: selectedYear,
      notes: '',
      is_recurring: false,
      forecast_type: 'annual'
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

  const isOverdue = (date, completed) => {
    return !completed && isPast(parseISO(date)) && date !== format(new Date(), 'yyyy-MM-dd');
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffffff 100%)', padding: '1rem', flex: 1, marginRight: '1rem' }}>
          <p style={{ color: '#555', lineHeight: '1.6', margin: 0 }}>
            <strong>ℹ️ Previsiones Anuales:</strong> Gastos anuales como seguros, impuestos. Marca "🔄 Indefinido" si se repiten cada año.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Previsión Anual'}
        </button>
      </div>

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3>{editingId ? 'Editar Previsión' : 'Nueva Previsión Anual'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Descripción del Gasto</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Seguro del coche, IBI, Renovación DNI..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Monto Estimado</label>
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
                <label>Fecha de Recordatorio</label>
                <input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Año</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  disabled={formData.is_recurring}
                  required={!formData.is_recurring}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 600, color: '#667eea' }}>
                  🔄 Gasto Indefinido (se repite cada año)
                </span>
              </label>
              <small style={{ color: '#666', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem', marginLeft: '1.75rem' }}>
                Marca esta casilla si este gasto se repite todos los años (ej: seguro del coche, IBI, etc.)
              </small>
            </div>

            <div className="form-group">
              <label>Notas (opcional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Agrega notas o detalles adicionales (número de póliza, etc)..."
                rows="3"
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
            <h3>Total Previsto {selectedYear}</h3>
            <div className="amount" style={{ color: '#667eea' }}>
              {formatCurrency(summary.total)}
            </div>
          </div>
          <div className="summary-card">
            <h3>Completados</h3>
            <div className="amount" style={{ color: '#28a745' }}>
              {formatCurrency(summary.completed)}
            </div>
          </div>
          <div className="summary-card">
            <h3>Pendientes</h3>
            <div className="amount" style={{ color: '#dc3545' }}>
              {formatCurrency(summary.pending)}
            </div>
          </div>
        </div>
      )}

      <div className="filters">
        <div className="filter-group">
          <label>Año</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
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
            <h3>No hay previsiones para {selectedYear}</h3>
            <p>Comienza agregando tus gastos anuales previstos</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Agregar Previsión
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>✓</th>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Monto</th>
                  <th>Tipo</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map(forecast => {
                  const overdue = isOverdue(forecast.reminder_date, forecast.completed);
                  const isRecurring = forecast.is_recurring === 1;
                  return (
                    <tr
                      key={forecast.id}
                      style={{
                        backgroundColor: forecast.completed ? '#f0f9ff' : overdue ? '#fff5f5' : 'transparent',
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
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {format(parseISO(forecast.reminder_date), 'dd MMM yyyy', { locale: es })}
                          {overdue && <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>⚠️ Vencida</span>}
                        </div>
                      </td>
                      <td style={{ fontWeight: forecast.completed ? 'normal' : 600 }}>
                        {forecast.description}
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
                        {isRecurring ? (
                          <span style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            display: 'inline-block'
                          }}>
                            🔄 Indefinido
                          </span>
                        ) : (
                          <span style={{
                            background: '#e0e0e0',
                            color: '#555',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            display: 'inline-block'
                          }}>
                            {forecast.year}
                          </span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)' }}>
        <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>💡 Ejemplos de Gastos Anuales</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <h4 style={{ color: '#764ba2', fontSize: '1rem', marginBottom: '0.5rem' }}>🔄 Gastos Indefinidos (cada año)</h4>
            <ul style={{ lineHeight: '1.8', color: '#555' }}>
              <li>🚗 Seguro del coche</li>
              <li>🏠 IBI (Impuesto de Bienes Inmuebles)</li>
              <li>🚙 Impuesto de circulación</li>
              <li>🏥 Seguro de salud</li>
              <li>🔧 Revisión anual del coche</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#764ba2', fontSize: '1rem', marginBottom: '0.5rem' }}>📅 Gastos Puntuales (un año específico)</h4>
            <ul style={{ lineHeight: '1.8', color: '#555' }}>
              <li>📄 Renovación DNI/Pasaporte</li>
              <li>🎓 Matrícula universitaria</li>
              <li>🌐 Renovación dominio web</li>
              <li>📜 Certificado digital</li>
              <li>🔐 Licencia software específica</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnnualForecasts;
