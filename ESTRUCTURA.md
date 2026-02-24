# 📂 Estructura del Proyecto

```
contabilidad-personal/
│
├── 📄 README.md                    # Documentación principal
├── 📄 API_EXAMPLES.md              # Ejemplos de uso de la API
├── 📄 .gitignore                   # Archivos ignorados por Git
├── 🚀 iniciar.bat                  # Script de inicio (Windows CMD)
├── 🚀 iniciar.ps1                  # Script de inicio (PowerShell)
│
├── 📁 backend/                     # Servidor backend (Node.js + Express)
│   ├── 📄 package.json             # Dependencias del backend
│   ├── 📄 .env                     # Variables de entorno
│   ├── 📄 .gitignore               # Archivos ignorados
│   ├── 📄 server.js                # Punto de entrada del servidor
│   ├── 📊 database.sqlite          # Base de datos SQLite (generado automáticamente)
│   │
│   ├── 📁 config/
│   │   └── 📄 database.js          # Configuración y conexión de la base de datos
│   │
│   ├── 📁 controllers/             # Lógica de negocio
│   │   ├── 📄 categoryController.js    # CRUD de categorías
│   │   ├── 📄 transactionController.js # CRUD de transacciones
│   │   └── 📄 statsController.js       # Estadísticas y reportes
│   │
│   └── 📁 routes/                  # Definición de rutas
│       ├── 📄 categories.js        # Rutas de categorías
│       ├── 📄 transactions.js      # Rutas de transacciones
│       └── 📄 stats.js             # Rutas de estadísticas
│
└── 📁 frontend/                    # Cliente frontend (React + Vite)
    ├── 📄 package.json             # Dependencias del frontend
    ├── 📄 .gitignore               # Archivos ignorados
    ├── 📄 vite.config.js           # Configuración de Vite
    ├── 📄 index.html               # HTML principal
    │
    └── 📁 src/
        ├── 📄 main.jsx             # Punto de entrada de React
        ├── 📄 App.jsx              # Componente principal con rutas
        ├── 🎨 index.css            # Estilos globales
        │
        ├── 📁 services/
        │   └── 📄 api.js           # Cliente Axios para la API
        │
        └── 📁 pages/               # Páginas/Vistas
            ├── 📄 Dashboard.jsx         # Vista principal con resumen
            ├── 📄 Transactions.jsx      # Gestión de transacciones
            ├── 📄 Categories.jsx        # Gestión de categorías
            ├── 📄 MonthlyReport.jsx     # Reporte mensual con gráficos
            └── 📄 AnnualReport.jsx      # Reporte anual con gráficos
```

## 🗂️ Descripción de Componentes

### Backend

#### 📄 server.js
- Servidor Express principal
- Configuración de middleware (CORS, JSON)
- Registro de rutas
- Puerto: 5000

#### 📁 config/database.js
- Conexión a SQLite
- Creación de tablas automática
- Categorías predeterminadas (12 en total)
- Esquema de base de datos

#### 📁 controllers/
**categoryController.js**
- `getAllCategories()` - Listar todas las categorías
- `getCategoryById()` - Obtener una categoría
- `createCategory()` - Crear nueva categoría
- `updateCategory()` - Actualizar categoría
- `deleteCategory()` - Eliminar categoría (con validación)

**transactionController.js**
- `getAllTransactions()` - Listar con filtros opcionales
- `getTransactionById()` - Obtener una transacción
- `createTransaction()` - Crear nueva transacción
- `updateTransaction()` - Actualizar transacción
- `deleteTransaction()` - Eliminar transacción

**statsController.js**
- `getMonthlySummary()` - Resumen del mes
- `getAnnualSummary()` - Resumen del año
- `getAvailableYears()` - Años con datos

### Frontend

#### 📄 App.jsx
- React Router configurado
- Barra de navegación
- 5 rutas principales

#### 📁 services/api.js
- Cliente Axios configurado
- Funciones para todos los endpoints
- Proxy configurado a `http://localhost:5000`

#### 📁 pages/
**Dashboard.jsx**
- Vista principal
- Resumen del mes actual
- Gráficos circulares de ingresos/gastos por categoría
- Últimas 10 transacciones

**Transactions.jsx**
- CRUD completo de transacciones
- Formulario inline
- Filtros por mes, año, tipo y categoría
- Tabla con todas las transacciones

**Categories.jsx**
- CRUD completo de categorías
- Separación visual de ingresos y gastos
- Selector de color con previsualización
- Validación de eliminación

**MonthlyReport.jsx**
- Selector de mes/año
- Resumen de ingresos, gastos y balance
- Gráficos circulares por categoría
- Tabla detallada con porcentajes

