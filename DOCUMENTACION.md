# 📋 Documentación del Sistema POS - Gestión de Ventas

## 🎯 Descripción General
Sistema de Punto de Venta (POS) completo con gestión de inventario, registro de ventas y análisis de datos. Construido con **Next.js** (frontend) y **NestJS** (backend), con base de datos **Prisma/SQLite**.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────┐
│  Frontend (Next.js + React)             │
│  ├── POS / Inicio (Ventas)             │
│  ├── Inventario (Gestión de Productos) │
│  └── Dashboard (Análisis de Ventas)    │
└──────────────┬──────────────────────────┘
               │ HTTP/REST
┌──────────────▼──────────────────────────┐
│  Backend (NestJS)                       │
│  ├── Products Service & API             │
│  ├── Sales Service & API                │
│  └── Database (Prisma + SQLite)         │
└─────────────────────────────────────────┘
```

---

## 📱 FRONTEND - FUNCIONALIDADES

### 1. **PÁGINA PRINCIPAL - POS (Punto de Venta)** 
**Ruta:** `/`

#### Características:
- 🔍 **Buscador de Productos** - Filtra productos en tiempo real
- 📦 **Catálogo de Productos** - Muestra todos los productos disponibles
  - Productos pesables (⚖️) - Con precio por kg
  - Productos no pesables - Con cantidad fija
- 🛒 **Carrito de Compras** - Gestin en tiempo real
  - Agregar productos
  - Eliminar items
  - Editar pesos (para productos pesables)
- 💳 **Método de Pago** - Dos opciones:
  - 💵 Efectivo (CASH)
  - 🔄 Transferencia (TRANSFER)
- 💰 **Procesamiento de Venta** - Botón "Cobrar"
- 🖨️ **Impresión de Comprobante**
  - Genera comprobante con:
    - Fecha y hora
    - Método de pago
    - Listado de artículos
    - Total y cantidad
    - Abre diálogo de impresión del navegador
- ❌ **Cancelación de Venta** - Limpia el carrito

#### Flujo de Compra:
1. Cliente añade productos al carrito (clickeando en ellos)
2. Si es pesable, ingresa el peso en kg
3. Selecciona método de pago
4. Opcionalmente imprime comprobante
5. Presiona "Cobrar" para registrar la venta

---

### 2. **PÁGINA DE INVENTARIO**
**Ruta:** `/stock`

#### Características:
- 📦 **Listado de Productos**
  - Nombre del producto
  - Tipo (Pesable ⚖️ / Fijo 📦)
  - Precio ($)
  - Stock disponible
  - Acciones (Editar/Eliminar)

- 🔍 **Buscador de Productos** - Filtra la tabla en tiempo real

- ✏️ **Editar Stock de Producto**
  - Modal para ingresar nueva cantidad
  - Validación de números positivos

- ➕ **Agregar Nuevo Producto**
  - Modal con campos:
    - Nombre del producto
    - Tipo (Pesable o No Pesable)
    - Precio:
      - Si no pesable: Precio fijo
      - Si pesable: Precio por kg
    - Stock inicial
    - Descripción (opcional)

- 🗑️ **Eliminar Producto** - Con confirmación

#### Estados del Producto:
```
┌─────────────────────┬──────────────────┐
│ Tipo Pesable (⚖️)   │ Tipo Fijo (📦)   │
├─────────────────────┼──────────────────┤
│ Precio /kg          │ Precio unitario  │
│ Peso variable       │ Cantidad fija    │
│ Ej: frutas, carnes  │ Ej: bebidas, pan │
└─────────────────────┴──────────────────┘
```

---

### 3. **DASHBOARD DE ANÁLISIS**
**Ruta:** `/sales`

#### Características:
- 📊 **Estadísticas Generales**
  - Total de ventas (número)
  - Monto total vendido ($)
  - Promedio por transacción ($)

- 💳 **Desglose por Método de Pago**
  - Tabla con:
    - Método de pago
    - Monto total
    - Cantidad de transacciones
    - Porcentaje del total

- 📋 **Historial de Ventas**
  - Lista de todas las transacciones
  - Información:
    - ID de venta
    - Total
    - Método de pago
    - Fecha y hora
    - Listado de artículos vendidos

- 📈 **Visualización de Datos** - Con gráficos usando Recharts

---

## 🔧 BACKEND - API REST

### **BASE URL:** `http://localhost:3001`

---

### 📦 **ENDPOINTS DE PRODUCTOS**

