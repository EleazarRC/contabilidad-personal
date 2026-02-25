import { useState, useEffect } from 'react';
import {
  getBudgets, createBudget, updateBudget, deleteBudget,
  getBudgetResults, getCategories
} from '../services/api';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formColor, setFormColor] = useState('#667eea');
  const [formCategoryIds, setFormCategoryIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Month selector
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fmt = (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadResults();
  }, [month, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        getBudgets(),
        getCategories()
      ]);
      setBudgets(budgetsRes.data);
      setCategories(categoriesRes.data.filter(c => c.type === 'gasto'));
      await loadResults();
    } catch (err) {
      console.error('Error loading budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const res = await getBudgetResults(month, year);
      setResults(res.data);
    } catch (err) {
      console.error('Error loading results:', err);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormAmount('');
    setFormColor('#667eea');
    setFormCategoryIds([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: formName,
      amount: parseFloat(formAmount),
      color: formColor,
      category_ids: formCategoryIds
    };

    try {
      if (editingId) {
        await updateBudget(editingId, data);
      } else {
        await createBudget(data);
      }
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleEdit = (budget) => {
    setFormName(budget.name);
    setFormAmount(budget.amount.toString());
    setFormColor(budget.color);
    setFormCategoryIds(budget.categories?.map(c => c.id) || []);
    setEditingId(budget.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;
    try {
      await deleteBudget(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const toggleCategory = (catId) => {
    setFormCategoryIds(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const getBarColor = (pct) => {
    if (pct < 70) return '#4CAF50';
    if (pct < 90) return '#FF9800';
    return '#F44336';
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>📋 Presupuestos</h2>
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
              <div>
                <label>Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ej: Gastos del hogar"
                  required
                />
              </div>
              <div>
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
              <div>
                <label>Color</label>
                <input
                  type="color"
                  value={formColor}
                  onChange={e => setFormColor(e.target.value)}
                  style={{ width: '50px', height: '38px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Categorías de gasto incluidas:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
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
                <p style={{ color: '#999', fontSize: '0.9rem' }}>No hay categorías de gasto. Crea algunas primero en Configuración → Categorías.</p>
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

      {/* RESULTADO DEL MES */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>📊 Resultado del Mes</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn" onClick={prevMonth} style={{ padding: '0.3rem 0.8rem', background: '#eee', color: '#333' }}>◀</button>
            <span style={{ fontWeight: '600', minWidth: '150px', textAlign: 'center' }}>
              {monthNames[month - 1]} {year}
            </span>
            <button className="btn" onClick={nextMonth} style={{ padding: '0.3rem 0.8rem', background: '#eee', color: '#333' }}>▶</button>
          </div>
        </div>

        {results.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '2rem 0' }}>
            No hay presupuestos creados. Haz clic en "+ Nuevo Presupuesto" para empezar.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {results.map(r => (
              <div
                key={r.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: '12px',
                  padding: '1.2rem',
                  borderLeft: `4px solid ${r.color}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{r.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>
                      {r.categories?.map(c => c.name).join(', ') || 'Sin categorías'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: r.percentage > 100 ? '#F44336' : '#333' }}>
                      {fmt(r.spent)} <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: '400' }}>/ {fmt(r.amount)}</span>
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: r.remaining >= 0 ? '#4CAF50' : '#F44336'
                    }}>
                      {r.remaining >= 0
                        ? `Quedan ${fmt(r.remaining)}`
                        : `Excedido ${fmt(Math.abs(r.remaining))}`}
                    </div>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div style={{
                  width: '100%',
                  height: '12px',
                  background: '#f0f0f0',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(r.percentage, 100)}%`,
                    height: '100%',
                    background: getBarColor(r.percentage),
                    borderRadius: '6px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#888', marginTop: '0.3rem' }}>
                  {r.percentage}% utilizado
                </div>
              </div>
            ))}

            {/* Total global */}
            {results.length > 1 && (() => {
              const totalBudget = results.reduce((s, r) => s + r.amount, 0);
              const totalSpent = results.reduce((s, r) => s + r.spent, 0);
              const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
              return (
                <div style={{
                  borderTop: '2px solid #eee',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <strong>TOTAL</strong>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{fmt(totalSpent)}</span>
                    <span style={{ color: '#888' }}> / {fmt(totalBudget)}</span>
                    <span style={{
                      marginLeft: '0.5rem',
                      fontWeight: '600',
                      color: totalPct > 100 ? '#F44336' : totalPct > 80 ? '#FF9800' : '#4CAF50'
                    }}>
                      ({totalPct}%)
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* LISTA DE PRESUPUESTOS */}
      {budgets.length > 0 && (
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
                    <span style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: b.color,
                      marginRight: '0.5rem'
                    }} />
                    {b.name}
                  </td>
                  <td style={{ fontWeight: '600' }}>{fmt(b.amount)}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {b.categories?.map(c => (
                        <span key={c.id} style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          background: c.color + '20',
                          color: c.color,
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>{c.name}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn"
                      onClick={() => handleEdit(b)}
                      style={{ padding: '0.3rem 0.6rem', marginRight: '0.3rem', background: '#667eea', color: 'white', fontSize: '0.8rem' }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleDelete(b.id)}
                      style={{ padding: '0.3rem 0.6rem', background: '#dc3545', color: 'white', fontSize: '0.8rem' }}
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
    </div>
  );
}
