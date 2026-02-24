import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Categorías
export const getCategories = () => api.get('/categories');
export const getCategoryById = (id) => api.get(`/categories/${id}`);
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Transacciones
export const getTransactions = (params) => api.get('/transactions', { params });
export const getTransactionById = (id) => api.get(`/transactions/${id}`);
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Estadísticas
export const getMonthlySummary = (month, year) =>
  api.get('/stats/monthly', { params: { month, year } });
export const getAnnualSummary = (year) =>
  api.get('/stats/annual', { params: { year } });
export const getAvailableYears = () => api.get('/stats/years');

// Previsiones (Mensuales y Anuales)
export const getForecasts = (params) => api.get('/forecasts', { params });
export const getForecastById = (id) => api.get(`/forecasts/${id}`);
export const createForecast = (data) => api.post('/forecasts', data);
export const updateForecast = (id, data) => api.put(`/forecasts/${id}`, data);
export const toggleForecastCompleted = (id) => api.patch(`/forecasts/${id}/toggle`);
export const deleteForecast = (id) => api.delete(`/forecasts/${id}`);
export const getForecastSummary = (year, forecast_type) => {
  const params = {};
  if (year) params.year = year;
  if (forecast_type) params.forecast_type = forecast_type;
  return api.get('/forecasts/summary', { params });
};

// Configuración
export const getDataStats = () => api.get('/settings/stats');
export const deleteAllData = (confirm) => api.post('/settings/delete-all', { confirm });

// Cuentas de Ahorro
export const getSavingsAccounts = () => api.get('/savings');
export const createSavingsAccount = (data) => api.post('/savings', data);
export const updateSavingsAccount = (id, data) => api.put(`/savings/${id}`, data);
export const deleteSavingsAccount = (id) => api.delete(`/savings/${id}`);
export const getSavingsSummary = () => api.get('/savings/summary');
export const getSavingsMovements = (accountId) => api.get(`/savings/${accountId}/movements`);
export const createSavingsMovement = (data) => api.post('/savings/movements', data);
export const deleteSavingsMovement = (id) => api.delete(`/savings/movements/${id}`);

// Deudas
export const getDebts = () => api.get('/debts');
export const createDebt = (data) => api.post('/debts', data);
export const updateDebt = (id, data) => api.put(`/debts/${id}`, data);
export const deleteDebt = (id) => api.delete(`/debts/${id}`);
export const getDebtsSummary = () => api.get('/debts/summary');
export const getDebtPayments = (debtId) => api.get(`/debts/${debtId}/payments`);
export const createDebtPayment = (data) => api.post('/debts/payments', data);
export const deleteDebtPayment = (id) => api.delete(`/debts/payments/${id}`);

// Calendario
export const getCalendarData = (month, year) =>
  api.get('/stats/calendar', { params: { month, year } });

// Previsiones próximas
export const getUpcomingForecasts = () => api.get('/stats/upcoming-forecasts');

// Balance diario acumulado
export const getDailyBalance = (month, year) =>
  api.get('/stats/daily-balance', { params: { month, year } });

// Backup
export const getBackupUrl = () => '/api/settings/backup';

export default api;
