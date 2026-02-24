const db = require('../config/database');

// Obtener todas las cuentas de ahorro con saldo calculado
exports.getAllAccounts = (req, res) => {
  const query = `
    SELECT sa.*,
      COALESCE(sa.initial_balance, 0) + 
      COALESCE((SELECT SUM(CASE WHEN sm.type = 'ingreso' THEN sm.amount ELSE -sm.amount END) 
                FROM savings_movements sm WHERE sm.account_id = sa.id), 0) as current_balance,
      (SELECT COUNT(*) FROM savings_movements sm WHERE sm.account_id = sa.id) as total_movements,
      (SELECT MAX(sm.date) FROM savings_movements sm WHERE sm.account_id = sa.id) as last_movement_date
    FROM savings_accounts sa
    ORDER BY sa.name ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Crear cuenta de ahorro
exports.createAccount = (req, res) => {
  const { name, description, color, initial_balance, target_amount } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  db.run(
    'INSERT INTO savings_accounts (name, description, color, initial_balance, target_amount) VALUES (?, ?, ?, ?, ?)',
    [name, description || '', color || '#667eea', initial_balance || 0, target_amount || 0],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Ya existe una cuenta con ese nombre' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        description: description || '',
        color: color || '#667eea',
        initial_balance: initial_balance || 0,
        target_amount: target_amount || 0
      });
    }
  );
};

// Actualizar cuenta de ahorro
exports.updateAccount = (req, res) => {
  const { id } = req.params;
  const { name, description, color, initial_balance, target_amount } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  db.run(
    'UPDATE savings_accounts SET name = ?, description = ?, color = ?, initial_balance = ?, target_amount = ? WHERE id = ?',
    [name, description || '', color || '#667eea', initial_balance || 0, target_amount || 0, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Ya existe una cuenta con ese nombre' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Cuenta no encontrada' });
      }
      res.json({ id, name, description, color, initial_balance, target_amount });
    }
  );
};

// Eliminar cuenta de ahorro
exports.deleteAccount = (req, res) => {
  const { id } = req.params;

  // Verificar si tiene movimientos
  db.get('SELECT COUNT(*) as count FROM savings_movements WHERE account_id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar una cuenta con movimientos. Elimina los movimientos primero.' 
      });
    }

    db.run('DELETE FROM savings_accounts WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Cuenta no encontrada' });
      }
      res.json({ message: 'Cuenta eliminada exitosamente' });
    });
  });
};

// Obtener movimientos de una cuenta
exports.getMovements = (req, res) => {
  const { account_id } = req.params;

  db.all(
    `SELECT sm.*, sa.name as account_name, sa.color as account_color
     FROM savings_movements sm
     JOIN savings_accounts sa ON sm.account_id = sa.id
     WHERE sm.account_id = ?
     ORDER BY sm.date DESC, sm.created_at DESC`,
    [account_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// Crear movimiento (meter/sacar dinero)
exports.createMovement = (req, res) => {
  const { account_id, type, amount, description, date } = req.body;

  if (!account_id || !type || !amount || !date) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  if (!['ingreso', 'retiro'].includes(type)) {
    return res.status(400).json({ error: 'Tipo debe ser "ingreso" o "retiro"' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }

  // Verificar que la cuenta existe
  db.get('SELECT id FROM savings_accounts WHERE id = ?', [account_id], (err, account) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });

    db.run(
      'INSERT INTO savings_movements (account_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)',
      [account_id, type, amount, description || '', date],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
          id: this.lastID,
          account_id,
          type,
          amount,
          description: description || '',
          date
        });
      }
    );
  });
};

// Eliminar movimiento
exports.deleteMovement = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM savings_movements WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    res.json({ message: 'Movimiento eliminado exitosamente' });
  });
};

// Resumen global de ahorros
exports.getSummary = (req, res) => {
  const query = `
    SELECT 
      sa.id,
      sa.name,
      sa.color,
      sa.initial_balance,
      COALESCE(sa.target_amount, 0) as target_amount,
      COALESCE(sa.initial_balance, 0) + 
      COALESCE((SELECT SUM(CASE WHEN sm.type = 'ingreso' THEN sm.amount ELSE -sm.amount END) 
                FROM savings_movements sm WHERE sm.account_id = sa.id), 0) as current_balance,
      COALESCE((SELECT SUM(sm.amount) FROM savings_movements sm 
                WHERE sm.account_id = sa.id AND sm.type = 'ingreso'), 0) as total_deposited,
      COALESCE((SELECT SUM(sm.amount) FROM savings_movements sm 
                WHERE sm.account_id = sa.id AND sm.type = 'retiro'), 0) as total_withdrawn,
      (SELECT COUNT(*) FROM savings_movements sm WHERE sm.account_id = sa.id) as movement_count
    FROM savings_accounts sa
    ORDER BY current_balance DESC
  `;

  db.all(query, [], (err, accounts) => {
    if (err) return res.status(500).json({ error: err.message });

    const totalSaved = accounts.reduce((sum, a) => sum + a.current_balance, 0);
    const totalDeposited = accounts.reduce((sum, a) => sum + a.total_deposited, 0);
    const totalWithdrawn = accounts.reduce((sum, a) => sum + a.total_withdrawn, 0);

    res.json({
      total_saved: totalSaved,
      total_deposited: totalDeposited,
      total_withdrawn: totalWithdrawn,
      accounts_count: accounts.length,
      accounts
    });
  });
};
