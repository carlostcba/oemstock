# Manual de Usuario de OemStock

## 1. Introducción

Este manual describe cómo utilizar la aplicación OemStock según su rol asignado. El sistema está diseñado con tres niveles de acceso: Operario, Supervisor y Administrador, cada uno con responsabilidades y permisos específicos.

---

## 2. Rol: Operario de Producción

El rol del Operario está centrado exclusivamente en el proceso de ensamblaje. Su principal herramienta de trabajo es el Tablero Kanban que se encuentra en la página **Ensamblado**.

### a. Visualización de Tareas

Al ingresar a la página de **Ensamblado**, verá el Tablero Kanban. Las columnas que le conciernen son:

- **To Do (Por Hacer)**: Aquí aparecen las órdenes de ensamblaje que han sido asignadas y están listas para ser producidas.
- **In Progress (En Progreso)**: Aquí se colocan las órdenes en las que está trabajando activamente.
- **To Verify (A Verificar)**: Aquí se mueven las órdenes que ha terminado de ensamblar y que están pendientes de una revisión de calidad.

### b. Flujo de Trabajo Diario

1.  **Iniciar una Tarea**: Revise la columna `To Do` para ver las tareas pendientes. Cuando esté listo para comenzar a ensamblar un producto, busque la tarjeta correspondiente a la orden y haga clic en el botón **"Iniciar"**. La tarjeta se moverá automáticamente a la columna `In Progress`.

2.  **Completar una Tarea**: Una vez que haya finalizado el ensamblaje físico del producto, busque la tarjeta en la columna `In Progress` y haga clic en el botón **"Completar"**. La tarjeta se moverá a la columna `To Verify`, notificando al sistema que el producto está listo para ser inspeccionado.

El rol del operario no permite crear nuevas órdenes ni aprobar la calidad final de un producto. Su responsabilidad es ejecutar las tareas de ensamblaje asignadas.

---

## 3. Rol: Supervisor de Planta

El Supervisor gestiona el flujo de producción, crea órdenes de ensamblaje y realiza el control de calidad. Tiene acceso a todas las funciones del Operario y además puede:

### a. Crear Órdenes de Ensamblaje

1.  Navegue a la página de **Ensamblado** y seleccione la pestaña **"Crear Ensamblado"**.
2.  En el formulario, seleccione la **Plantilla del Producto/Kit** que desea producir.
3.  Especifique la **Cantidad** a ensamblar.
4.  (Opcional) Añada **Notas** relevantes para la orden.
5.  Haga clic en **"Crear Solicitud"**. El sistema verificará la disponibilidad de componentes y, si es exitoso, creará una nueva tarjeta en la columna `Backlog` del Kanban, reservando el stock necesario.

### b. Gestionar el Tablero Kanban

El Supervisor tiene control total sobre el tablero:

- **Priorizar Tareas**: Arrastre las tarjetas desde `Backlog` a `To Do` para indicar a los operarios cuáles son las siguientes órdenes a producir.
- **Verificar y Aprobar (Paso Crítico)**: Cuando un operario mueve una tarjeta a `To Verify`, el Supervisor debe inspeccionar el producto físico. Si la calidad es la correcta, debe hacer clic en el botón **"Verificar y Aprobar"** en la tarjeta. Esta se moverá a `Done` y el sistema automáticamente:
    - Descontará los componentes del inventario.
    - Añadirá el producto terminado al stock disponible.
- **Cancelar Órdenes**: Si una orden en `Backlog` o `To Do` ya no es necesaria, puede ser cancelada. Esto revertirá la reserva de stock, liberando los componentes para otras órdenes.

---

## 4. Rol: Administrador del Sistema

El Administrador tiene acceso completo a todas las funciones del sistema, incluyendo las del Supervisor. Sus responsabilidades adicionales se centran en la configuración y gestión de los datos maestros.

### a. Gestión del Catálogo

El Administrador es el único rol que puede modificar el catálogo de productos desde la página **Catálogo**.

- **Crear/Editar Items**: Puede crear y modificar los tres tipos de items:
    - **Elementos Base**: Materias primas que se compran.
    - **Kits**: Sub-ensamblajes. El administrador debe definir su **Lista de Materiales (BOM)**, añadiendo los `Elementos Base` que lo componen.
    - **Productos**: Productos finales. El administrador define su **BOM**, añadiendo los `Kits` que lo componen.
- **Desactivar Items**: Si un producto se discontinúa, puede marcarse como inactivo.

### b. Gestión de Stock

Desde la página **Stock**, el Administrador tiene visibilidad y control total sobre el inventario.

- **Visualizar Stock**: Puede ver el estado del inventario (`físico`, `reservado`, `disponible`) para todos los items en todos los sitios.
- **Realizar Ajustes Manuales**: Es el único rol que puede corregir el inventario. A través del botón **"Ajustar Stock"**, puede:
    - Registrar una **Entrada** de material (ej: al recibir un pedido de un proveedor).
    - Registrar una **Salida** (ej: por rotura o pérdida de material).
    - Realizar un **Ajuste** para alinear el stock del sistema con el conteo físico real.

### c. Gestión de Usuarios y Sitios (Futuro)

El Administrador también será responsable de crear y gestionar las cuentas de usuario, asignar roles y dar de alta nuevos sitios o sucursales en el sistema a medida que estas funcionalidades se desarrollen.
