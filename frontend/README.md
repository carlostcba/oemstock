# OemStock - Frontend

## 1. Visión General y Objetivos
Esta es la aplicación frontend para OemStock, un sistema de gestión de stock y ensamblado multisitio. La interfaz de usuario está diseñada para permitir a los operarios, supervisores y administradores interactuar con el sistema de forma intuitiva y eficiente, cubriendo desde la definición de productos hasta el seguimiento de la producción en un tablero Kanban.

## 2. Tecnologías Utilizadas
- **Framework:** React v18 con TypeScript.
- **UI Kit:** Material-UI (MUI) v5 para una interfaz de usuario moderna y consistente.
- **Enrutamiento:** React Router v6 para la navegación del lado del cliente.
- **Gestión de Estado:** React Context API para la gestión de la autenticación.

## 3. Configuración e Instalación

1. Navegue al directorio `frontend`.
2. Instale las dependencias: `npm install`
3. Inicie la aplicación: `npm start`

La aplicación se ejecutará en `http://localhost:3000` y se conectará al backend que se espera esté en `http://localhost:3001`.

## 4. Flujos Operativos Detallados

A continuación se describen los flujos de trabajo principales desde la perspectiva del usuario.

### Flujo 1: Definición de un Nuevo Producto (Rol: Administrador)

Este flujo describe cómo un administrador puede definir un nuevo producto final y los sub-componentes que lo conforman.

1.  **Crear Materias Primas**: El administrador navega a la página **Catálogo**. Hace clic en `Añadir Item`, rellena los datos (SKU, nombre) y selecciona el tipo `Elemento Base`. Repite este paso para toda la materia prima necesaria (ej: "Tornillo 4mm", "Carcasa Plástica").

2.  **Definir un Kit (Sub-ensamblaje)**: Vuelve a hacer clic en `Añadir Item`. Esta vez, selecciona el tipo `Kit`. Al hacerlo, aparece el editor de **Lista de Materiales (BOM)**.
    - En el editor de BOM, selecciona los `Elementos Base` creados en el paso anterior (ej: "Tornillo 4mm") y define la cantidad necesaria (ej: 8).
    - Añade todos los componentes al BOM y guarda el Kit (ej: "Kit de Carcasa").

3.  **Definir el Producto Final**: Por último, crea un nuevo item de tipo `Producto`. En su editor de BOM, en lugar de `Elementos`, ahora puede seleccionar `Kits` como componentes (ej: "Kit de Carcasa", cantidad: 1). Guarda el Producto.

Al final de este flujo, el administrador ha creado una "receta" completa. El sistema ahora sabe exactamente qué componentes se necesitan para fabricar el producto final.

### Flujo 2: Ciclo de Producción en Kanban (Roles: Supervisor y Operario)

Este flujo describe cómo una orden de producción viaja a través del tablero Kanban desde su creación hasta su finalización.

1.  **Crear Orden de Ensamblaje (Supervisor)**: El supervisor va a la página de **Ensamblado**. En la pestaña `Crear Ensamblado`, selecciona la plantilla del `Producto` que se definió en el flujo anterior y la cantidad que desea producir. Al hacer clic en `Crear Solicitud`, el sistema:
    - Verifica que haya stock disponible de todos los componentes necesarios.
    - Si hay stock, crea una nueva tarjeta en la columna `Backlog` del tablero Kanban y reserva el material.

2.  **Priorizar Tarea (Supervisor)**: El supervisor arrastra la tarjeta de `Backlog` a la columna `To Do` (Por Hacer), señalando que la producción de este item es la siguiente en la cola.

3.  **Iniciar Producción (Operario)**: Un operario de planta ve la nueva tarjeta en `To Do`. La arrastra a `In Progress` (En Progreso) para indicar que ha comenzado a trabajar en ella.

4.  **Finalizar Ensamblaje (Operario)**: Una vez que el operario ha terminado de ensamblar el producto, arrastra la tarjeta a la columna `To Verify` (A Verificar). El producto físico queda a la espera de una inspección de calidad.

5.  **Verificar y Completar (Supervisor)**: El supervisor inspecciona el producto ensamblado. Si todo es correcto, arrastra la tarjeta a la columna `Done` (Hecho). Esta acción final es crítica y le indica al backend que:
    - Consuma permanentemente los componentes que estaban reservados.
    - Incremente el stock del producto final, que ahora está disponible para la venta.

### Flujo 3: Ajuste de Inventario (Rol: Administrador)

Este flujo describe cómo un administrador corrige una discrepancia en el inventario.

1.  **Identificar Discrepancia**: El administrador navega a la página de **Stock**. Filtra o busca hasta encontrar un `Elemento Base` cuyo stock físico no coincide con el del sistema.

2.  **Iniciar Ajuste**: Hace clic en el botón `Ajustar Stock`. Se abre un formulario en una ventana modal.

3.  **Completar Formulario**: En el formulario, selecciona el item, el sitio, el tipo de ajuste (en este caso, `Ajuste`) y la cantidad correcta. Añade una nota explicando el motivo (ej: "Conteo de ciclo trimestral").

4.  **Confirmar**: Al confirmar, el stock `on_hand` del item se actualiza inmediatamente en la base de datos, quedando el registro corregido.

## 5. Estructura del Proyecto
```
frontend/
├── components/   # Componentes reutilizables (Layout, Kanban, Tablas, etc.)
├── context/      # AuthContext para la gestión de autenticación
├── pages/        # Componentes que representan las páginas principales
├── services/     # Cliente de API (api.ts)
└── App.tsx       # Componente raíz y enrutador principal
```