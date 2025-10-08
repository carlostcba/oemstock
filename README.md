# OemStock - Sistema de Gestión de Inventario y Ensamblado

## 1. Visión General

OemStock es una aplicación web completa diseñada para la gestión de inventario y procesos de ensamblado en múltiples sucursales (sitios). Permite un control detallado sobre los componentes individuales (`Elementos`), la definición de productos y kits a través de Listas de Materiales (`BOM`), y el seguimiento del ciclo de vida completo de las órdenes de producción en un tablero Kanban interactivo.

El proyecto está dividido en dos componentes principales:

- **`./backend/`**: Un servidor API RESTful construido con Node.js, Express y TypeScript, que maneja toda la lógica de negocio, la interacción con la base de datos (a través de Sequelize) y la autenticación.
- **`./frontend/`**: Una aplicación de página única (SPA) construida con React, TypeScript y Material-UI, que proporciona una interfaz de usuario rica e interactiva para interactuar con el sistema.

---

## 2. Flujo Operativo y Características Principales

El sistema OemStock modela un flujo de trabajo de producción realista, desde la materia prima hasta el producto terminado.

### a. Catálogo y Listas de Materiales (BOM)

El núcleo del sistema es el **Catálogo**, donde se define todo lo que la empresa produce y utiliza.

- **Elementos**: Son la materia prima o los componentes individuales que no se fabrican internamente (ej: tornillos, chips, carcasas). Tienen stock.
- **Kits y Productos (Plantillas)**: Son las "recetas" o planos. Un **Kit** es un conjunto de `Elementos`, y un **Producto** es un conjunto de `Kits`. Estas plantillas no tienen stock por sí mismas, sino que definen qué se necesita para construir una unidad.
- **Bill of Materials (BOM)**: Desde la interfaz del catálogo, los administradores pueden crear estas plantillas y asignarles su lista de materiales (BOM), especificando qué componentes y en qué cantidad son necesarios.

### b. Gestión de Stock Multi-sitio

OemStock permite gestionar el inventario a través de diferentes ubicaciones físicas (almacenes, sucursales, etc.).

- **Stock Físico (`on_hand`)**: La cantidad total de un item que existe físicamente en un sitio.
- **Stock Reservado (`reserved`)**: Cuando se crea una orden de ensamblaje, el sistema "reserva" los componentes necesarios del stock físico. Estos componentes todavía están en el almacén, pero no están disponibles para nuevas órdenes.
- **Stock Disponible**: Es el resultado de `Stock Físico - Stock Reservado`. Esta es la cantidad que se puede usar para nuevas producciones.
- **Ajustes Manuales**: Los administradores pueden realizar ajustes de stock para corregir discrepancias, registrar entradas de material o dar de baja componentes.

### c. Ciclo de Vida del Ensamblado (Kanban)

La característica más destacada para la producción es el **Tablero Kanban de Ensamblado**. Este tablero visualiza y gestiona todo el ciclo de vida de una orden de producción.

1.  **Creación de la Orden**: Un `Supervisor` o `Administrador` crea una "Orden de Ensamblado" para un Kit o Producto. En este momento, el sistema verifica si hay stock disponible y, si lo hay, crea la orden en estado `BACKLOG` y reserva los componentes.
2.  **Backlog**: La orden espera aquí hasta que un `Supervisor` la prioriza y la mueve a `TO DO` (Por Hacer).
3.  **To Do**: La orden está lista para ser trabajada. Un `Operario` la toma, moviéndola a `IN PROGRESS` (En Progreso).
4.  **In Progress**: El `Operario` está ensamblando físicamente el producto.
5.  **To Verify**: Una vez que el `Operario` termina, mueve la orden a `TO VERIFY` (A Verificar). El producto ensamblado espera una revisión de calidad.
6.  **Done**: Un `Supervisor` revisa el producto. Si es correcto, mueve la orden a `DONE` (Hecho). En este momento crucial, el sistema realiza dos acciones atómicas:
    - **Consume los componentes**: El stock reservado se descuenta del stock físico.
    - **Añade el producto final**: Se incrementa el stock del Kit o Producto ensamblado en el sitio correspondiente.

Este flujo garantiza una trazabilidad completa y un control estricto sobre el inventario en todo momento.

---

## 3. Puesta en Marcha del Proyecto Completo

Para ejecutar la aplicación, es necesario iniciar tanto el backend como el frontend. Siga estos pasos en orden.

### 1. Iniciar el Backend

1.  Abra una terminal y navegue al directorio del backend:
    ```bash
    cd backend
    ```
2.  Instale las dependencias:
    ```bash
    npm install
    ```
3.  Ejecute las migraciones para crear la estructura de la base de datos:
    ```bash
    npx sequelize-cli db:migrate
    ```
4.  (Opcional) Para poblar la base de datos con datos de demostración:
    ```bash
    npx sequelize-cli db:seed:all
    ```
5.  Inicie el servidor del backend:
    ```bash
    npm start
    ```

> El servidor se ejecutará en `http://localhost:3001`. Para más detalles, consulte el **[README del Backend](./backend/README.md)**.

### 2. Iniciar el Frontend

1.  Abra una **nueva terminal** y navegue al directorio del frontend:
    ```bash
    cd frontend
    ```
2.  Instale las dependencias:
    ```bash
    npm install
    ```
3.  Inicie la aplicación de React:
    ```bash
    npm start
    ```

> La aplicación se abrirá en `http://localhost:3000`. Para más detalles, consulte el **[README del Frontend](./frontend/README.md)**.