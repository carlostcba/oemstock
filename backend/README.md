# OemStock - Backend

## 1. Visión General y Objetivos
Este es el servidor backend para la aplicación OemStock. El objetivo es desarrollar una aplicación web para gestionar el inventario de Elementos Base (EL), Kits y Productos a través de múltiples sitios o sucursales. El sistema debe ofrecer una trazabilidad completa de cada movimiento, un control de acceso robusto basado en roles y la capacidad de gestionar el ciclo de vida de la producción.

## 2. Glosario de Conceptos Clave
- **Elemento Base (EL):** Unidad mínima de stock (ej: tornillo).
- **Kit (Plantilla):** "Receta" que define los componentes de un kit. No tiene stock por sí misma.
- **Producto (Plantilla):** Agrupación de Kits y/o Elementos Base que componen un producto final.
- **Sitios:** Sucursales físicas donde se almacena el stock.
- **BOM (Bill of Materials):** Lista de materiales o "receta" que compone un Kit o Producto.

## 3. Arquitectura y Tecnologías
- **Framework:** Node.js con Express y TypeScript.
- **ORM:** Sequelize para la interacción con la base de datos y la gestión de transacciones.
- **Base de Datos:** Configurado para usar SQLite en desarrollo y MySQL en producción.
- **Autenticación:** Basada en JSON Web Tokens (JWT).

## 4. Lógica de Negocio Principal

La robustez del sistema se basa en una serie de lógicas de negocio implementadas en el backend para garantizar la integridad y trazabilidad de los datos.

### a. Transacciones de Base de Datos

Casi todas las operaciones que implican múltiples pasos o afectan al inventario están envueltas en **transacciones de Sequelize**. Esto garantiza la atomicidad de las operaciones críticas:

- **Creación de Ensamblaje**: La verificación de stock de componentes y la creación de la reserva de cada uno de ellos se ejecutan dentro de una única transacción. Si un solo componente no tiene stock suficiente, la transacción completa se revierte (`ROLLBACK`), y no se crea ni la orden ni ninguna reserva parcial.
- **Finalización de Ensamblaje**: El consumo de los componentes reservados y el incremento de stock del producto final se realizan en una transacción. Si algo falla, el estado del inventario no cambia.
- **Cancelación de Ensamblaje**: La liberación de las reservas de stock también es transaccional.

### b. Máquina de Estados del Ensamblado

El ciclo de vida de una orden de ensamblado es controlado por una máquina de estados estricta que previene transiciones inválidas. El flujo permitido es el siguiente:

`BACKLOG` -> `TODO` -> `IN_PROGRESS` -> `TO_VERIFY` -> `DONE`

- Desde la mayoría de los estados se puede volver a un estado anterior o a `CANCELADO`.
- El paso a `DONE` es el único que dispara el consumo de inventario y la creación del producto final.
- Cada transición de estado queda registrada con una marca de tiempo (`backlog_at`, `todo_at`, etc.) para una auditoría completa.

### c. Modelo de Stock

El control de inventario se gestiona a través de dos campos principales en el modelo `Stock`:

- `on_hand`: Representa el número total de unidades físicas en el almacén.
- `reserved`: Representa el número de unidades que, aunque físicamente presentes, están comprometidas para órdenes de ensamblaje en curso.

El **stock disponible** para nuevas órdenes siempre se calcula como `on_hand - reserved`.

## 5. Configuración e Instalación

### Prerrequisitos
- Node.js (v18 o superior)
- npm

### Pasos
1. Navegue al directorio `backend`.
2. Instale dependencias: `npm install`
3. Configure su archivo `.env` (puede usar `.env.example` como base).
4. Ejecute migraciones: `npx sequelize-cli db:migrate`
5. (Opcional) Ejecute seeders: `npx sequelize-cli db:seed:all`

## 6. Desarrollo
Para iniciar el servidor en modo de desarrollo:
```bash
npm start
```
El servidor se iniciará en `http://localhost:3001` (o el puerto configurado).

## 7. API Endpoints Detallados

Todas las rutas (excepto `/auth/*`) requieren un token JWT.

### Autenticación
- `POST /auth/register`: Registro de nuevo usuario.
- `POST /auth/login`: Inicio de sesión.

### Gestión de Items
- `GET /items`: Obtener todos los items.
- `POST /items`: Crear un nuevo item. Para Kits/Productos, se puede incluir el BOM.
  - **Body Ejemplo (para un Kit):**
    ```json
    {
      "sku": "KT-001",
      "name": "Kit de Montaje Básico",
      "type": "KIT",
      "uom_id": 1,
      "bom": [
        { "child_item_id": 101, "quantity": 4 },
        { "child_item_id": 102, "quantity": 8 }
      ]
    }
    ```
- `PUT /items/:id`: Actualizar un item. Si se envía un `bom`, reemplaza el existente.
- `DELETE /items/:id`: Desactivar un item (soft delete).
- `GET /items/:id/bom`: Obtener el BOM de una plantilla.

### Gestión de Stock
- `GET /stock`: Obtener todo el stock.
- `POST /stock/adjust`: Ajuste manual de stock.
  - **Body Ejemplo:**
    ```json
    {
      "itemId": 101,
      "siteId": 1,
      "quantity": 50,
      "adjustment_type": "ENTRADA",
      "notes": "Recepción de proveedor"
    }
    ```

### Gestión de Ensamblajes
- `POST /stock/assembly`: Crear una nueva orden de ensamblaje y reservar stock.
  - **Body Ejemplo:**
    ```json
    {
      "templateId": 1, // ID del Kit o Producto a ensamblar
      "quantity": 10,  // Cantidad a producir
      "siteId": 1,
      "notes": "Pedido para cliente XYZ"
    }
    ```
  - **Respuesta de Error (Stock Insuficiente):**
    ```json
    {
      "message": "Stock insuficiente para algunos componentes",
      "insufficientComponents": [
        { "name": "Tornillo 4mm", "required": 40, "available": 25 }
      ]
    }
    ```
- `GET /stock/assemblies`: Obtener todas las órdenes de ensamblaje.
- `POST /stock/assemblies/:id/change-status`: Cambiar el estado de una orden (corazón del Kanban).
  - **Body Ejemplo:**
    ```json
    {
      "newStatus": "IN_PROGRESS",
      "notes": "El operario Juan ha comenzado la tarea."
    }
    ```
  - **Respuesta de Error (Transición Inválida):**
    ```json
    {
      "message": "No se puede cambiar de BACKLOG a IN_PROGRESS"
    }
    ```
- `POST /stock/assemblies/:id/complete`: **(Obsoleto)** La funcionalidad de completar un ensamblado ha sido integrada en el endpoint `change-status` cuando se mueve al estado `DONE` para unificar la lógica del Kanban.
- `POST /stock/assemblies/:id/cancel`: Cancela una orden y libera el stock reservado.