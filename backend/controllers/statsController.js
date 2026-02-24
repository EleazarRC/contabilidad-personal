const db = require('../config/database');

// Obtener resumen mensual
exports.getMonthlySummary = (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Se requieren mes y año' });
  }

  const monthPadded = month.padStart(2, '0');

  const queries = {
    ingresos: `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'ingreso' 
      AND strftime('%m', date) = ? 
      AND strftime('%Y', date) = ?
    `,
    gastos: `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'gasto' 
      AND strftime('%m', date) = ? 
      AND strftime('%Y', date) = ?
    `,
    porCategoria: `
      SELECT c.name, c.color, t.type, COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE strftime('%m', t.date) = ? 
      AND strftime('%Y', t.date) = ?
      GROUP BY c.id, c.name, c.color, t.type
      ORDER BY total DESC
    `
  };

  db.get(queries.ingresos, [monthPadded, year], (err, ingresos) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get(queries.gastos, [monthPadded, year], (err, gastos) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(queries.porCategoria, [monthPadded, year], (err, porCategoria) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          mes: parseInt(month),
          año: parseInt(year),
          ingresos: ingresos.total,
          gastos: gastos.total,
          balance: ingresos.total - gastos.total,
          porCategoria
        });
      });
    });
  });
};

// Obtener resumen anual
exports.getAnnualSummary = (req, res) => {
  const { year } = req.query;

  if (!year) {
    return res.status(400).json({ error: 'Se requiere el año' });
  }

  const queries = {
    ingresos: `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'ingreso' 
      AND strftime('%Y', date) = ?
    `,
    gastos: `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'gasto' 
      AND strftime('%Y', date) = ?
    `,
    porMes: `
      SELECT 
        strftime('%m', date) as mes,
        type,
        COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE strftime('%Y', date) = ?
      GROUP BY strftime('%m', date), type
      ORDER BY mes
    `,
    porCategoria: `
      SELECT c.name, c.color, t.type, COALESCE(SUM(t.amount), 0) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE strftime('%Y', t.date) = ?
      GROUP BY c.id, c.name, c.color, t.type
      ORDER BY total DESC
    `
  };

  db.get(queries.ingresos, [year], (err, ingresos) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get(queries.gastos, [year], (err, gastos) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(queries.porMes, [year], (err, porMes) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(queries.porCategoria, [year], (err, porCategoria) => {
          if (err) return res.status(500).json({ error: err.message });

          // Formatear datos mensuales
          const mesesData = Array.from({ length: 12 }, (_, i) => ({
            mes: i + 1,
            ingresos: 0,
            gastos: 0
          }));

          porMes.forEach(item => {
            const mesIndex = parseInt(item.mes) - 1;
            if (item.type === 'ingreso') {
              mesesData[mesIndex].ingresos = item.total;
            } else {
              mesesData[mesIndex].gastos = item.total;
            }
          });

          res.json({
            año: parseInt(year),
            ingresos: ingresos.total,
            gastos: gastos.total,
            balance: ingresos.total - gastos.total,
            porMes: mesesData,
            porCategoria
          });
        });
      });
    });
  });
};

