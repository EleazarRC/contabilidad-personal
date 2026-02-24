import { useState, useEffect } from 'react';
import { getTransactions, getMonthlySummary, getCalendarData, getUpcomingForecasts, getDailyBalance } from '../services/api';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend);

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [calendarData, setCalendarData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyBalance, setDailyBalance] = useState(null);
  const [upcomingForecasts, setUpcomingForecasts] = useState([]);

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    loadData();
  }, [currentMonth, currentYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, transactionsRes, calendarRes, dailyRes, upcomingRes] = await Promise.all([
        getMonthlySummary(currentMonth, currentYear),
        getTransactions({ month: currentMonth, year: currentYear }),
        getCalendarData(currentMonth, currentYear),
        getDailyBalance(currentMonth, currentYear),
        getUpcomingForecasts()
      ]);

      setSummary(summaryRes.data);
      setRecentTransactions(transactionsRes.data.slice(0, 10));
      setCalendarData(calendarRes.data);
      setDailyBalance(dailyRes.data);
      setUpcomingForecasts(upcomingRes.data);
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

  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Generar celdas del calendario
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }

    return days;
  };

  const getDayData = (day) => {
    if (!calendarData?.days) return null;
    const dateStr = format(day, 'yyyy-MM-dd');
    return calendarData.days.find(d => d.date === dateStr);
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  // Preparar datos para gráficos de barras
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

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatCurrency(ctx.parsed.x)
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { callback: (v) => formatCurrency(v) }
      }
    }
  };

  const calendarDays = generateCalendarDays();
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#667eea' }}>
        Dashboard - {format(currentDate, 'MMMM yyyy', { locale: es })}
      </h2>

      {/* Calendario Visual */}
      <div className="calendar-container">
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={goToPrevMonth}>◀</button>
          <h3 className="calendar-title">
            📅 {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h3>
          <button className="calendar-nav-btn calendar-today-btn" onClick={goToToday}>Hoy</button>
          <button className="calendar-nav-btn" onClick={goToNextMonth}>▶</button>
        </div>

        <div className="calendar-grid">
          {dayNames.map(name => (
            <div key={name} className="calendar-day-name">{name}</div>
          ))}

          {calendarDays.map((day, index) => {
            const dayData = getDayData(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            return (
              <div
                key={index}
                className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayData ? 'has-data' : ''}`}
                onClick={() => {
                  if (isCurrentMonth && dayData) {
                    setSelectedDay(isSelected ? null : day);
                  }
                }}
              >
                <span className="calendar-day-number">{format(day, 'd')}</span>
                {dayData && isCurrentMonth && (
                  <div className="calendar-indicators">
                    {dayData.total_ingresos > 0 && <span className="calendar-dot dot-ingreso" title={`Ingresos: ${formatCurrency(dayData.total_ingresos)}`}></span>}
                    {dayData.total_gastos > 0 && <span className="calendar-dot dot-gasto" title={`Gastos: ${formatCurrency(dayData.total_gastos)}`}></span>}
                    {dayData.ahorros?.length > 0 && <span className="calendar-dot dot-ahorro" title="Movimiento de ahorro"></span>}
                    {dayData.prev_mensuales?.length > 0 && <span className="calendar-dot dot-prev-mensual" title="Previsión mensual"></span>}
                    {dayData.prev_anuales?.length > 0 && <span className="calendar-dot dot-prev-anual" title="Previsión anual"></span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="calendar-legend">
          <span className="legend-item"><span className="calendar-dot dot-ingreso"></span> Ingreso</span>
          <span className="legend-item"><span className="calendar-dot dot-gasto"></span> Gasto</span>
          <span className="legend-item"><span className="calendar-dot dot-ahorro"></span> Ahorro</span>
          <span className="legend-item"><span className="calendar-dot dot-prev-mensual"></span> Pre. Mensual</span>
          <span className="legend-item"><span className="calendar-dot dot-prev-anual"></span> Pre. Anual</span>
        </div>

        {/* Detalle del día seleccionado */}
        {selectedDay && getDayData(selectedDay) && (
          <div className="calendar-day-detail">
            <h4>📋 {format(selectedDay, "d 'de' MMMM, yyyy", { locale: es })}</h4>
            {(() => {
              const dayInfo = getDayData(selectedDay);
              return (
                <div className="day-detail-content">
                  {dayInfo.ingresos.length > 0 && (
                    <div className="day-detail-section">
                      <h5 style={{ color: '#28a745' }}>💚 Ingresos ({formatCurrency(dayInfo.total_ingresos)})</h5>
                      {dayInfo.ingresos.map((t, i) => (
                        <div key={i} className="day-detail-item">
                          <span className="category-badge" style={{ backgroundColor: t.category_color }}>{t.category_name}</span>
                          <span>{t.description}</span>
                          <span style={{ color: '#28a745', fontWeight: 600 }}>+{formatCurrency(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {dayInfo.gastos.length > 0 && (
                    <div className="day-detail-section">
                      <h5 style={{ color: '#dc3545' }}>❤️ Gastos ({formatCurrency(dayInfo.total_gastos)})</h5>
                      {dayInfo.gastos.map((t, i) => (
                        <div key={i} className="day-detail-item">
                          <span className="category-badge" style={{ backgroundColor: t.category_color }}>{t.category_name}</span>
                          <span>{t.description}</span>
                          <span style={{ color: '#dc3545', fontWeight: 600 }}>-{formatCurrency(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {dayInfo.ahorros.length > 0 && (
                    <div className="day-detail-section">
                      <h5 style={{ color: '#667eea' }}>💙 Ahorros</h5>
                      {dayInfo.ahorros.map((s, i) => (
                        <div key={i} className="day-detail-item">
                          <span className="category-badge" style={{ backgroundColor: s.account_color }}>{s.account_name}</span>
                          <span>{s.description || (s.type === 'ingreso' ? 'Depósito' : 'Retiro')}</span>
                          <span style={{ color: s.type === 'ingreso' ? '#28a745' : '#dc3545', fontWeight: 600 }}>
                            {s.type === 'ingreso' ? '+' : '-'}{formatCurrency(s.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {dayInfo.prev_mensuales?.length > 0 && (
                    <div className="day-detail-section">
                      <h5 style={{ color: '#fd7e14' }}>🟠 Previsiones Mensuales</h5>
                      {dayInfo.prev_mensuales.map((f, i) => (
                        <div key={i} className="day-detail-item">
                          <span className="category-badge" style={{ backgroundColor: f.category_color }}>{f.category_name}</span>
                          <span>{f.description} {f.completed ? '✅' : ''}</span>
                          <span style={{ color: '#fd7e14', fontWeight: 600 }}>{formatCurrency(f.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {dayInfo.prev_anuales?.length > 0 && (
                    <div className="day-detail-section">
                      <h5 style={{ color: '#9b59b6' }}>🟣 Previsiones Anuales</h5>
                      {dayInfo.prev_anuales.map((f, i) => (
                        <div key={i} className="day-detail-item">
                          <span className="category-badge" style={{ backgroundColor: f.category_color }}>{f.category_name}</span>
                          <span>{f.description} {f.completed ? '✅' : ''}</span>
                          <span style={{ color: '#9b59b6', fontWeight: 600 }}>{formatCurrency(f.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Resumen del mes */}
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

      {/* Gráficos de barras */}
      {ingresosData.length > 0 || gastosData.length > 0 ? (
        <div className="charts-grid">
          {ingresosData.length > 0 && (
            <div className="chart-container">
              <h3>Ingresos por Categoría</h3>
              <div style={{ height: `${Math.max(ingresosData.length * 40 + 40, 150)}px` }}>
                <Bar data={barChartDataIngresos} options={barChartOptions} />
              </div>
            </div>
          )}
          {gastosData.length > 0 && (
            <div className="chart-container">
              <h3>Gastos por Categoría</h3>
              <div style={{ height: `${Math.max(gastosData.length * 40 + 40, 150)}px` }}>
                <Bar data={barChartDataGastos} options={barChartOptions} />
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Gráfico de balance acumulado */}
      {dailyBalance?.days?.length > 0 && (
        <div className="chart-container">
          <h3>📈 Balance Acumulado del Mes</h3>
          <div style={{ height: '250px' }}>
            <Line
              data={{
                labels: dailyBalance.days.map(d => d.day),
                datasets: [{
                  label: 'Balance acumulado',
                  data: dailyBalance.days.map(d => d.balance),
                  borderColor: '#667eea',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.3,
                  pointRadius: 1,
                  pointHoverRadius: 5
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      title: (ctx) => `Día ${ctx[0].label}`,
                      label: (ctx) => `Balance: ${formatCurrency(ctx.parsed.y)}`
                    }
                  }
                },
                scales: {
                  x: { title: { display: true, text: 'Día del mes' } },
                  y: {
                    beginAtZero: false,
                    ticks: { callback: (v) => formatCurrency(v) }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Previsiones próximas */}
      {upcomingForecasts.length > 0 && (
        <div className="card">
          <h3>📋 Próximas Previsiones</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {upcomingForecasts.map(f => (
                  <tr key={f.id}>
                    <td>{format(new Date(f.reminder_date), 'dd/MM/yyyy')}</td>
                    <td>{f.description}</td>
                    <td>
                      <span className="category-badge" style={{ backgroundColor: f.category_color }}>
                        {f.category_name}
                      </span>
                    </td>
                    <td>
                      <span className={`transaction-type ${f.forecast_type === 'monthly' ? 'gasto' : 'ingreso'}`}>
                        {f.forecast_type === 'monthly' ? 'Mensual' : 'Anual'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#fd7e14' }}>
                      {formatCurrency(f.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transacciones recientes */}
      <div className="card">
        <h3>Transacciones Recientes</h3>
        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No hay transacciones este mes</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(transaction => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