**AnnualReport.jsx**
- Selector de año
- Gráfico de barras comparativo mensual
- Gráfico de línea de evolución del balance
- Gráficos circulares de distribución anual
- Tabla mensual y por categoría

## 🎨 Características de Diseño

### Colores del Tema
- Primario: Gradiente morado/violeta (`#667eea` → `#764ba2`)
- Ingresos: Verde (`#28a745`)
- Gastos: Rojo (`#dc3545`)
- Balance: Morado (`#667eea`)

### Componentes UI
- Tarjetas con sombras
- Tablas responsive
- Formularios con validación
- Badges de categoría con colores personalizados
- Gráficos interactivos (Chart.js)
- Filtros dinámicos

### Responsive
- Diseño adaptable a móviles
- Grid flexible para gráficos
- Navegación colapsable en móvil

## 🔧 Tecnologías Utilizadas

### Backend
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| express | ^4.18.2 | Framework web |
| sqlite3 | ^5.1.6 | Base de datos |
| cors | ^2.8.5 | Cross-Origin Resource Sharing |
| dotenv | ^16.3.1 | Variables de entorno |
| nodemon | ^3.0.1 | Hot reload en desarrollo |

### Frontend
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| react | ^18.2.0 | Librería UI |
| react-dom | ^18.2.0 | Renderizado DOM |
| react-router-dom | ^6.20.0 | Enrutamiento |
| axios | ^1.6.2 | Cliente HTTP |
| chart.js | ^4.4.0 | Gráficos |
| react-chartjs-2 | ^5.2.0 | Wrapper React para Chart.js |
| date-fns | ^2.30.0 | Manipulación de fechas |
| vite | ^5.0.8 | Build tool |

## 📊 Base de Datos

### Tabla: categories
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('ingreso', 'gasto')),
  color TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Tabla: transactions
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('ingreso', 'gasto')),
  category_id INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
)
```

## 🚀 Flujo de Trabajo

1. **Usuario accede a la aplicación** → Frontend carga en puerto 3000
2. **Frontend hace petición** → Axios envía request a puerto 5000
3. **Backend procesa** → Express enruta a controller correspondiente
4. **Controller interactúa con DB** → SQLite lee/escribe datos
5. **Respuesta JSON** → Backend devuelve datos al frontend
6. **Frontend renderiza** → React actualiza la UI con los datos

## 🎯 Casos de Uso

### Caso 1: Registrar un gasto
1. Usuario va a "Transacciones"
2. Clic en "+ Nueva Transacción"
3. Completa formulario (descripción, monto, categoría, fecha)
4. Submit → POST a `/api/transactions`
5. Backend valida y guarda
6. Frontend recarga lista de transacciones

### Caso 2: Ver estadísticas mensuales
1. Usuario va a "Mensual"
2. Selecciona mes y año
3. Frontend hace GET a `/api/stats/monthly?month=X&year=Y`
4. Backend calcula totales y agrupa por categoría
5. Frontend renderiza gráficos con Chart.js

### Caso 3: Crear categoría personalizada
1. Usuario va a "Categorías"
2. Clic en "+ Nueva Categoría"
3. Ingresa nombre, selecciona tipo y elige color
4. Submit → POST a `/api/categories`
5. Backend valida unicidad del nombre
6. Frontend actualiza listas de categorías

## 🔒 Seguridad

**Nota:** Esta aplicación NO tiene autenticación. Está diseñada para uso local personal.

### Validaciones implementadas:
- ✅ Tipos de datos (ingreso/gasto)
- ✅ Montos positivos
- ✅ Campos requeridos
- ✅ Nombres únicos de categorías
- ✅ Integridad referencial (FK)
- ✅ Prevención de eliminación con dependencias

### Para uso en producción, considera agregar:
- 🔐 Autenticación (JWT, OAuth)
- 🔐 Autorización por usuario
- 🔐 HTTPS
- 🔐 Rate limiting
- 🔐 Validación de entrada más estricta
- 🔐 Sanitización de datos
- 🔐 Base de datos por usuario

## 📈 Posibles Mejoras Futuras

1. **Exportación de datos** (CSV, PDF, Excel)
2. **Presupuestos mensuales** por categoría
3. **Recordatorios** de gastos recurrentes
4. **Múltiples monedas** y conversión
5. **Adjuntar recibos** (imágenes)
6. **Comparativas** entre periodos
7. **Predicciones** con ML
8. **Modo oscuro**
9. **PWA** (Progressive Web App)
10. **Multi-usuario** con autenticación