// Obtener años disponibles
exports.getAvailableYears = (req, res) => {
  db.all(
    `SELECT DISTINCT strftime('%Y', date) as year 
     FROM transactions 
     ORDER BY year DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const years = rows.map(row => parseInt(row.year));
      res.json(years);
    }
  );
};

// Obtener datos para el calendario visual
exports.getCalendarData = (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Se requieren mes y año' });
  }

  const monthPadded = month.toString().padStart(2, '0');

  // Transacciones agrupadas por día
  const transactionsQuery = `
    SELECT 
      t.date,
      t.type,
      t.description,
      t.amount,
      c.name as category_name,
      c.color as category_color
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
    ORDER BY t.date ASC
  `;

  // Movimientos de ahorro del mes
  const savingsQuery = `
    SELECT 
      sm.date,
      sm.type,
      sm.description,
      sm.amount,
      sa.name as account_name,
      sa.color as account_color
    FROM savings_movements sm
    JOIN savings_accounts sa ON sm.account_id = sa.id
    WHERE strftime('%m', sm.date) = ? AND strftime('%Y', sm.date) = ?
    ORDER BY sm.date ASC
  `;

  // Previsiones del mes
  const forecastsQuery = `
    SELECT 
      af.reminder_date as date,
      af.description,
      af.amount,
      af.forecast_type,
      af.completed,
      c.name as category_name,
      c.color as category_color
    FROM annual_forecasts af
    JOIN categories c ON af.category_id = c.id
    WHERE strftime('%m', af.reminder_date) = ? AND strftime('%Y', af.reminder_date) = ?
    ORDER BY af.reminder_date ASC
  `;

  db.all(transactionsQuery, [monthPadded, year], (err, transactions) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(savingsQuery, [monthPadded, year], (err, savingsMovements) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(forecastsQuery, [monthPadded, year], (err, forecasts) => {
        if (err) return res.status(500).json({ error: err.message });

        // Agrupar por día
        const dayMap = {};

        const ensureDay = (date) => {
          if (!dayMap[date]) {
            dayMap[date] = { ingresos: [], gastos: [], ahorros: [], prev_mensuales: [], prev_anuales: [] };
          }
        };

        transactions.forEach(t => {
          ensureDay(t.date);
          if (t.type === 'ingreso') {
            dayMap[t.date].ingresos.push(t);
          } else {
            dayMap[t.date].gastos.push(t);
          }
        });

        savingsMovements.forEach(s => {
          ensureDay(s.date);
          dayMap[s.date].ahorros.push(s);
        });

        forecasts.forEach(f => {
          ensureDay(f.date);
          if (f.forecast_type === 'monthly') {
            dayMap[f.date].prev_mensuales.push(f);
          } else {
            dayMap[f.date].prev_anuales.push(f);
          }
        });

        // Convertir a array con totales
        const days = Object.entries(dayMap).map(([date, data]) => ({
          date,
          total_ingresos: data.ingresos.reduce((sum, t) => sum + t.amount, 0),
          total_gastos: data.gastos.reduce((sum, t) => sum + t.amount, 0),
          total_ahorros: data.ahorros.reduce((sum, s) => sum + (s.type === 'ingreso' ? s.amount : -s.amount), 0),
          ingresos: data.ingresos,
          gastos: data.gastos,
          ahorros: data.ahorros,
          prev_mensuales: data.prev_mensuales,
          prev_anuales: data.prev_anuales
        }));

        res.json({ mes: parseInt(month), año: parseInt(year), days });
      });
    });
  });
};

// Previsiones próximas sin completar
exports.getUpcomingForecasts = (req, res) => {
  const query = `
    SELECT af.*, c.name as category_name, c.color as category_color
    FROM annual_forecasts af
    JOIN categories c ON af.category_id = c.id
    WHERE af.completed = 0
    AND af.reminder_date >= date('now')
    ORDER BY af.reminder_date ASC
    LIMIT 5
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Balance diario acumulado del mes
exports.getDailyBalance = (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Se requieren mes y año' });
  }

  const monthPadded = month.toString().padStart(2, '0');
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();

  const query = `
    SELECT date, type, amount
    FROM transactions
    WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    ORDER BY date ASC
  `;

  db.all(query, [monthPadded, year], (err, transactions) => {
    if (err) return res.status(500).json({ error: err.message });

    // Agrupar por día
    const dailyMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${monthPadded}-${d.toString().padStart(2, '0')}`;
      dailyMap[dateStr] = { ingresos: 0, gastos: 0 };
    }

    transactions.forEach(t => {
      if (dailyMap[t.date]) {
        if (t.type === 'ingreso') {
          dailyMap[t.date].ingresos += t.amount;
        } else {
          dailyMap[t.date].gastos += t.amount;
        }
      }
    });

    // Calcular balance acumulado
    let cumulative = 0;
    const days = Object.keys(dailyMap).sort().map(date => {
      const day = dailyMap[date];
      cumulative += day.ingresos - day.gastos;
      return {
        date,
        day: parseInt(date.split('-')[2]),
        ingresos: day.ingresos,
        gastos: day.gastos,
        balance: cumulative
      };
    });

    res.json({ mes: parseInt(month), año: parseInt(year), days });
  });
};

