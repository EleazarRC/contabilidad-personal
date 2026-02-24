import { useState, useEffect } from 'react';
import { getMonthlySummary, getTransactions } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function MonthlyReport() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, transactionsRes] = await Promise.all([
        getMonthlySummary(selectedMonth, selectedYear),
        getTransactions({ month: selectedMonth, year: selectedYear })
      ]);

      setSummary(summaryRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

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

  const currentYear2 = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear2 - i);

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  const categoryData = summary?.porCategoria || [];
  const ingresosData = categoryData.filter(c => c.type === 'ingreso');
  const gastosData = categoryData.filter(c => c.type === 'gasto');

  const barChartDataIngresos = {
    labels: ingresosData.map(c => c.name),
    datasets: [{
      label: 'Ingresos',
      data: ingresosData.map(c => c.total),
      backgroundColor: ingresosData.map(c => c.color + 'CC'),
      borderColor: ingresosData.map(c => c.color),
      borderWidth: 2,
      borderRadius: 6
    }]
  };

  const barChartDataGastos = {
    labels: gastosData.map(c => c.name),
    datasets: [{
      label: 'Gastos',
      data: gastosData.map(c => c.total),
      backgroundColor: gastosData.map(c => c.color + 'CC'),
      borderColor: gastosData.map(c => c.color),
      borderWidth: 2,
      borderRadius: 6
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = formatCurrency(context.parsed.x);
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed.x / total) * 100).toFixed(1);
            return `${value} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#667eea' }}>Reporte Mensual</h2>

      <div className="filters">
        <div className="filter-group">
          <label>Mes</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
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
      </div>

      <div className="summary-cards">
        <div className="summary-card ingresos">
          <h3>Total Ingresos</h3>
          <div className="amount">{formatCurrency(summary?.ingresos || 0)}</div>
        </div>
        <div className="summary-card gastos">
          <h3>Total Gastos</h3>
          <div className="amount">{formatCurrency(summary?.gastos || 0)}</div>
        </div>
        <div className="summary-card balance">
          <h3>Balance</h3>
          <div className="amount">{formatCurrency(summary?.balance || 0)}</div>
        </div>
      </div>

      {/* Top 5 gastos del mes */}
      {(() => {
        const topGastos = transactions
          .filter(t => t.type === 'gasto')
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        return topGastos.length > 0 ? (
          <div className="card">
            <h3>🔥 Top 5 Gastos del Mes</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {topGastos.map((t, i) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 700, color: '#dc3545' }}>{i + 1}</td>
                      <td>{format(new Date(t.date), 'dd/MM')}</td>
                      <td>{t.description}</td>
                      <td>
                        <span className="category-badge" style={{ backgroundColor: t.category_color }}>
                          {t.category_name}
                        </span>
                      </td>
                      <td style={{ color: '#dc3545', fontWeight: 600 }}>
                        -{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null;
      })()}

      {ingresosData.length > 0 || gastosData.length > 0 ? (
        <div className="charts-grid">
          {ingresosData.length > 0 && (
            <div className="chart-container">
              <h3>Distribución de Ingresos</h3>
              <div style={{ height: `${Math.max(ingresosData.length * 40 + 40, 150)}px` }}>
                <Bar data={barChartDataIngresos} options={chartOptions} />
              </div>
            </div>
          )}
          {gastosData.length > 0 && (
            <div className="chart-container">
              <h3>Distribución de Gastos</h3>
              <div style={{ height: `${Math.max(gastosData.length * 40 + 40, 150)}px` }}>
                <Bar data={barChartDataGastos} options={chartOptions} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <h3>No hay datos para este mes</h3>
            <p>Agrega transacciones para ver las estadísticas</p>
          </div>
        </div>
      )}

      {categoryData.length > 0 && (
        <div className="card">
          <h3>Detalle por Categoría</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Total</th>
                  <th>% del Total</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((cat, index) => {
                  const totalTipo = cat.type === 'ingreso' ? summary.ingresos : summary.gastos;
                  const percentage = totalTipo > 0 ? ((cat.total / totalTipo) * 100).toFixed(1) : 0;

                  return (
                    <tr key={index}>
                      <td>
                        <span
                          className="category-badge"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.name}
                        </span>
                      </td>
                      <td>
                        <span className={`transaction-type ${cat.type}`}>
                          {cat.type}
                        </span>
                      </td>
                      <td style={{
                        color: cat.type === 'ingreso' ? '#28a745' : '#dc3545',
                        fontWeight: 600
                      }}>
                        {formatCurrency(cat.total)}
                      </td>
                      <td>{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonthlyReport;
