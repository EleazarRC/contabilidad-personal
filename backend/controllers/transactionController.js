const db = require('../config/database');

// Obtener todas las transacciones (con paginación opcional)
exports.getAllTransactions = (req, res) => {
  const { month, year, type, category_id, page, limit: limitParam } = req.query;

  let whereClause = ' WHERE 1=1';
  const params = [];

  if (month && year) {
    whereClause += ` AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?`;
    params.push(month.padStart(2, '0'), year);
  } else if (year) {
    whereClause += ` AND strftime('%Y', t.date) = ?`;
    params.push(year);
  }

  if (type) {
    whereClause += ` AND t.type = ?`;
    params.push(type);
  }

  if (category_id) {
    whereClause += ` AND t.category_id = ?`;
    params.push(category_id);
  }

  // Count total for pagination
  const countQuery = `SELECT COUNT(*) as total FROM transactions t ${whereClause}`;
  
  db.get(countQuery, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });

    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color 
      FROM transactions t 
      JOIN categories c ON t.category_id = c.id 
      ${whereClause}
      ORDER BY t.date DESC, t.created_at DESC
    `;

    const queryParams = [...params];

    if (page) {
      const pageNum = parseInt(page) || 1;
      const pageLimit = parseInt(limitParam) || 50;
      const offset = (pageNum - 1) * pageLimit;
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(pageLimit, offset);

      db.all(query, queryParams, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          data: rows,
          total: countResult.total,
          page: pageNum,
          limit: pageLimit,
          totalPages: Math.ceil(countResult.total / pageLimit)
        });
      });
    } else {
      db.all(query, queryParams, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    }
  });
};

// Obtener transacción por ID
exports.getTransactionById = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT t.*, c.name as category_name, c.color as category_color 
     FROM transactions t 
     JOIN categories c ON t.category_id = c.id 
     WHERE t.id = ?`,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }
      res.json(row);
    }
  );
};

// Crear nueva transacción
exports.createTransaction = (req, res) => {
  const { description, amount, type, category_id, date } = req.body;

  if (!description || !amount || !type || !category_id || !date) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  if (!['ingreso', 'gasto'].includes(type)) {
    return res.status(400).json({ error: 'Tipo debe ser "ingreso" o "gasto"' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }

  db.run(
    'INSERT INTO transactions (description, amount, type, category_id, date) VALUES (?, ?, ?, ?, ?)',
    [description, amount, type, category_id, date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        description,
        amount,
        type,
        category_id,
        date
      });
    }
  );
};

// Actualizar transacción
exports.updateTransaction = (req, res) => {
  const { id } = req.params;
  const { description, amount, type, category_id, date } = req.body;

  if (!description || !amount || !type || !category_id || !date) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  if (!['ingreso', 'gasto'].includes(type)) {
    return res.status(400).json({ error: 'Tipo debe ser "ingreso" o "gasto"' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }

  db.run(
    'UPDATE transactions SET description = ?, amount = ?, type = ?, category_id = ?, date = ? WHERE id = ?',
    [description, amount, type, category_id, date, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }
      res.json({ id, description, amount, type, category_id, date });
    }
  );
};

// Eliminar transacción
exports.deleteTransaction = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM transactions WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    res.json({ message: 'Transacción eliminada exitosamente' });
  });
};
