const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || './database.sqlite';
const db = new sqlite3.Database(dbPath);

console.log('🔧 Iniciando migración para permitir year = NULL...\n');

db.serialize(() => {
  // SQLite no permite modificar columnas directamente
  // Necesitamos recrear la tabla

  console.log('📋 Paso 1: Obteniendo datos actuales...');

  db.all('SELECT * FROM annual_forecasts', [], (err, rows) => {
    if (err) {
      console.error('❌ Error al leer datos:', err);
      db.close();
      return;
    }

    console.log(`✅ ${rows.length} registros encontrados\n`);
    console.log('📋 Paso 2: Creando tabla temporal...');

    // Crear tabla temporal con year nullable
    db.run(`
      CREATE TABLE annual_forecasts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category_id INTEGER NOT NULL,
        reminder_date DATE NOT NULL,
        year INTEGER,
        notes TEXT,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        month INTEGER,
        is_recurring BOOLEAN DEFAULT 0,
        forecast_type TEXT NOT NULL DEFAULT 'annual' CHECK(forecast_type IN ('annual', 'monthly')),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error al crear tabla temporal:', err);
        db.close();
        return;
      }

      console.log('✅ Tabla temporal creada\n');
      console.log('📋 Paso 3: Copiando datos a tabla temporal...');

      // Copiar datos
      db.run(`
        INSERT INTO annual_forecasts_new 
        SELECT * FROM annual_forecasts
      `, (err) => {
        if (err) {
          console.error('❌ Error al copiar datos:', err);
          db.close();
          return;
        }

        console.log('✅ Datos copiados\n');
        console.log('📋 Paso 4: Eliminando tabla antigua...');

        // Eliminar tabla antigua
        db.run('DROP TABLE annual_forecasts', (err) => {
          if (err) {
            console.error('❌ Error al eliminar tabla antigua:', err);
            db.close();
            return;
          }

          console.log('✅ Tabla antigua eliminada\n');
          console.log('📋 Paso 5: Renombrando tabla temporal...');

          // Renombrar tabla temporal
          db.run('ALTER TABLE annual_forecasts_new RENAME TO annual_forecasts', (err) => {
            if (err) {
              console.error('❌ Error al renombrar tabla:', err);
              db.close();
              return;
            }

            console.log('✅ Tabla renombrada\n');
            console.log('🔍 Verificando estructura...\n');

            // Verificar nueva estructura
            db.all("PRAGMA table_info(annual_forecasts)", [], (err, columns) => {
              if (err) {
                console.error('❌ Error al verificar:', err);
              } else {
                console.log('📋 Columnas de la tabla annual_forecasts:');
                columns.forEach(col => {
                  const nullable = col.notnull === 0 ? '✅ NULLABLE' : '❌ NOT NULL';
                  console.log(`   - ${col.name} (${col.type}) ${nullable}`);
                });

                const yearCol = columns.find(c => c.name === 'year');
                if (yearCol && yearCol.notnull === 0) {
                  console.log('\n✅ ¡Éxito! La columna "year" ahora permite valores NULL');
                } else {
                  console.log('\n⚠️  Advertencia: La columna "year" todavía tiene restricción NOT NULL');
                }
              }

              // Verificar datos
              db.get('SELECT COUNT(*) as count FROM annual_forecasts', [], (err, result) => {
                if (err) {
                  console.error('❌ Error al contar registros:', err);
                } else {
                  console.log(`\n📊 Total de registros después de migración: ${result.count}`);
                }

                console.log('\n✅ ¡Migración completada exitosamente!\n');
                db.close();
              });
            });
          });
        });
      });
    });
  });
});
