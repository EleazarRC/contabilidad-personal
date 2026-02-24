# 📚 Ejemplos de Uso de la API

Este documento contiene ejemplos prácticos para interactuar con la API REST de la aplicación de contabilidad.

## 🔗 Base URL
```
http://localhost:5000/api
```

## 📁 Categorías

### Obtener todas las categorías
```http
GET /api/categories
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": 1,
    "name": "Salario",
    "type": "ingreso",
    "color": "#4CAF50",
    "created_at": "2026-02-07 10:00:00"
  },
  {
    "id": 4,
    "name": "Alimentación",
    "type": "gasto",
    "color": "#F44336",
    "created_at": "2026-02-07 10:00:00"
  }
]
```

### Crear nueva categoría
```http
POST /api/categories
Content-Type: application/json

{
  "name": "Hobbies",
  "type": "gasto",
  "color": "#9C27B0"
}
```

**Respuesta exitosa (201):**
```json
{
  "id": 13,
  "name": "Hobbies",
  "type": "gasto",
  "color": "#9C27B0"
}
```

### Actualizar categoría
```http
PUT /api/categories/13
Content-Type: application/json

{
  "name": "Entretenimiento Personal",
  "type": "gasto",
  "color": "#E91E63"
}
```

### Eliminar categoría
```http
DELETE /api/categories/13
```

**Nota:** No se puede eliminar una categoría que tenga transacciones asociadas.

---

## 💰 Transacciones

### Obtener todas las transacciones
```http
GET /api/transactions
```

### Filtrar transacciones
```http
# Por mes y año
GET /api/transactions?month=2&year=2026

# Por tipo
GET /api/transactions?type=gasto

# Por categoría
GET /api/transactions?category_id=4

# Combinación de filtros
GET /api/transactions?month=2&year=2026&type=gasto&category_id=4
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": 1,
    "description": "Compra supermercado",
    "amount": 85.50,
    "type": "gasto",
    "category_id": 4,
    "date": "2026-02-05",
    "created_at": "2026-02-05 14:30:00",
    "category_name": "Alimentación",
    "category_color": "#F44336"
  }
]
```

### Crear transacción
```http
POST /api/transactions
Content-Type: application/json

{
  "description": "Salario mensual",
  "amount": 2500.00,
  "type": "ingreso",
  "category_id": 1,
  "date": "2026-02-01"
}
```

**Respuesta exitosa (201):**
```json
{
  "id": 15,
  "description": "Salario mensual",
  "amount": 2500.00,
  "type": "ingreso",
  "category_id": 1,
  "date": "2026-02-01"
}
```

### Actualizar transacción
```http
PUT /api/transactions/15
Content-Type: application/json

{
  "description": "Salario mensual (actualizado)",
  "amount": 2600.00,
  "type": "ingreso",
  "category_id": 1,
  "date": "2026-02-01"
}
```

### Eliminar transacción
```http
DELETE /api/transactions/15
```

---

## 📊 Estadísticas

### Resumen mensual
```http
GET /api/stats/monthly?month=2&year=2026
```

**Respuesta exitosa (200):**
```json
{
  "mes": 2,
  "año": 2026,
  "ingresos": 3500.00,
  "gastos": 1845.75,
  "balance": 1654.25,
  "porCategoria": [
    {
      "name": "Salario",
      "color": "#4CAF50",
      "type": "ingreso",
      "total": 2500.00
    },
    {
      "name": "Alimentación",
      "color": "#F44336",
      "type": "gasto",
      "total": 450.50
    }
  ]
}
```

### Resumen anual
```http
GET /api/stats/annual?year=2026
```

**Respuesta exitosa (200):**
```json
{
  "año": 2026,
  "ingresos": 35000.00,
  "gastos": 22450.80,
  "balance": 12549.20,
  "porMes": [
    {
      "mes": 1,
      "ingresos": 3000.00,
      "gastos": 1950.30
    },
    {
      "mes": 2,
      "ingresos": 3500.00,
      "gastos": 1845.75
    }
    // ... resto de los meses
  ],
  "porCategoria": [
    {
      "name": "Salario",
      "color": "#4CAF50",
      "type": "ingreso",
      "total": 30000.00
    }
    // ... resto de categorías
  ]
}
```

### Obtener años disponibles
```http
GET /api/stats/years
```

**Respuesta exitosa (200):**
```json
[2026, 2025, 2024]
```

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos o faltantes |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

**Ejemplo de error (400):**
```json
{
  "error": "Faltan campos requeridos"
}
```

**Ejemplo de error (404):**
```json
{
  "error": "Transacción no encontrada"
}
```

---

## 🧪 Probar la API con cURL

### Crear una categoría
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Tecnología","type":"gasto","color":"#3F51B5"}'
```

### Crear una transacción
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"description":"Compra laptop","amount":899.99,"type":"gasto","category_id":13,"date":"2026-02-07"}'
```

### Obtener resumen mensual
```bash
curl http://localhost:5000/api/stats/monthly?month=2&year=2026
```

---

## 🔧 Probar la API con Postman o Insomnia

1. Importa la colección de endpoints usando los ejemplos anteriores
2. Configura la base URL: `http://localhost:5000/api`
3. Para POST y PUT, asegúrate de incluir el header `Content-Type: application/json`
4. Los endpoints GET no requieren body, solo parámetros de query

---

## 💡 Consejos

1. **Validaciones**: La API valida automáticamente:
   - Tipos de transacción y categoría (solo 'ingreso' o 'gasto')
   - Montos positivos
   - Campos requeridos
   - Nombres únicos de categorías

2. **Relaciones**: No puedes eliminar una categoría que tenga transacciones asociadas

3. **Filtros**: Los parámetros de filtro son opcionales y se pueden combinar

4. **Fechas**: El formato de fecha debe ser `YYYY-MM-DD`

5. **Colores**: Los colores deben estar en formato hexadecimal `#RRGGBB`
