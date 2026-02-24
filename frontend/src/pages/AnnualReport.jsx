import { useState, useEffect } from 'react';
import { getAnnualSummary } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function AnnualReport() {
  const [summary, setSummary] = useState(null);
  const [prevSummary, setPrevSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [response, prevResponse] = await Promise.all([
        getAnnualSummary(selectedYear),
        getAnnualSummary(selectedYear - 1).catch(() => ({ data: null }))
      ]);
      setSummary(response.data);
      setPrevSummary(prevResponse.data);
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  const monthlyData = summary?.porMes || [];

  // Datos para gráfico de barras
  const barChartData = {
    labels: meses,
    datasets: [
      {
        label: 'Ingresos',
        data: monthlyData.map(m => m.ingresos),
        backgroundColor: 'rgba(40, 167, 69, 0.7)',
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 1
      },
      {
        label: 'Gastos',
        data: monthlyData.map(m => m.gastos),
        backgroundColor: 'rgba(220, 53, 69, 0.7)',
        borderColor: 'rgba(220, 53, 69, 1)',
        borderWidth: 1
      }
    ]
  };

  // Datos para gráfico de líneas
  const lineChartData = {
    labels: meses,
    datasets: [
      {
        label: 'Balance Mensual',
        data: monthlyData.map(m => m.ingresos - m.gastos),
        borderColor: 'rgba(102, 126, 234, 1)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const categoryData = summary?.porCategoria || [];
  const ingresosData = categoryData.filter(c => c.type === 'ingreso');
  const gastosData = categoryData.filter(c => c.type === 'gasto');

  const pieChartDataIngresos = {
    labels: ingresosData.map(c => c.name),
    datasets: [{
      data: ingresosData.map(c => c.total),
      backgroundColor: ingresosData.map(c => c.color),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const pieChartDataGastos = {
    labels: gastosData.map(c => c.name),
    datasets: [{
      data: gastosData.map(c => c.total),
      backgroundColor: gastosData.map(c => c.color),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = formatCurrency(context.parsed);
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#667eea' }}>Reporte Anual</h2>

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
      </div>

      <div className="summary-cards">
        <div className="summary-card ingresos">
          <h3>Total Ingresos Anual</h3>
          <div className="amount">{formatCurrency(summary?.ingresos || 0)}</div>
          {prevSummary && prevSummary.ingresos > 0 && (
            <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: summary.ingresos >= prevSummary.ingresos ? '#28a745' : '#dc3545' }}>
              {summary.ingresos >= prevSummary.ingresos ? '▲' : '▼'} {Math.abs(((summary.ingresos - prevSummary.ingresos) / prevSummary.ingresos) * 100).toFixed(1)}% vs {selectedYear - 1}
            </div>
          )}
        </div>
        <div className="summary-card gastos">
          <h3>Total Gastos Anual</h3>
          <div className="amount">{formatCurrency(summary?.gastos || 0)}</div>
          {prevSummary && prevSummary.gastos > 0 && (
            <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: summary.gastos <= prevSummary.gastos ? '#28a745' : '#dc3545' }}>
              {summary.gastos <= prevSummary.gastos ? '▼' : '▲'} {Math.abs(((summary.gastos - prevSummary.gastos) / prevSummary.gastos) * 100).toFixed(1)}% vs {selectedYear - 1}
            </div>
          )}
        </div>
        <div className="summary-card balance">
          <h3>Balance Anual</h3>
          <div className="amount">{formatCurrency(summary?.balance || 0)}</div>
          {prevSummary && (
            <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: '#888' }}>
              Anterior: {formatCurrency(prevSummary.balance || 0)}
            </div>
          )}
        </div>
      </div>

      {monthlyData.some(m => m.ingresos > 0 || m.gastos > 0) ? (
        <>
          <div className="chart-container">
            <h3>Ingresos vs Gastos por Mes</h3>
            <Bar data={barChartData} options={chartOptions} />
          </div>

          <div className="chart-container">
            <h3>Evolución del Balance Mensual</h3>
            <Line data={lineChartData} options={chartOptions} />
          </div>

          {(ingresosData.length > 0 || gastosData.length > 0) && (
            <div className="charts-grid">
              {ingresosData.length > 0 && (
                <div className="chart-container">
                  <h3>Distribución Anual de Ingresos</h3>
                  <Pie data={pieChartDataIngresos} options={pieChartOptions} />
                </div>
              )}
              {gastosData.length > 0 && (
                <div className="chart-container">
                  <h3>Distribución Anual de Gastos</h3>
                  <Pie data={pieChartDataGastos} options={pieChartOptions} />
                </div>
              )}
            </div>
          )}

          <div className="card">
            <h3>Resumen Mensual</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Ingresos</th>
                    <th>Gastos</th>
                    <th>Balance</th>
                    {prevSummary && <th>Gastos {selectedYear - 1}</th>}
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data, index) => {
                    const prevMonth = prevSummary?.porMes?.[index];
                    return (
                    <tr key={index}>
                      <td>{meses[index]}</td>
                      <td style={{ color: '#28a745', fontWeight: 600 }}>
                        {formatCurrency(data.ingresos)}
                      </td>
                      <td style={{ color: '#dc3545', fontWeight: 600 }}>
                        {formatCurrency(data.gastos)}
                      </td>
                      <td style={{
                        color: data.ingresos - data.gastos >= 0 ? '#28a745' : '#dc3545',
                        fontWeight: 600
                      }}>
                        {formatCurrency(data.ingresos - data.gastos)}
                      </td>
                      {prevSummary && (
                        <td style={{ color: '#888' }}>
                          {formatCurrency(prevMonth?.gastos || 0)}
                        </td>
                      )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {categoryData.length > 0 && (
            <div className="card">
              <h3>Detalle Anual por Categoría</h3>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Tipo</th>
                      <th>Total Anual</th>
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
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <h3>No hay datos para este año</h3>
            <p>Agrega transacciones para ver las estadísticas anuales</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnualReport;
