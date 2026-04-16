# Sistema POS - Documentación de Funcionalidades

## 📋 Descripción General

Sistema completo de Punto de Venta (POS) desarrollado con:
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS
- **Backend:** NestJS + Prisma ORM
- **Base de Datos:** SQLite
- **Gráficos:** Recharts

---

## 🎯 Módulos Principales

### 1. 📊 MÓDULO DE VENTAS
**Ubicación:** `/app/sales` | `/src/sales`

#### Funcionalidades:
- ✅ Crear nuevas ventas en tiempo real
- ✅ Registrar múltiples métodos de pago en una misma venta
- ✅ Desglose de pagos (efectivo, tarjeta, cheque, transferencia)
- ✅ Cálculo automático de IVA según categoría
- ✅ Asociación de vendedores a las ventas
- ✅ Registrar productos con cantidad y precio
- ✅ Soporte para productos pesables (con peso en kg)
- ✅ Historial completo de ventas
- ✅ Edición y actualización de ventas
- ✅ Eliminación de ventas

#### Estadísticas de Ventas:
- Total de ventas por período
- Desglose por método de pago
- Ingresos totales
- Cantidad de transacciones
- Promedio por venta
- Gráficos visuales con Recharts

#### API Endpoints:
```
POST   /sales                    - Crear venta
GET    /sales                    - Listar todas las ventas
GET    /sales/:id                - Obtener venta por ID
GET    /sales/analytics/stats    - Estadísticas de ventas
PATCH  /sales/:id                - Actualizar venta
DELETE /sales/:id                - Eliminar venta
```

---

### 2. 👥 MÓDULO DE CLIENTES
**Ubicación:** `/app/clients` | `/src/clients`

#### Funcionalidades:
- ✅ CRUD completo de clientes
- ✅ Categorías IVA argentinas:
  - Consumidor Final
  - Responsable Inscripto
  - Monotributista
  - Exento de IVA
  - No Responsable
  - Sujeto No Identificado
- ✅ Registro de CUIT/CUIL
- ✅ Datos de contacto (email, teléfono)
- ✅ Dirección completa
- ✅ Histórico de compras
- ✅ Cuenta corriente (deuda/crédito)
- ✅ Estadísticas por cliente:
  - Total gastado
  - Cantidad de compras
  - Última compra
  - Promedio por compra
- ✅ Rank/ranking de clientes por consumo
- ✅ Búsqueda y filtrado de clientes
- ✅ Análisis de comportamiento de compra
- ✅ Sugerencias de venta inteligentes

#### Cuenta Corriente:
- Seguimiento de deuda/crédito
- Total de pagos realizados
- Total de compras realizadas
- Estado de balance

#### Registro de Pagos:
- Registrar pagos a cuenta corriente
- Tipos de pago (DEBT_PAYMENT, CREDIT, DEBIT)
- Descripción de pago
- Historial de transacciones

#### API Endpoints:
```
POST   /clients                      - Crear cliente
GET    /clients                      - Listar clientes
GET    /clients/:id                  - Obtener cliente
GET    /clients/:id/account          - Obtener cuenta corriente
GET    /clients/:id/purchase-history - Historial de compras
GET    /clients/:id/analytics        - Análisis del cliente
PUT    /clients/:id                  - Actualizar cliente
DELETE /clients/:id                  - Eliminar cliente
```

---

### 3. 📦 MÓDULO DE STOCK/PRODUCTOS
**Ubicación:** `/app/stock` | `/src/products`

#### Funcionalidades:
- ✅ Gestión completa de inventario
- ✅ CRUD de productos
- ✅ Nombre y descripción
- ✅ Precio unitario
- ✅ Productos pesables con precio por kg
- ✅ Stock disponible
- ✅ Impuesto/IVA asignable por producto
- ✅ Actualización de stock
- ✅ Búsqueda y filtrado
- ✅ Control de inventario bajo
- ✅ Alertas de stock mínimo

#### Tipos de Productos:
- Productos con precio fijo
- Productos pesables (por kilogramo)
- Productos con IVA personalizado

#### API Endpoints:
```
POST   /products          - Crear producto
GET    /products          - Listar productos
GET    /products/:id      - Obtener producto
PATCH  /products/:id      - Actualizar producto
PATCH  /products/:id/stock - Actualizar stock
DELETE /products/:id      - Eliminar producto
```

