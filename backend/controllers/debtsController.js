const db = require('../config/database');

// Obtener todas las deudas con saldo calculado
exports.getAllDebts = (req, res) => {
  const query = `
    SELECT da.*,
      COALESCE(da.initial_amount, 0) - 
      COALESCE((SELECT SUM(CASE WHEN dp.type = 'pago' THEN dp.amount ELSE -dp.amount END) 
                FROM debt_payments dp WHERE dp.debt_id = da.id), 0) as current_balance,
      COALESCE((SELECT SUM(dp.amount) FROM debt_payments dp 
                WHERE dp.debt_id = da.id AND dp.type = 'pago'), 0) as total_paid,
      (SELECT COUNT(*) FROM debt_payments dp WHERE dp.debt_id = da.id) as total_payments,
      (SELECT MAX(dp.date) FROM debt_payments dp WHERE dp.debt_id = da.id) as last_payment_date
    FROM debt_accounts da
    ORDER BY da.name ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Crear deuda
exports.createDebt = (req, res) => {
  const { name, type, description, color, initial_amount, interest_rate } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
  }

  if (!['tarjeta', 'prestamo', 'hipoteca', 'otro'].includes(type)) {
    return res.status(400).json({ error: 'Tipo inválido' });
  }

  db.run(
    'INSERT INTO debt_accounts (name, type, description, color, initial_amount, interest_rate) VALUES (?, ?, ?, ?, ?, ?)',
    [name, type, description || '', color || '#dc3545', initial_amount || 0, interest_rate || 0],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Ya existe una deuda con ese nombre' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, name, type, description, color, initial_amount, interest_rate });
    }
  );
};

// Actualizar deuda
exports.updateDebt = (req, res) => {
  const { id } = req.params;
  const { name, type, description, color, initial_amount, interest_rate } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
  }

  db.run(
    'UPDATE debt_accounts SET name = ?, type = ?, description = ?, color = ?, initial_amount = ?, interest_rate = ? WHERE id = ?',
    [name, type, description || '', color || '#dc3545', initial_amount || 0, interest_rate || 0, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Ya existe una deuda con ese nombre' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) return res.status(404).json({ error: 'Deuda no encontrada' });
      res.json({ id, name, type, description, color, initial_amount, interest_rate });
    }
  );
};

// Eliminar deuda
exports.deleteDebt = (req, res) => {
  const { id } = req.params;

  db.get('SELECT COUNT(*) as count FROM debt_payments WHERE debt_id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row.count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar una deuda con pagos. Elimina los pagos primero.' });
    }

    db.run('DELETE FROM debt_accounts WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Deuda no encontrada' });
      res.json({ message: 'Deuda eliminada exitosamente' });
    });
  });
};

// Obtener pagos de una deuda
exports.getPayments = (req, res) => {
  const { debt_id } = req.params;

  db.all(
    `SELECT dp.*, da.name as debt_name, da.color as debt_color
     FROM debt_payments dp
     JOIN debt_accounts da ON dp.debt_id = da.id
     WHERE dp.debt_id = ?
     ORDER BY dp.date DESC, dp.created_at DESC`,
    [debt_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// Crear pago/cargo
exports.createPayment = (req, res) => {
  const { debt_id, type, amount, description, date } = req.body;

  if (!debt_id || !type || !amount || !date) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  if (!['pago', 'cargo'].includes(type)) {
    return res.status(400).json({ error: 'Tipo debe ser "pago" o "cargo"' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }

  db.get('SELECT id FROM debt_accounts WHERE id = ?', [debt_id], (err, debt) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!debt) return res.status(404).json({ error: 'Deuda no encontrada' });

    db.run(
      'INSERT INTO debt_payments (debt_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)',
      [debt_id, type, amount, description || '', date],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, debt_id, type, amount, description, date });
      }
    );
  });
};

// Eliminar pago
exports.deletePayment = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM debt_payments WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json({ message: 'Pago eliminado exitosamente' });
  });
};

// Resumen global de deudas
exports.getSummary = (req, res) => {
  const query = `
    SELECT 
      da.id, da.name, da.type, da.color, da.initial_amount, da.interest_rate,
      COALESCE(da.initial_amount, 0) - 
      COALESCE((SELECT SUM(CASE WHEN dp.type = 'pago' THEN dp.amount ELSE -dp.amount END) 
                FROM debt_payments dp WHERE dp.debt_id = da.id), 0) as current_balance,
      COALESCE((SELECT SUM(dp.amount) FROM debt_payments dp 
                WHERE dp.debt_id = da.id AND dp.type = 'pago'), 0) as total_paid,
      COALESCE((SELECT SUM(dp.amount) FROM debt_payments dp 
                WHERE dp.debt_id = da.id AND dp.type = 'cargo'), 0) as total_charged,
      (SELECT COUNT(*) FROM debt_payments dp WHERE dp.debt_id = da.id) as payment_count
    FROM debt_accounts da
    ORDER BY current_balance DESC
  `;

  db.all(query, [], (err, debts) => {
    if (err) return res.status(500).json({ error: err.message });

    const totalDebt = debts.reduce((sum, d) => sum + d.current_balance, 0);
    const totalPaid = debts.reduce((sum, d) => sum + d.total_paid, 0);
    const totalCharged = debts.reduce((sum, d) => sum + d.total_charged, 0);
    const totalOriginal = debts.reduce((sum, d) => sum + d.initial_amount, 0);

    res.json({
      total_debt: totalDebt,
      total_paid: totalPaid,
      total_charged: totalCharged,
      total_original: totalOriginal,
      debts_count: debts.length,
      debts
    });
  });
};
