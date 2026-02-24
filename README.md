# 💰 Aplicación de Contabilidad Personal

Aplicación full-stack para gestionar finanzas personales con reportes mensuales y anuales, categorías personalizables y gráficos estadísticos.

## 📚 Documentación

- **[INDICE.md](INDICE.md)** - 📖 Índice completo de toda la documentación
- **[RESUMEN.md](RESUMEN.md)** - 📋 Resumen ejecutivo del proyecto
- **[INICIO_RAPIDO.md](INICIO_RAPIDO.md)** - 🚀 Guía de inicio rápido (¡Empieza aquí!)
- **[GUIA_VISUAL.md](GUIA_VISUAL.md)** - 🎨 Guía visual de la interfaz
- **[API_EXAMPLES.md](API_EXAMPLES.md)** - 📡 Ejemplos de uso de la API
- **[ESTRUCTURA.md](ESTRUCTURA.md)** - 🏗️ Arquitectura detallada del proyecto
- **[DATOS_PRUEBA.md](DATOS_PRUEBA.md)** - 🧪 Datos de ejemplo para probar la aplicación

## 🚀 Características

- ✅ Registro de ingresos y gastos
- ✅ Categorías personalizables con colores
- ✅ Dashboard con resumen del mes actual
- ✅ Reportes mensuales y anuales
- ✅ Gráficos estadísticos (pie charts, barras, líneas)
- ✅ Filtros por mes, año, tipo y categoría
- ✅ Sin sistema de autenticación
- ✅ Base de datos SQLite local

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- SQLite3
- CORS

### Frontend
- React 18
- Vite
- React Router DOM
- Chart.js + React-Chartjs-2
- Axios
- Date-fns

## 📋 Requisitos Previos

- Node.js 16+ instalado
- npm o yarn

## 🔧 Instalación

### 1. Instalar dependencias del Backend

```powershell
cd backend
npm install
```

### 2. Instalar dependencias del Frontend

```powershell
cd frontend
npm install
```

## ▶️ Ejecución

### Opción 1: Inicio Rápido (Recomendado para Windows)

**Método 1 - Usando archivo .bat:**
```powershell
.\iniciar.bat
```

**Método 2 - Usando PowerShell:**
```powershell
.\iniciar.ps1
```

Estos scripts instalarán automáticamente las dependencias (si es necesario) e iniciarán ambos servidores en ventanas separadas.

### Opción 2: Ejecutar Backend y Frontend por separado

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
```
El backend estará corriendo en `http://localhost:5000`

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```
El frontend estará corriendo en `http://localhost:3000`

### Opción 2: Ejecutar con nodemon (desarrollo)

**Backend:**
```powershell
cd backend
npm run dev
```

## 📱 Uso de la Aplicación

1. **Dashboard**: Vista general con el resumen del mes actual y transacciones recientes
2. **Transacciones**: Crear, editar, eliminar y filtrar transacciones
3. **Categorías**: Gestionar categorías de ingresos y gastos con colores personalizados
4. **Mensual**: Reportes detallados por mes con gráficos de distribución
5. **Anual**: Reportes anuales con evolución mensual y gráficos comparativos

## 📊 API Endpoints

### Categorías
- `GET /api/categories` - Obtener todas las categorías
- `GET /api/categories/:id` - Obtener categoría por ID
- `POST /api/categories` - Crear nueva categoría
- `PUT /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría

### Transacciones
- `GET /api/transactions` - Obtener transacciones (con filtros opcionales)
- `GET /api/transactions/:id` - Obtener transacción por ID
- `POST /api/transactions` - Crear nueva transacción
- `PUT /api/transactions/:id` - Actualizar transacción
- `DELETE /api/transactions/:id` - Eliminar transacción

### Estadísticas
- `GET /api/stats/monthly?month=X&year=Y` - Resumen mensual
- `GET /api/stats/annual?year=Y` - Resumen anual
- `GET /api/stats/years` - Años disponibles

## 🗄️ Base de Datos

La base de datos SQLite se crea automáticamente en `backend/database.sqlite` al iniciar el servidor por primera vez. Incluye categorías predeterminadas.

### Esquema

**categories**
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- type (TEXT: 'ingreso' | 'gasto')
- color (TEXT)
- created_at (DATETIME)

**transactions**
- id (INTEGER PRIMARY KEY)
- description (TEXT)
- amount (REAL)
- type (TEXT: 'ingreso' | 'gasto')
- category_id (INTEGER)
- date (DATE)
- created_at (DATETIME)

## 🎨 Personalización

### Formato de Moneda
Por defecto usa EUR (€). Para cambiar, edita la función `formatCurrency` en los componentes del frontend.

### Colores del Tema
Los colores principales están definidos en `frontend/src/index.css`. El tema usa un gradiente morado/violeta.

## 📝 Notas

- La aplicación no tiene sistema de autenticación, todos los datos son accesibles
- Los datos se almacenan localmente en SQLite
- No hay límite de transacciones o categorías
- Las categorías con transacciones asociadas no se pueden eliminar

## 🤝 Contribuir

Esta es una aplicación de ejemplo para uso personal. Siéntete libre de modificarla según tus necesidades.

## 📄 Licencia

ISC