---

### 4. ⚙️ MÓDULO DE CONFIGURACIÓN
**Ubicación:** `/app/settings` | `/src/settings`

#### 4.1 Configuración de Tienda
- ✅ Nombre de la tienda
- ✅ Email y teléfono
- ✅ Dirección completa:
  - Calle y número
  - Ciudad
  - Provincia/Estado
  - Código postal
  - País (Argentina por defecto)
- ✅ CUIT del comercio
- ✅ Logo de tienda
- ✅ Tema (claro/oscuro)
- ✅ Zona horaria
- ✅ Moneda (ARS por defecto)
- ✅ Prefijo de factura
- ✅ Vendedor predefinido
- ✅ IVA predefinido

#### 4.2 Gestión de Impuestos (IVA, IIBB)
- ✅ CRUD de tasas de impuesto
- ✅ Tipos de impuesto:
  - IVA (Impuesto al Valor Agregado)
  - IIBB (Ingresos Brutos)
  - Impuestos Municipales
- ✅ Porcentaje de impuesto
- ✅ Impuestos activos/inactivos
- ✅ Múltiples tasas simultáneas

#### 4.3 Gestión de Vendedores
- ✅ CRUD de vendedores
- ✅ Nombre del vendedor
- ✅ Estado activo/inactivo
- ✅ Asignación a vendedor predefinido
- ✅ Seguimiento de ventas por vendedor

#### 4.4 Gestión de Sucursales
- ✅ CRUD de sucursales/branches
- ✅ Nombre de sucursal
- ✅ Dirección de sucursal
- ✅ Contacto de sucursal
- ✅ Gerente asignado
- ✅ Marcar sucursal principal
- ✅ Activar/desactivar sucursal

#### 4.5 Gestión de Promociones
- ✅ CRUD de promociones
- ✅ Tipos de promociones:
  - Descuento por porcentaje
  - Descuento por monto fijo
  - Compra X lleva Y
- ✅ Nombre de promoción
- ✅ Valor de descuento
- ✅ Condiciones (JSON)
- ✅ Rango de fechas de vigencia
- ✅ Activar/desactivar promociones

#### API Endpoints:
```
GET    /settings               - Obtener configuraciones
PUT    /settings               - Actualizar configuraciones

POST   /settings/taxes         - Crear impuesto
GET    /settings/taxes         - Listar impuestos
PUT    /settings/taxes/:id     - Actualizar impuesto
DELETE /settings/taxes/:id     - Eliminar impuesto

POST   /settings/sellers       - Crear vendedor
GET    /settings/sellers       - Listar vendedores
PUT    /settings/sellers/:id   - Actualizar vendedor
DELETE /settings/sellers/:id   - Eliminar vendedor

POST   /settings/branches      - Crear sucursal
GET    /settings/branches      - Listar sucursales
PUT    /settings/branches/:id  - Actualizar sucursal
DELETE /settings/branches/:id  - Eliminar sucursal

POST   /settings/promotions    - Crear promoción
GET    /settings/promotions    - Listar promociones
PUT    /settings/promotions/:id - Actualizar promoción
DELETE /settings/promotions/:id - Eliminar promoción
```

---

## 🎨 PANTALLAS DEL FRONTEND

### 1. Dashboard Principal (`/`)
- Resumen de ventas del día
- Últimas transacciones
- Atajos rápidos a módulos

### 2. Ventas (`/sales`)
- Interfaz de punto de venta
- Búsqueda y agregación de productos
- Cálculo de totales en tiempo real
- Selección de método de pago
- Desglose de múltiples pagos
- Historial de ventas
- Filtrado por fechas, cliente, vendedor
- Gráficos de estadísticas

### 3. Clientes (`/clients`)
- Listado de clientes con búsqueda
- Vista detallada de cliente
- Historial de compras
- Cuenta corriente
- Análisis de compra
- Ranking de clientes por monto
- Formulario de agregar/editar cliente
- Registro de pagos

### 4. Stock (`/stock`)
- Listado de productos
- Búsqueda de productos
- Actualización de stock
- Agregar nuevos productos
- Editar información de producto
- Eliminar productos
- Vista de inventario

