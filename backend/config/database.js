const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// En Electron, DB_DIR apunta a userData (carpeta escribible del usuario)
// En dev, usa DB_PATH o la carpeta actual
const dbDir = process.env.DB_DIR || '';
const dbPath = process.env.DB_PATH || path.join(dbDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Inicializar tablas
db.serialize(() => {
  // Tabla de categorías
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('ingreso', 'gasto')),
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de transacciones
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('ingreso', 'gasto')),
      category_id INTEGER NOT NULL,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Tabla de previsiones (mensuales y anuales)
  db.run(`
    CREATE TABLE IF NOT EXISTS annual_forecasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      reminder_date DATE NOT NULL,
      year INTEGER,
      month INTEGER,
      notes TEXT,
      completed BOOLEAN DEFAULT 0,
      is_recurring BOOLEAN DEFAULT 0,
      forecast_type TEXT NOT NULL DEFAULT 'annual' CHECK(forecast_type IN ('annual', 'monthly')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Insertar categorías predeterminadas si no existen
  const defaultCategories = [
    { name: 'Salario', type: 'ingreso', color: '#4CAF50' },
    { name: 'Inversiones', type: 'ingreso', color: '#8BC34A' },
    { name: 'Otros Ingresos', type: 'ingreso', color: '#CDDC39' },
    { name: 'Alimentación', type: 'gasto', color: '#F44336' },
    { name: 'Transporte', type: 'gasto', color: '#E91E63' },
    { name: 'Vivienda', type: 'gasto', color: '#9C27B0' },
    { name: 'Servicios', type: 'gasto', color: '#673AB7' },
    { name: 'Entretenimiento', type: 'gasto', color: '#3F51B5' },
    { name: 'Salud', type: 'gasto', color: '#2196F3' },
    { name: 'Educación', type: 'gasto', color: '#03A9F4' },
    { name: 'Ropa', type: 'gasto', color: '#00BCD4' },
    { name: 'Otros Gastos', type: 'gasto', color: '#009688' }
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO categories (name, type, color) VALUES (?, ?, ?)');
  defaultCategories.forEach(cat => {
    stmt.run(cat.name, cat.type, cat.color);
  });

  // Tabla de cuentas de ahorro
  db.run(`
    CREATE TABLE IF NOT EXISTS savings_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT NOT NULL DEFAULT '#667eea',
      initial_balance REAL NOT NULL DEFAULT 0,
      target_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migración: añadir target_amount si no existe
  db.run(`ALTER TABLE savings_accounts ADD COLUMN target_amount REAL DEFAULT 0`, (err) => {
    // Ignorar error si columna ya existe
  });

  // Tabla de movimientos de ahorro
  db.run(`
    CREATE TABLE IF NOT EXISTS savings_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('ingreso', 'retiro')),
      amount REAL NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES savings_accounts(id)
    )
  `);

  // Tabla de deudas (tarjetas, préstamos, hipotecas)
  db.run(`
    CREATE TABLE IF NOT EXISTS debt_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('tarjeta', 'prestamo', 'hipoteca', 'otro')),
      description TEXT,
      color TEXT NOT NULL DEFAULT '#dc3545',
      initial_amount REAL NOT NULL DEFAULT 0,
      interest_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de pagos de deudas
  db.run(`
    CREATE TABLE IF NOT EXISTS debt_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debt_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('pago', 'cargo')),
      amount REAL NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (debt_id) REFERENCES debt_accounts(id)
    )
  `);

  // Tabla de presupuestos
  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL DEFAULT 0,
      color TEXT NOT NULL DEFAULT '#667eea',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de categorías asignadas a presupuestos
  db.run(`
    CREATE TABLE IF NOT EXISTS budget_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      FOREIGN KEY (budget_id) REFERENCES budgets(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      UNIQUE(budget_id, category_id)
    )
  `);

  stmt.finalize();
});

module.exports = db;
