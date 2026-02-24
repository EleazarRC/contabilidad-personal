const db = require('../config/database');

// Obtener todas las previsiones
exports.getAllForecasts = (req, res) => {
  const { year, month, completed, forecast_type } = req.query;

  let query = `
    SELECT f.*, c.name as category_name, c.color as category_color 
    FROM annual_forecasts f 
    JOIN categories c ON f.category_id = c.id 
    WHERE 1=1
  `;
  const params = [];

  // Filtrar por tipo (monthly o annual)
  if (forecast_type) {
    query += ` AND f.forecast_type = ?`;
    params.push(forecast_type);
  }

  // Para anuales: mostrar del año especificado O recurrentes
  if (forecast_type === 'annual' && year) {
    query += ` AND (f.year = ? OR f.is_recurring = 1)`;
    params.push(year);
  } else if (year && !forecast_type) {
    query += ` AND (f.year = ? OR f.is_recurring = 1)`;
    params.push(year);
  }

  // Para mensuales: filtrar por mes si se especifica
  if (forecast_type === 'monthly' && month) {
    query += ` AND f.month = ?`;
    params.push(month);
  }

  if (completed !== undefined) {
    query += ` AND f.completed = ?`;
    params.push(completed === 'true' ? 1 : 0);
  }

  query += ` ORDER BY f.reminder_date ASC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};


// Obtener previsión por ID
exports.getForecastById = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT f.*, c.name as category_name, c.color as category_color 
     FROM annual_forecasts f 
     JOIN categories c ON f.category_id = c.id 
     WHERE f.id = ?`,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Previsión no encontrada' });
      }
      res.json(row);
    }
  );
};

// Crear nueva previsión
exports.createForecast = (req, res) => {
  const { description, amount, category_id, reminder_date, year, month, notes, is_recurring, forecast_type } = req.body;

  if (!description || !amount || !category_id || !reminder_date || !forecast_type) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  // Para anuales no recurrentes, year es obligatorio
  if (forecast_type === 'annual' && !is_recurring && !year) {
    return res.status(400).json({ error: 'El año es requerido para previsiones anuales no recurrentes' });
  }

  // Para mensuales, month es opcional (puede aplicar a todos los meses)
  // if (forecast_type === 'monthly' && !month) {
  //   return res.status(400).json({ error: 'El mes es requerido para previsiones mensuales' });
  // }

  if (amount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }

  db.run(
    'INSERT INTO annual_forecasts (description, amount, category_id, reminder_date, year, month, notes, is_recurring, forecast_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [description, amount, category_id, reminder_date, year || null, month || null, notes || null, is_recurring ? 1 : 0, forecast_type || 'annual'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        description,
        amount,
        category_id,
        reminder_date,
        year: year || null,
        month: month || null,
        notes,
        is_recurring: is_recurring ? 1 : 0,
        forecast_type: forecast_type || 'annual',
        completed: 0
      });
    }
  );
};

// Actualizar previsión
exports.updateForecast = (req, res) => {
  const { id } = req.params;
  const { description, amount, category_id, reminder_date, year, month, notes, completed, is_recurring, forecast_type } = req.body;

  if (!description || !amount || !category_id || !reminder_date || !forecast_type) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  // Para anuales no recurrentes, year es obligatorio
  if (forecast_type === 'annual' && !is_recurring && !year) {
    return res.status(400).json({ error: 'El año es requerido para previsiones anuales no recurrentes' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }

  db.run(
    'UPDATE annual_forecasts SET description = ?, amount = ?, category_id = ?, reminder_date = ?, year = ?, month = ?, notes = ?, completed = ?, is_recurring = ?, forecast_type = ? WHERE id = ?',
    [description, amount, category_id, reminder_date, year || null, month || null, notes || null, completed ? 1 : 0, is_recurring ? 1 : 0, forecast_type || 'annual', id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Previsión no encontrada' });
      }
      res.json({ id, description, amount, category_id, reminder_date, year, month, notes, completed, is_recurring, forecast_type });
    }
  );
};

// Marcar previsión como completada
exports.toggleCompleted = (req, res) => {
  const { id } = req.params;

  db.get('SELECT completed FROM annual_forecasts WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Previsión no encontrada' });
    }

    const newCompleted = row.completed ? 0 : 1;

    db.run('UPDATE annual_forecasts SET completed = ? WHERE id = ?', [newCompleted, id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id, completed: newCompleted });
    });
  });
};

// Eliminar previsión
exports.deleteForecast = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM annual_forecasts WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Previsión no encontrada' });
    }
    res.json({ message: 'Previsión eliminada exitosamente' });
  });
};

// Obtener resumen de previsiones por año o mes
exports.getForecastSummary = (req, res) => {
  const { year, forecast_type } = req.query;

  if (!year && forecast_type !== 'monthly') {
    return res.status(400).json({ error: 'Se requiere el año para previsiones anuales' });
  }

  let queries = {};

  if (forecast_type === 'monthly') {
    queries = {
      total: `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM annual_forecasts 
        WHERE forecast_type = 'monthly'
      `,
      completed: `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM annual_forecasts 
        WHERE forecast_type = 'monthly' AND completed = 1
      `,
      pending: `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM annual_forecasts 
        WHERE forecast_type = 'monthly' AND completed = 0
      `,
      byCategory: `
        SELECT c.name, c.color, COALESCE(SUM(f.amount), 0) as total, COUNT(*) as count
        FROM annual_forecasts f
        JOIN categories c ON f.category_id = c.id
        WHERE f.forecast_type = 'monthly'
        GROUP BY c.id, c.name, c.color
        ORDER BY total DESC
      `
    };
  } else {
    queries = {
      total: `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM annual_forecasts 
        WHERE forecast_type = 'annual' AND (year = ? OR is_recurring = 1)
      `,
      completed: `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM annual_forecasts 
        WHERE forecast_type = 'annual' AND (year = ? OR is_recurring = 1) AND completed = 1
      `,
      pending: `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM annual_forecasts 
        WHERE forecast_type = 'annual' AND (year = ? OR is_recurring = 1) AND completed = 0
      `,
      byCategory: `
        SELECT c.name, c.color, COALESCE(SUM(f.amount), 0) as total, COUNT(*) as count
        FROM annual_forecasts f
        JOIN categories c ON f.category_id = c.id
        WHERE f.forecast_type = 'annual' AND (f.year = ? OR f.is_recurring = 1)
        GROUP BY c.id, c.name, c.color
        ORDER BY total DESC
      `
    };
  }

  const params = forecast_type === 'monthly' ? [] : [year, year, year, year];

  db.get(queries.total, forecast_type === 'monthly' ? [] : [year], (err, total) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get(queries.completed, forecast_type === 'monthly' ? [] : [year], (err, completed) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get(queries.pending, forecast_type === 'monthly' ? [] : [year], (err, pending) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(queries.byCategory, forecast_type === 'monthly' ? [] : [year], (err, byCategory) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            year: forecast_type === 'monthly' ? null : parseInt(year),
            forecast_type: forecast_type || 'annual',
            total: total.total,
            completed: completed.total,
            pending: pending.total,
            byCategory
          });
        });
      });
    });
  });
};