### 5. Configuración (`/settings`)
- Datos de tienda
- Gestión de impuestos
- Gestión de vendedores
- Gestión de sucursales
- Gestión de promociones
- Tema y preferencias

---

## 📊 CARACTERÍSTICAS AVANZADAS

### Análisis y Reportes
- **Estadísticas de Ventas:**
  - Total de ventas por período
  - Desglose por método de pago
  - Comparativas temporales
  - Gráficos visuales

- **Análisis de Clientes:**
  - Ranking por consumo
  - Clientes inactivos
  - Factores de compra
  - Tendencias

### Cálculo de Impuestos
- Cálculo automático de IVA en ventas
- Soporte para categorías IVA argentinas
- Múltiples impuestos simultáneos
- Impuestos por producto

### Gestión de Pagos
- Múltiples métodos de pago por venta
- Desglose de pagos
- Cuenta corriente por cliente
- Historial de pagos

### Control de Inventario
- Productos pesables
- Stock por unidad
- Alertas de bajo stock
- Historial de cambios

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tablas Principales:

**Products**
```
- id (PK)
- name
- isWeighable
- pricePerKg
- price
- description
- stock
- taxId (FK)
```

**Clients**
```
- id (PK)
- name
- email
- phone
- address
- cuit
- ivaCategory
- totalSpent
- purchaseCount
- lastPurchaseDate
```

**Sales**
```
- id (PK)
- total
- clientId (FK)
- sellerName
- paymentMethod
- paymentBreakdown (JSON)
- ivaTaxId (FK)
- taxAmount
- items (1..N SaleItem)
```

**Sellers**
```
- id (PK)
- name
- active
```

**Tax**
```
- id (PK)
- name
- percentage
- type (IVA, IIBB, MUNICIPAL)
- active
```

**StoreSettings**
```
- id (PK)
- storeName
- storeEmail
- storePhone
- storeAddress
- cuit
- currency
- timezone
- theme
- defaultSellerId
- defaultIvaTaxId
```

**BranchSettings**
```
- id (PK)
- name
- address
- city
- province
- manager
- isMainBranch
- active
```

**PromotionSettings**
```
- id (PK)
- name
- type
- discountValue
- conditions (JSON)
- startDate
- endDate
- active
```

---

## 🔄 FLUJOS PRINCIPALES

### Flujo de Venta
1. Seleccionar/crear cliente (opcional)
2. Agregar productos al carrito
3. Seleccionar método(s) de pago
4. Calcular impuestos automáticamente
5. Registrar venta
6. Actualizar estadísticas del cliente
7. Reducir stock de productos
8. Generar recibo/comprobante

### Flujo de Gestión de Cliente
1. Crear nuevo cliente
2. Asignar categoría IVA
3. Registrar CUIT y datos de contacto
4. Realizar compras (vinculadas a cliente)
5. Ver historial y análisis
6. Registrar pagos en cuenta corriente

### Flujo de Gestión de Inventario
1. Agregar producto al sistema
2. Definir precio y si es pesable
3. Asignar impuesto
4. Registrar stock inicial
5. Actualizar stock con cada venta
6. Editar información del producto
7. Alertas de bajo stock

---

## 🛠️ TECNOLOGÍAS UTILIZADAS

### Frontend
- **Framework:** Next.js 16.2.1
- **UI Library:** React 19.2.4
- **Estilos:** Tailwind CSS 4
- **Gráficos:** Recharts 3.8.1
- **Lenguaje:** TypeScript 5

### Backend
- **Framework:** NestJS 10
- **ORM:** Prisma 5.7.0
- **Base de Datos:** SQLite
- **Lenguaje:** TypeScript

### Infraestructura
- **Despliegue Frontend:** Vercel
- **Testing:** Jest
- **Linting:** ESLint 9
- **Formateo:** Prettier

---

## 📱 CARACTERÍSTICAS DE INTERFAZ

### Diseño Responsivo
- ✅ Interfaz adaptable a dispositivos
- ✅ Navegación intuitiva
- ✅ Tablas y listas optimizadas
- ✅ Modales para acciones

### Componentes Reutilizables
- ✅ Tablas personalizables
- ✅ Modales de confirmación
- ✅ Formularios dinámicos
- ✅ Filtros avanzados
- ✅ Gráficos interactivos

