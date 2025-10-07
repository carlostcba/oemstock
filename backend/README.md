# OemStock - Backend

## 1. Visión General y Objetivos
Este es el servidor backend para la aplicación OemStock. El objetivo es desarrollar una aplicación web para gestionar el inventario de Elementos Base (EL), Kits y Productos a través de múltiples sitios o sucursales. El sistema debe ofrecer una trazabilidad completa de cada movimiento, un control de acceso robusto basado en roles y la capacidad de gestionar el ciclo de vida de la producción.

## 2. Glosario de Conceptos Clave
- **Elemento Base (EL):** Unidad mínima de stock (ej: tornillo).
- **Kit (Plantilla):** "Receta" que define los componentes de un kit. No tiene stock por sí misma.
- **Kit en Stock (Instancia):** Un kit real y ensamblado en el stock de un sitio.
- **Producto (Plantilla):** Agrupación de Kits y/o Elementos Base que componen un producto final.
- **Producto en Stock (Instancia):** Un producto final ensamblado y disponible en stock.
- **Sitios:** Sucursales físicas donde se almacena el stock.
- **Stock Disponible:** `Stock Físico (on_hand) - Stock Reservado (reserved)`.
- **BOM (Bill of Materials):** Lista de materiales o "receta" que compone un Kit o Producto.
## 3. Arquitectura y Tecnologías
- **Framework:** Node.js con Express y TypeScript.
- **ORM:** Sequelize para la interacción con la base de datos.
- **Base de Datos:** Configurado para usar SQLite en desarrollo y MySQL en producción.
- **Autenticación:** Basada en JSON Web Tokens (JWT).
- **Permisos (Anti-Hardcoding):** El sistema de roles y permisos será completamente dinámico y gestionado desde la base de datos.

## 4. Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- npm

### Instalación
1. Navegue al directorio `backend`.
2. Instale las dependencias:
   ```bash
   npm install
   ```

### Configuración de la Base de Datos
1. La configuración se encuentra en `config/config.json`.
2. Para el entorno de desarrollo, el backend utilizará un archivo `database.sqlite` ubicado en la raíz del proyecto (`c:\github\Oemstock\database.sqlite`).
3. Para crear y aplicar el esquema de la base de datos, ejecute las migraciones desde el directorio `backend`:
   ```bash
   npx sequelize-cli db:migrate
   ```
4. (Opcional) Para poblar la base de datos con datos iniciales, ejecute los seeders:
   ```bash
   npx sequelize-cli db:seed:all
   ```

## 5. Desarrollo
Para iniciar el servidor en modo de desarrollo con recarga automática, ejecute desde el directorio `backend`:
```bash
npm start
```
El servidor se iniciará en `http://localhost:3001` (o el puerto configurado).

## 6. Estructura del Proyecto
```
backend/
├── config/         # Configuración de la base de datos (Sequelize)
├── migrations/     # Archivos de migración de la base de datos
├── models/         # Modelos de datos de Sequelize
├── seeders/        # Archivos para poblar la base de datos
└── src/            # Código fuente de la aplicación (TypeScript)
    ├── auth.ts     # Lógica de autenticación
    └── index.ts    # Punto de entrada del servidor Express
```