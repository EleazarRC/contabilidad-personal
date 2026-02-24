import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'gasto',
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setError('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await updateCategory(editingId, formData);
      } else {
        await createCategory(formData);
      }

      resetForm();
      loadCategories();
    } catch (error) {
      setError(error.response?.data?.error || 'Error al guardar categoría');
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        await deleteCategory(id);
        loadCategories();
      } catch (error) {
        setError(error.response?.data?.error || 'Error al eliminar categoría');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'gasto',
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const ingresosCategories = categories.filter(c => c.type === 'ingreso');
  const gastosCategories = categories.filter(c => c.type === 'gasto');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#667eea' }}>Categorías</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Categoría'}
        </button>
      </div>

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3>{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Alimentación"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#000000"
                    required
                  />
                </div>
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

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ color: '#28a745' }}>Categorías de Ingresos ({ingresosCategories.length})</h3>
            {ingresosCategories.length === 0 ? (
              <div className="empty-state">
                <p>No hay categorías de ingresos</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ingresosCategories.map(category => (
                  <div
                    key={category.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '4px',
                          backgroundColor: category.color
                        }}
                      />
                      <span style={{ fontWeight: 500 }}>{category.name}</span>
                    </div>
                    <div className="btn-group">
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleEdit(category)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(category.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ color: '#dc3545' }}>Categorías de Gastos ({gastosCategories.length})</h3>
            {gastosCategories.length === 0 ? (
              <div className="empty-state">
                <p>No hay categorías de gastos</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {gastosCategories.map(category => (
                  <div
                    key={category.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '4px',
                          backgroundColor: category.color
                        }}
                      />
                      <span style={{ fontWeight: 500 }}>{category.name}</span>
                    </div>
                    <div className="btn-group">
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleEdit(category)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(category.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;
