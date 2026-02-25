import { useState, useEffect } from 'react';
import { getBudgets, createBudget, updateBudget, deleteBudget, getCategories } from '../services/api';

export default function BudgetConfig() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formColor, setFormColor] = useState('#667eea');
  const [formCategoryIds, setFormCategoryIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fmt = (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([getBudgets(), getCategories()]);
      setBudgets(budgetsRes.data);
      setCategories(categoriesRes.data.filter(c => c.type === 'gasto'));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormAmount(''); setFormColor('#667eea');
    setFormCategoryIds([]); setEditingId(null); setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { name: formName, amount: parseFloat(formAmount), color: formColor, category_ids: formCategoryIds };
    try {
      if (editingId) await updateBudget(editingId, data);
      else await createBudget(data);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleEdit = (b) => {
    setFormName(b.name); setFormAmount(b.amount.toString()); setFormColor(b.color);
    setFormCategoryIds(b.categories?.map(c => c.id) || []); setEditingId(b.id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;
    try { await deleteBudget(id); loadData(); }
    catch (err) { alert(err.response?.data?.error || 'Error al eliminar'); }
  };

  const toggleCategory = (catId) => {
    setFormCategoryIds(prev => prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]);
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>📋 Configurar Presupuestos</h2>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? '✕ Cerrar' : '+ Nuevo Presupuesto'}
        </button>
      </div>

      {/* FORMULARIO */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>{editingId ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ej: Gastos del hogar"
                  required
                />
              </div>
              <div className="form-group">
                <label>Presupuesto Mensual (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="500.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="color"
                  value={formColor}
                  onChange={e => setFormColor(e.target.value)}
                  style={{ width: '50px', height: '42px', cursor: 'pointer', padding: '2px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#555' }}>
                Categorías de gasto incluidas:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      border: formCategoryIds.includes(cat.id) ? '2px solid ' + cat.color : '2px solid #ddd',
                      background: formCategoryIds.includes(cat.id) ? cat.color : 'white',
                      color: formCategoryIds.includes(cat.id) ? 'white' : '#333',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: formCategoryIds.includes(cat.id) ? '600' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    {formCategoryIds.includes(cat.id) ? '✓ ' : ''}{cat.name}
                  </button>
                ))}
              </div>
              {categories.length === 0 && (
                <p style={{ color: '#999', fontSize: '0.9rem' }}>No hay categorías de gasto creadas aún.</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? '💾 Guardar' : '➕ Crear'}
              </button>
              <button type="button" className="btn" onClick={resetForm} style={{ background: '#eee', color: '#333' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA */}
      {budgets.length > 0 ? (
        <div className="card">
          <h3>🗂️ Presupuestos Configurados</h3>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Presupuesto</th>
                <th>Categorías</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(b => (
                <tr key={b.id}>
                  <td>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: b.color, marginRight: '0.5rem' }} />
                    {b.name}
                  </td>
                  <td style={{ fontWeight: '600' }}>{fmt(b.amount)}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {b.categories?.map(c => (
                        <span key={c.id} style={{
                          padding: '0.2rem 0.5rem', borderRadius: '12px',
                          background: c.color + '20', color: c.color,
                          fontSize: '0.75rem', fontWeight: '600'
                        }}>{c.name}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button className="btn" onClick={() => handleEdit(b)}
                      style={{ padding: '0.3rem 0.6rem', marginRight: '0.3rem', background: '#667eea', color: 'white', fontSize: '0.8rem' }}>
                      ✏️ Editar
                    </button>
                    <button className="btn" onClick={() => handleDelete(b.id)}
                      style={{ padding: '0.3rem 0.6rem', background: '#dc3545', color: 'white', fontSize: '0.8rem' }}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
          <p style={{ fontSize: '1.1rem' }}>No hay presupuestos creados.</p>
          <p>Haz clic en "+ Nuevo Presupuesto" para empezar.</p>
        </div>
      )}
    </div>
  );
}
