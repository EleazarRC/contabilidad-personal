const db = require('../config/database');

// Obtener todos los presupuestos con sus categorías
exports.getAllBudgets = (req, res) => {
  db.all('SELECT * FROM budgets ORDER BY name ASC', [], (err, budgets) => {
    if (err) return res.status(500).json({ error: err.message });

    if (budgets.length === 0) return res.json([]);

    let completed = 0;
    budgets.forEach((budget, i) => {
      db.all(
        `SELECT c.id, c.name, c.color FROM budget_categories bc
         JOIN categories c ON bc.category_id = c.id
         WHERE bc.budget_id = ?`,
        [budget.id],
        (err, categories) => {
          if (err) return res.status(500).json({ error: err.message });
          budgets[i].categories = categories || [];
          completed++;
          if (completed === budgets.length) {
            res.json(budgets);
          }
        }
      );
    });
  });
};

// Crear presupuesto
exports.createBudget = (req, res) => {
  const { name, amount, color, category_ids } = req.body;

  if (!name || amount === undefined) {
    return res.status(400).json({ error: 'Nombre y monto son requeridos' });
  }

  db.run(
    'INSERT INTO budgets (name, amount, color) VALUES (?, ?, ?)',
    [name, amount, color || '#667eea'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Ya existe un presupuesto con ese nombre' });
        }
        return res.status(500).json({ error: err.message });
      }

      const budgetId = this.lastID;

      // Asignar categorías
      if (category_ids && category_ids.length > 0) {
        const stmt = db.prepare('INSERT OR IGNORE INTO budget_categories (budget_id, category_id) VALUES (?, ?)');
        category_ids.forEach(catId => stmt.run(budgetId, catId));
        stmt.finalize();
      }

      res.status(201).json({ id: budgetId, name, amount, color, category_ids });
    }
  );
};

// Actualizar presupuesto
exports.updateBudget = (req, res) => {
  const { id } = req.params;
  const { name, amount, color, category_ids } = req.body;

  if (!name || amount === undefined) {
    return res.status(400).json({ error: 'Nombre y monto son requeridos' });
  }

  db.run(
    'UPDATE budgets SET name = ?, amount = ?, color = ? WHERE id = ?',
    [name, amount, color || '#667eea', id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Ya existe un presupuesto con ese nombre' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) return res.status(404).json({ error: 'Presupuesto no encontrado' });

      // Reemplazar categorías
      db.run('DELETE FROM budget_categories WHERE budget_id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        if (category_ids && category_ids.length > 0) {
          const stmt = db.prepare('INSERT OR IGNORE INTO budget_categories (budget_id, category_id) VALUES (?, ?)');
          category_ids.forEach(catId => stmt.run(id, catId));
          stmt.finalize();
        }

        res.json({ id, name, amount, color, category_ids });
      });
    }
  );
};

// Eliminar presupuesto
exports.deleteBudget = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM budget_categories WHERE budget_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.run('DELETE FROM budgets WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Presupuesto no encontrado' });
      res.json({ message: 'Presupuesto eliminado' });
    });
  });
};

// Resultado mensual de presupuestos
exports.getMonthlyResults = (req, res) => {
  const { month, year } = req.query;
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year) || new Date().getFullYear();

  // Rango de fechas del mes
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = m === 12
    ? `${y + 1}-01-01`
    : `${y}-${String(m + 1).padStart(2, '0')}-01`;

  db.all('SELECT * FROM budgets ORDER BY name ASC', [], (err, budgets) => {
    if (err) return res.status(500).json({ error: err.message });
    if (budgets.length === 0) return res.json([]);

    let completed = 0;
    const results = [];

    budgets.forEach((budget) => {
      // Obtener categorías del presupuesto
      db.all(
        `SELECT c.id, c.name, c.color FROM budget_categories bc
         JOIN categories c ON bc.category_id = c.id
         WHERE bc.budget_id = ?`,
        [budget.id],
        (err, categories) => {
          if (err) return res.status(500).json({ error: err.message });

          if (!categories || categories.length === 0) {
            results.push({
              ...budget,
              categories: [],
              spent: 0,
              remaining: budget.amount,
              percentage: 0
            });
            completed++;
            if (completed === budgets.length) res.json(results);
            return;
          }

          const catIds = categories.map(c => c.id);
          const placeholders = catIds.map(() => '?').join(',');

          // Sumar gastos de esas categorías en el mes
          db.get(
            `SELECT COALESCE(SUM(amount), 0) as total_spent
             FROM transactions
             WHERE type = 'gasto'
               AND category_id IN (${placeholders})
               AND date >= ? AND date < ?`,
            [...catIds, startDate, endDate],
            (err, row) => {
              if (err) return res.status(500).json({ error: err.message });

              const spent = row.total_spent;
              const remaining = budget.amount - spent;
              const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

              results.push({
                ...budget,
                categories,
                spent,
                remaining,
                percentage
              });

              completed++;
              if (completed === budgets.length) {
                // Ordenar por nombre para consistencia
                results.sort((a, b) => a.name.localeCompare(b.name));
                res.json(results);
              }
            }
          );
        }
      );
    });
  });
};
