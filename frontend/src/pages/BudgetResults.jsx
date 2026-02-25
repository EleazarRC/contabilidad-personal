import { useState, useEffect } from 'react';
import { getBudgetResults } from '../services/api';

export default function BudgetResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fmt = (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => { loadResults(); }, [month, year]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const res = await getBudgetResults(month, year);
      setResults(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
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
      <h2>📊 Resultado de Presupuestos</h2>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        {/* Navegador de mes */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className="btn" onClick={prevMonth} style={{ padding: '0.4rem 1rem', background: '#eee', color: '#333', fontWeight: '600' }}>◀</button>
          <span style={{ fontWeight: '700', fontSize: '1.2rem', minWidth: '180px', textAlign: 'center' }}>
            {monthNames[month - 1]} {year}
          </span>
          <button className="btn" onClick={nextMonth} style={{ padding: '0.4rem 1rem', background: '#eee', color: '#333', fontWeight: '600' }}>▶</button>
        </div>

        {results.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '2rem 0' }}>
            No hay presupuestos creados. Ve a <strong>Configuración → Presupuestos</strong> para crear uno.
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
                      fontSize: '0.85rem', fontWeight: '600',
                      color: r.remaining >= 0 ? '#4CAF50' : '#F44336'
                    }}>
                      {r.remaining >= 0 ? `Quedan ${fmt(r.remaining)}` : `Excedido ${fmt(Math.abs(r.remaining))}`}
                    </div>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div style={{ width: '100%', height: '12px', background: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
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
                <div style={{ borderTop: '2px solid #eee', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1.1rem' }}>TOTAL</strong>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{fmt(totalSpent)}</span>
                    <span style={{ color: '#888' }}> / {fmt(totalBudget)}</span>
                    <span style={{
                      marginLeft: '0.5rem', fontWeight: '600',
                      color: totalPct > 100 ? '#F44336' : totalPct > 80 ? '#FF9800' : '#4CAF50'
                    }}>({totalPct}%)</span>
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
