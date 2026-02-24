const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || './database.sqlite';
const db = new sqlite3.Database(dbPath);

console.log('🔧 Iniciando migración de base de datos...\n');

db.serialize(() => {
  // Verificar si las columnas ya existen
  db.all("PRAGMA table_info(annual_forecasts)", [], (err, columns) => {
    if (err) {
      console.error('❌ Error al verificar columnas:', err);
      return;
    }

    const columnNames = columns.map(col => col.name);
    console.log('📋 Columnas actuales:', columnNames.join(', '));

    // Agregar columnas si no existen
    const columnsToAdd = [
      { name: 'month', type: 'INTEGER', default: null },
      { name: 'is_recurring', type: 'BOOLEAN', default: 0 },
      { name: 'forecast_type', type: "TEXT NOT NULL DEFAULT 'annual'" }
    ];

    let migrationsNeeded = [];

    columnsToAdd.forEach(col => {
      if (!columnNames.includes(col.name)) {
        migrationsNeeded.push(col);
      }
    });

    if (migrationsNeeded.length === 0) {
      console.log('✅ Todas las columnas ya existen. No se necesita migración.');
      db.close();
      return;
    }

    console.log(`\n🔄 Agregando ${migrationsNeeded.length} columna(s)...\n`);

    migrationsNeeded.forEach((col, index) => {
      const sql = `ALTER TABLE annual_forecasts ADD COLUMN ${col.name} ${col.type}`;

      db.run(sql, (err) => {
        if (err) {
          console.error(`❌ Error al agregar columna ${col.name}:`, err.message);
        } else {
          console.log(`✅ Columna "${col.name}" agregada correctamente`);
        }

        // Si es la última columna, verificar y cerrar
        if (index === migrationsNeeded.length - 1) {
          setTimeout(() => {
            db.all("PRAGMA table_info(annual_forecasts)", [], (err, newColumns) => {
              if (err) {
                console.error('❌ Error al verificar nuevas columnas:', err);
              } else {
                console.log('\n📋 Columnas después de la migración:');
                newColumns.forEach(col => {
                  console.log(`   - ${col.name} (${col.type})`);
                });
                console.log('\n✅ ¡Migración completada exitosamente!\n');
              }
              db.close();
            });
          }, 500);
        }
      });
    });
  });
});