### Validaciones
- ✅ Validación de entrada en formularios
- ✅ Confirmación de acciones críticas
- ✅ Mensajes de error/éxito
- ✅ Control de permisos

---

## 🎯 CASOS DE USO

1. **Registrar una venta:**
   - Acceder a módulo de Ventas
   - Seleccionar cliente (o crear nuevo)
   - Buscar y agregar productos
   - Especificar método(s) de pago
   - Confirmar y registrar

2. **Gestionar cuenta corriente de cliente:**
   - Acceder a Cliente
   - Ver resumen de cuenta corriente
   - Registrar pagos
   - Ver historial de deudas

3. **Actualizar inventario:**
   - Acceder a Stock
   - Buscar producto
   - Actualizar cantidad
   - Guardar cambios

4. **Configurar tienda:**
   - Ir a Configuración
   - Completar datos de tienda
   - Definir impuestos
   - Crear vendedores
   - Agregar sucursales
   - Crear promociones

---

## 📈 MÉTRICAS Y REPORTES

### Disponibles en el Sistema:
- **Ventas Totales:** Por período de tiempo
- **Métodos de Pago:** Desglose por tipo
- **Vendedores:** Ranking por ingresos
- **Clientes:** Top clientes, inactivos
- **Inventario:** Stock disponible, alertas
- **Impuestos:** Resumen de impuestos cobrados
- **Sucursales:** Ventas por sucursal

---

## 🔐 SEGURIDAD Y VALIDACIONES

- ✅ Validación de datos en backend
- ✅ Tipado fuerte con TypeScript
- ✅ Protección contra SQL injection (Prisma)
- ✅ Validación de montos
- ✅ Confirmaciones antes de eliminar

---

## 🚀 CÓMO USAR EL SISTEMA

### Inicio de Sesión y Setup
1. Acceder a la aplicación
2. Configurar datos de tienda (Settings)
3. Crear vendedores (Settings)
4. Crear impuestos (Settings)
5. Agregar productos (Stock)
6. ¡Comenzar a vender!

### Operación Diaria
1. Recepción de clientes
2. Búsqueda de productos
3. Registro de ventas
4. Gestión de pagos
5. Consulta de estadísticas

---

## 📝 NOTAS IMPORTANTES

- El sistema está optimizado para comercios argentinos (categorías IVA, CUIT, ARS)
- Todos los datos se guardan en la base de datos SQLite
- El cálculo de impuestos es automático según la configuración
- Las estadísticas se actualizan en tiempo real
- Soporta múltiples métodos de pago en una sola transacción

---

---

## 🚀 HOJA DE RUTA - SAAS REFACTOR

El sistema está siendo refactorizado para convertirse en una **plataforma SaaS production-ready**. 

### Fase 1: Arquitectura Multi-Tenant ✅
- [x] Modelo Tenant raíz
- [x] Tenant ID en todos los modelos
- [x] Indexes para optimización

### Fase 2: Autenticación & Autorización ✅
- [x] Modelo User con roles
- [x] Roles: OWNER, ADMIN, CASHIER, WAREHOUSE
- [x] Email único por tenant

### Fase 3: Modelos Relacionales ✅
- [x] SalePayment (reemplaza JSON)
- [x] StockMovement (historial de inventario)
- [x] ClientPayment mejorado

### Fase 4: Preparación para PostgreSQL ✅
- [x] IDs con cuid() (distribuido)
- [x] Migraciones Prisma
- [x] Indexes para performance

### Fase 5: Sistema de Billing ✅
- [x] Modelo Subscription
- [x] Plans: Starter, Pro, Enterprise
- [x] Stripe integration ready

### Fase 6: Por Implementar 🔄
- [ ] Auth Service (JWT, login, registro)
- [ ] Migración de datos SQLite → PostgreSQL
- [ ] Billing Service (Stripe)
- [ ] Guardias de middleware (tenantId)
- [ ] Tests unitarios e integración
- [ ] Frontend OAuth2
- [ ] Documentación API (OpenAPI/Swagger)

**Ver detalles completos en:** [SAAS_REFACTOR.md](./pos-backend/SAAS_REFACTOR.md)

---

**Versión:** 0.2.0 (SaaS Pre-Release)  
**Última actualización:** Abril 16, 2026  
**Estado:** Refactorización en progreso - Arquitectura SaaS implementada