#### 1. Obtener todos los productos
```
GET /products
Response:
[
  {
    "id": 1,
    "name": "Manzana",
    "isWeighable": true,
    "pricePerKg": 5.99,
    "stock": 50,
    "description": "Manzana roja fresca"
  },
  ...
]
```

#### 2. Obtener un producto específico
```
GET /products/:id
Response:
{
  "id": 1,
  "name": "Manzana",
  "isWeighable": true,
  "pricePerKg": 5.99,
  "stock": 50,
  "description": "Manzana roja fresca"
}
```

#### 3. Crear un nuevo producto
```
POST /products
Body:
{
  "name": "Naranja",
  "isWeighable": true,
  "pricePerKg": 4.50,
  "stock": 100,
  "description": "Naranja dulce"
}
```

#### 4. Actualizar un producto
```
PATCH /products/:id
Body:
{
  "name": "Naranja",
  "pricePerKg": 5.00,
  "stock": 95
}
```

#### 5. Actualizar solo el stock
```
PATCH /products/:id/stock
Body:
{
  "stock": 95
}
Response:
{
  "id": 1,
  "stock": 95,
  "message": "Stock updated successfully"
}
```

#### 6. Eliminar un producto
```
DELETE /products/:id
Response:
{
  "message": "Product deleted successfully"
}
```

---

### 💰 **ENDPOINTS DE VENTAS**

#### 1. Registrar una nueva venta
```
POST /sales
Body:
{
  "total": 125.50,
  "tenantId": 1,
  "paymentMethod": "CASH",
  "items": [
    {
      "productId": 1,
      "productName": "Manzana",
      "quantity": 1,
      "price": 12.99,
      "weight": 2.5
    }
  ]
}
Response:
{
  "id": 45,
  "total": 125.50,
  "paymentMethod": "CASH",
  "createdAt": "2026-04-09T10:30:00.000Z",
  "items": [...]
}
```

#### 2. Obtener todas las ventas
```
GET /sales
Response:
[
  {
    "id": 45,
    "total": 125.50,
    "paymentMethod": "CASH",
    "createdAt": "2026-04-09T10:30:00.000Z",
    "items": [...]
  },
  ...
]
```

#### 3. Obtener una venta específica
```
GET /sales/:id
Response:
{
  "id": 45,
  "total": 125.50,
  "paymentMethod": "CASH",
  "createdAt": "2026-04-09T10:30:00.000Z",
  "items": [...]
}
```

#### 4. Obtener estadísticas y análisis
```
GET /sales/analytics/stats
Response:
{
  "totalSales": 150,
  "totalAmount": 15250.75,
  "averageAmount": 101.67,
  "sales": [...],
  "paymentMethods": [
    {
      "method": "CASH",
      "total": 9150.45,
      "count": 90,
      "percentage": 60
    },
    {
      "method": "TRANSFER",
      "total": 6100.30,
      "count": 60,
      "percentage": 40
    }
  ]
}
```

#### 5. Actualizar una venta
```
PATCH /sales/:id
Body:
{
  "paymentMethod": "TRANSFER"
}
```

#### 6. Eliminar una venta
```
DELETE /sales/:id
```

---

## 🗄️ MODELO DE DATOS

### **Tabla: Products**
```
┌─────────────┬─────────────┬──────────────┐
│ Campo       │ Tipo        │ Descripción  │
├─────────────┼─────────────┼──────────────┤
│ id          │ Int         │ ID único     │
│ name        │ String      │ Nombre       │
│ isWeighable │ Boolean     │ Es pesable   │
│ pricePerKg  │ Float?      │ Precio/kg    │
│ price       │ Float?      │ Precio fijo  │
│ stock       │ Int         │ Stock actual │
│ description │ String?     │ Descripción  │
│ tenantId    │ Int         │ ID tenant    │
│ createdAt   │ DateTime    │ Fecha creación│
│ updatedAt   │ DateTime    │ Última modif │
└─────────────┴─────────────┴──────────────┘
```

### **Tabla: Sales**
```
┌──────────────┬─────────────┬──────────────┐
│ Campo        │ Tipo        │ Descripción  │
├──────────────┼─────────────┼──────────────┤
│ id           │ Int         │ ID único     │
│ total        │ Float       │ Monto total  │
│ paymentMethod│ String      │ CASH/TRANSFER│
│ tenantId     │ Int         │ ID tenant    │
│ createdAt    │ DateTime    │ Fecha venta  │
│ items        │ JSON        │ Artículos    │
└──────────────┴─────────────┴──────────────┘
```

