# 🚀 Guía de Inicio Rápido

## ⚡ Instalación y Ejecución en 3 Pasos

### Windows (Recomendado)

**1️⃣ Doble clic en `iniciar.bat`**
   - Se abrirán 2 ventanas de terminal
   - El backend se iniciará en puerto 5000
   - El frontend se iniciará en puerto 3000

**2️⃣ Espera 5-10 segundos**
   - Las dependencias se instalarán automáticamente la primera vez

**3️⃣ Abre tu navegador**
   - Ve a: `http://localhost:3000`
   - ¡Listo! Ya puedes usar la aplicación

---

## 🎯 Primeros Pasos

### 1. Dashboard (Página de Inicio)
- Verás un resumen del mes actual
- Inicialmente estará vacío
- Ve a "Transacciones" para comenzar

### 2. Crear tu Primera Transacción
- Click en "Transacciones" (menú superior)
- Click en "+ Nueva Transacción"
- Completa el formulario:
  - **Tipo**: Gasto o Ingreso
  - **Fecha**: Hoy por defecto
  - **Descripción**: Ej: "Compra supermercado"
  - **Monto**: Ej: 85.50
  - **Categoría**: Selecciona una predeterminada
- Click en "Crear"

### 3. Ver Estadísticas
- Ve a "Mensual" o "Anual"
- Verás gráficos automáticamente
- Cambia mes/año con los selectores

### 4. Personalizar Categorías (Opcional)
- Ve a "Categorías"
- Click en "+ Nueva Categoría"
- Ingresa nombre, tipo y color
- Las nuevas categorías aparecen en los formularios

---

## 📝 Casos de Uso Comunes

### Registrar Gastos Diarios
```
1. Dashboard → Transacciones
2. + Nueva Transacción
3. Tipo: Gasto
4. Descripción: "Almuerzo"
5. Monto: 12.50
6. Categoría: Alimentación
7. Crear
```

### Registrar Salario Mensual
```
1. Transacciones → + Nueva Transacción
2. Tipo: Ingreso
3. Descripción: "Salario Febrero"
4. Monto: 2500
5. Categoría: Salario
6. Fecha: 01/02/2026
7. Crear
```

### Ver Balance del Mes
```
1. Dashboard (ya muestra el mes actual)
   - O ve a "Mensual" para más detalles
2. Verás:
   - Total ingresos
   - Total gastos
   - Balance (ingresos - gastos)
```

### Analizar Gastos Anuales
```
1. Ve a "Anual"
2. Selecciona el año
3. Revisa:
   - Gráfico de barras (comparación mensual)
   - Gráfico de línea (evolución del balance)
   - Gráficos circulares (distribución)
```

---

## 🔍 Filtros Útiles

### Ver Solo Gastos de un Mes
```
Transacciones → Filtros:
- Mes: Febrero
- Año: 2026
- Tipo: Gastos
- Categoría: Todas
```

### Ver Solo Ingresos del Año
```
Transacciones → Filtros:
- Mes: Todos
- Año: 2026
- Tipo: Ingresos
- Categoría: Todas
```

### Ver Gastos de Alimentación
```
Transacciones → Filtros:
- Mes: Febrero
- Año: 2026
- Tipo: Gastos
- Categoría: Alimentación
```

---

## 🎨 Personalizar Categorías

### Crear Categoría de Gasto
```
1. Categorías → + Nueva Categoría
2. Nombre: "Mascotas"
3. Tipo: Gasto
4. Color: Click en selector y elige un color
5. Crear
```

### Editar Categoría Existente
```
1. Categorías → Busca la categoría
2. Click en "Editar"
3. Modifica nombre, tipo o color
4. Click en "Actualizar"
```

### Eliminar Categoría
```
1. Categorías → Busca la categoría
2. Click en "Eliminar"
3. Confirma en el popup
4. Nota: No se puede eliminar si tiene transacciones
```

---

## 📊 Entender los Gráficos

### Dashboard - Gráficos Circulares
- **¿Qué muestran?** Distribución de ingresos/gastos por categoría
- **Período:** Solo el mes actual
- **Hover:** Muestra monto y porcentaje

### Mensual - Gráficos de Distribución
- **¿Qué muestran?** Igual que Dashboard pero para el mes seleccionado
- **Utilidad:** Comparar meses anteriores

### Anual - Gráfico de Barras
- **¿Qué muestra?** Comparación ingresos vs gastos por mes
- **Verde:** Ingresos de cada mes
- **Rojo:** Gastos de cada mes
- **Utilidad:** Ver tendencias anuales

### Anual - Gráfico de Línea
- **¿Qué muestra?** Evolución del balance mensual
- **Hacia arriba:** Meses con balance positivo
- **Hacia abajo:** Meses con balance negativo
- **Utilidad:** Visualizar salud financiera

