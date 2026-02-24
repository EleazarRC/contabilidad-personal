const db = require('../config/database');

// Obtener todas las categorías
exports.getAllCategories = (req, res) => {
  db.all('SELECT * FROM categories ORDER BY type, name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

// Obtener categoría por ID
exports.getCategoryById = (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM categories WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json(row);
  });
};

// Crear nueva categoría
exports.createCategory = (req, res) => {
  const { name, type, color } = req.body;

  if (!name || !type || !color) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  if (!['ingreso', 'gasto'].includes(type)) {
    return res.status(400).json({ error: 'Tipo debe ser "ingreso" o "gasto"' });
  }

  db.run(
    'INSERT INTO categories (name, type, color) VALUES (?, ?, ?)',
    [name, type, color],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, name, type, color });
    }
  );
};

// Actualizar categoría
exports.updateCategory = (req, res) => {
  const { id } = req.params;
  const { name, type, color } = req.body;

  if (!name || !type || !color) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  if (!['ingreso', 'gasto'].includes(type)) {
    return res.status(400).json({ error: 'Tipo debe ser "ingreso" o "gasto"' });
  }

  db.run(
    'UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ?',
    [name, type, color, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
        }
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      res.json({ id, name, type, color });
    }
  );
};

// Eliminar categoría
exports.deleteCategory = (req, res) => {
  const { id } = req.params;

  // Verificar si hay transacciones asociadas
  db.get('SELECT COUNT(*) as count FROM transactions WHERE category_id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row.count > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la categoría porque tiene transacciones asociadas'
      });
    }

    db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      res.json({ message: 'Categoría eliminada exitosamente' });
    });
  });
};
