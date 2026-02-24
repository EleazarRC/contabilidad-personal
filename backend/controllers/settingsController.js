const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// Borrar todos los datos
exports.deleteAllData = (req, res) => {
  const { confirm } = req.body;

  if (confirm !== 'DELETE_ALL_DATA') {
    return res.status(400).json({ error: 'Confirmación incorrecta' });
  }

  db.serialize(() => {
    // Borrar pagos de deudas (primero por foreign key)
    db.run('DELETE FROM debt_payments', (err) => {
      if (err) return res.status(500).json({ error: 'Error al borrar pagos de deudas: ' + err.message });

      // Borrar cuentas de deuda
      db.run('DELETE FROM debt_accounts', (err) => {
        if (err) return res.status(500).json({ error: 'Error al borrar deudas: ' + err.message });

        // Borrar movimientos de ahorro (primero por foreign key)
        db.run('DELETE FROM savings_movements', (err) => {
          if (err) return res.status(500).json({ error: 'Error al borrar movimientos de ahorro: ' + err.message });

          // Borrar cuentas de ahorro
          db.run('DELETE FROM savings_accounts', (err) => {
            if (err) return res.status(500).json({ error: 'Error al borrar cuentas de ahorro: ' + err.message });

            // Borrar transacciones
            db.run('DELETE FROM transactions', (err) => {
              if (err) return res.status(500).json({ error: 'Error al borrar transacciones: ' + err.message });

              // Borrar previsiones
              db.run('DELETE FROM annual_forecasts', (err) => {
                if (err) return res.status(500).json({ error: 'Error al borrar previsiones: ' + err.message });

                // Borrar categorías custom (mantener predeterminadas)
                db.run("DELETE FROM categories WHERE name NOT IN ('Salario', 'Inversiones', 'Otros Ingresos', 'Alimentación', 'Transporte', 'Vivienda', 'Servicios', 'Entretenimiento', 'Salud', 'Educación', 'Ropa', 'Otros Gastos')", (err) => {
                  if (err) return res.status(500).json({ error: 'Error al borrar categorías: ' + err.message });

                  // Reiniciar contadores
                  const tables = ['transactions', 'annual_forecasts', 'savings_accounts', 'savings_movements', 'debt_accounts', 'debt_payments'];
                  tables.forEach(table => {
                    db.run(`DELETE FROM sqlite_sequence WHERE name='${table}'`, (err) => {
                      if (err) console.error(`Error al reiniciar contador ${table}:`, err);
                    });
                  });

                  res.json({
                    message: 'Todos los datos han sido eliminados correctamente',
                    deleted: {
                      transactions: true,
                      forecasts: true,
                      customCategories: true,
                      savingsAccounts: true,
                      savingsMovements: true,
                      debtAccounts: true,
                      debtPayments: true
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

// Obtener estadísticas de datos
exports.getDataStats = (req, res) => {
  db.serialize(() => {
    const stats = {};

    db.get('SELECT COUNT(*) as count FROM transactions', [], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.transactions = result.count;

      db.get('SELECT COUNT(*) as count FROM annual_forecasts', [], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.forecasts = result.count;

        db.get('SELECT COUNT(*) as count FROM categories', [], (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.categories = result.count;

          db.get('SELECT COUNT(*) as count FROM savings_accounts', [], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.savingsAccounts = result.count;

            db.get('SELECT COUNT(*) as count FROM debt_accounts', [], (err, result) => {
              if (err) return res.status(500).json({ error: err.message });
              stats.debtAccounts = result.count;

              res.json(stats);
            });
          });
        });
      });
    });
  });
};

// Descargar backup de la base de datos
exports.backupDatabase = (req, res) => {
  const dbPath = process.env.DB_PATH || './database.sqlite';
  const absolutePath = path.resolve(dbPath);

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: 'Base de datos no encontrada' });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `contabilidad-backup-${timestamp}.sqlite`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');

  const fileStream = fs.createReadStream(absolutePath);
  fileStream.pipe(res);
};