### Anual - Gráficos Circulares
- **¿Qué muestran?** Distribución total del año
- **Utilidad:** Ver en qué se gasta más durante el año

---

## ⚙️ Solución de Problemas

### ❌ No se inicia el backend
**Síntomas:** Error en ventana del backend
**Solución:**
```powershell
cd backend
npm install
npm start
```

### ❌ No se inicia el frontend
**Síntomas:** Error en ventana del frontend
**Solución:**
```powershell
cd frontend
npm install
npm run dev
```

### ❌ La página no carga
**Verifica:**
1. Backend corriendo en http://localhost:5000
2. Frontend corriendo en http://localhost:3000
3. Abre http://localhost:3000 en el navegador

### ❌ No se pueden crear transacciones
**Verifica:**
1. Todos los campos están completos
2. El monto es un número positivo
3. La fecha tiene formato correcto
4. Revisa la consola del navegador (F12)

### ❌ Error al eliminar categoría
**Motivo:** La categoría tiene transacciones asociadas
**Solución:**
1. Ve a Transacciones
2. Filtra por esa categoría
3. Elimina todas las transacciones de esa categoría
4. Intenta eliminar la categoría nuevamente

### ❌ Los gráficos no se muestran
**Posibles causas:**
1. No hay transacciones para ese período
2. JavaScript está deshabilitado
3. Error en la consola (F12 para ver)

---

## 🗄️ Gestión de Datos

### ¿Dónde se guardan mis datos?
- Archivo: `backend/database.sqlite`
- Se crea automáticamente al iniciar
- Es un archivo local en tu computadora

### Hacer backup de datos
```powershell
# Copia el archivo database.sqlite a un lugar seguro
copy backend\database.sqlite backup\database-2026-02-07.sqlite
```

### Restaurar backup
```powershell
# Detén los servidores
# Reemplaza el archivo
copy backup\database-2026-02-07.sqlite backend\database.sqlite
# Inicia los servidores nuevamente
```

### Resetear la aplicación (borrar todo)
```powershell
# Detén los servidores
# Elimina la base de datos
del backend\database.sqlite
# Inicia los servidores
# Se creará una base de datos nueva con categorías predeterminadas
```

---

## 🎓 Consejos de Uso

### 📌 Mejores Prácticas

1. **Registra gastos diariamente**
   - Más fácil que hacerlo semanalmente
   - Menos olvidos

2. **Usa descripciones claras**
   - Mal: "Compra"
   - Bien: "Compra supermercado Carrefour"

3. **Revisa el balance semanalmente**
   - Ve al Dashboard cada semana
   - Identifica gastos excesivos temprano

4. **Analiza tendencias mensualmente**
   - Ve a "Mensual" al fin de mes
   - Compara con meses anteriores

5. **Planifica con reportes anuales**
   - Ve a "Anual" cada trimestre
   - Ajusta hábitos según los datos

### 🎯 Flujo de Trabajo Recomendado

**Diario (2 minutos):**
- Registra gastos del día
- Revisa balance en Dashboard

**Semanal (5 minutos):**
- Revisa todas las transacciones de la semana
- Asegúrate de no olvidar ninguna

**Mensual (15 minutos):**
- Ve a "Mensual"
- Analiza categorías con más gastos
- Identifica áreas de mejora

**Trimestral (30 minutos):**
- Ve a "Anual"
- Revisa tendencias de los últimos 3 meses
- Ajusta presupuesto mental

---

## 📞 Soporte

### Archivos de Ayuda
- `README.md` - Documentación completa
- `API_EXAMPLES.md` - Ejemplos de la API
- `ESTRUCTURA.md` - Arquitectura del proyecto
- `GUIA_VISUAL.md` - Guía visual de la interfaz
- `INICIO_RAPIDO.md` - Este archivo

### Recursos Adicionales
- Node.js: https://nodejs.org/
- React: https://react.dev/
- Chart.js: https://www.chartjs.org/

---

## ✅ Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] Node.js está instalado (`node --version`)
- [ ] Las dependencias están instaladas (carpetas `node_modules`)
- [ ] El backend está corriendo (puerto 5000)
- [ ] El frontend está corriendo (puerto 3000)
- [ ] No hay otros programas usando los puertos 3000 o 5000
- [ ] El navegador permite JavaScript
- [ ] La consola del navegador no muestra errores (F12)

---

## 🎉 ¡Listo para Empezar!

1. Ejecuta `iniciar.bat`
2. Abre http://localhost:3000
3. Crea tu primera transacción
4. Explora las diferentes secciones
5. ¡Disfruta de tu nueva aplicación de contabilidad!

---

**Última actualización:** Febrero 2026
**Versión:** 1.0.0