### **Tabla: SalesItem (dentro de Sales)**
```
┌─────────────┬─────────────┬──────────────┐
│ Campo       │ Tipo        │ Descripción  │
├─────────────┼─────────────┼──────────────┤
│ productId   │ Int         │ ID producto  │
│ productName │ String      │ Nombre       │
│ quantity    │ Int         │ Cantidad     │
│ price       │ Float       │ Precio total │
│ weight      │ Float?      │ Peso (si aplica)│
└─────────────┴─────────────┴──────────────┘
```

---

## 🚀 INSTALACIÓN Y EJECUCIÓN

### **Fase 1: Instalación**

#### Backend:
```bash
cd pos-backend
npm install
npx prisma generate
npx prisma db push
```

#### Frontend:
```bash
cd pos-app
npm install
```

### **Fase 2: Ejecución**

#### Backend:
```bash
cd pos-backend
npm run start:dev
# Servidor en: http://localhost:3001
```

#### Frontend:
```bash
cd pos-app
npm run dev
# Aplicación en: http://localhost:3000
```

---

## 🎨 INTERFAZ DE USUARIO

### **Tecnología:**
- **Framework:** Next.js 16.2.1
- **Librerías UI:** React 19.2.4
- **Estilos:** Tailwind CSS 4
- **Gráficos:** Recharts 3.8.1
- **Lenguaje:** TypeScript 5

### **Paleta de Colores:**
- **Primario:** Azul (`bg-blue-600`)
- **Éxito:** Verde (`bg-green-500`)
- **Error:** Rojo (`bg-red-500`)
- **Advertencia:** Amarillo (`bg-yellow-600`)
- **Información:** Púrpura (`bg-purple-200`)

### **Componentes Principales:**
- ✅ Buscadores con filtrado en tiempo real
- ✅ Modales para ingreso de datos
- ✅ Tablas con información detallada
- ✅ Botones con iconos emoji
- ✅ Mensajes de confirmación
- ✅ Gráficos de análisis

---

## 🔄 FLUJOS DE PROCESO

### **Flujo 1: Realizar una Venta**
```
1. Buscador → Buscar producto
2. Catálogo → Clickear en producto
3. Si pesable:
   - Modal → Ingresar peso
   - Confirmar
4. Si no pesable:
   - Se agrega directamente
5. Carrito → Ver items
6. Seleccionar método de pago
7. (Opcional) Imprimir comprobante
8. Botón "Cobrar" → Registrar venta
9. Confirmación ✅ y carrito limpio
```

### **Flujo 2: Gestionar Inventario**
```
1. Ir a /stock
2. Ver todos los productos en tabla
3. (Opcional) Usar buscador
4. Acciones:
   a. Editar stock → Modal → Ingresar cantidad
   b. Eliminar → Confirmación → Borrar
   c. Agregar nuevo → Modal con formulario
5. Confirmación de cambios
```

### **Flujo 3: Analizar Ventas**
```
1. Ir a /sales
2. Ver estadísticas generales (total, promedio)
3. Ver desglose por método de pago
4. Ver historial de todas las ventas
5. (Opcional) Hacer click en venta para detalles
```

---

## ⚙️ CONFIGURACIÓN

### **Backend (NestJS):**
- Puerto: `3001`
- Base de datos: SQLite (local)
- ORM: Prisma

### **Frontend (Next.js):**
- Puerto: `3000`
- API Backend: `http://localhost:3001`
- Modo: Desarrollo con hot-reload

---

## 📝 PRÓXIMAS MEJORAS

- [ ] Integración con impresora térmica
- [ ] Autenticación de usuarios
- [ ] Multi-sede (múltiples locales)
- [ ] Reportes avanzados (PDF, Excel)
- [ ] Descuentos y promociones
- [ ] Devoluciones y cambios
- [ ] Caja y cuadratura diaria
- [ ] Inventario de vendedores
- [ ] Historial de cambios
- [ ] Backups automáticos

---

## 🔧 TROUBLESHOOTING

### **El backend no conecta:**
```bash
# Asegurar que está corriendo en otro terminal
cd pos-backend
npm run start:dev
```

### **Los productos no cargan:**
```bash
# Verificar base de datos
cd pos-backend
npx prisma studio  # Ver datos en interfaz
```

### **Los cambios no se reflejan:**
```bash
# Limpiar caché del navegador
# Ctrl + Shift + R (hard refresh)
# O abrir en incógnito
```

---

## 📞 SOPORTE

Para reportar problemas o sugerencias, contact con el equipo de desarrollo.

---

**Última actualización:** 09/04/2026  
**Versión del Sistema:** 0.1.0  
**Estado:** En desarrollo activo
