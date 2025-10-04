# OemStock - Frontend

## 1. Visión General y Objetivos
Esta es la aplicación frontend para OemStock, un sistema de gestión de stock multisitio. La interfaz de usuario está diseñada para permitir a los operarios, supervisores y administradores interactuar con el sistema de forma intuitiva.

## 2. Tecnologías Utilizadas
- **Framework:** React con TypeScript.
- **UI Kit:** Material-UI (MUI) para componentes de interfaz de usuario.
- **Enrutamiento:** React Router para la navegación entre páginas.
- **Comunicación con Backend:** El servicio `api.ts` gestiona las llamadas a la API del backend.

## 3. Configuración del Proyecto

### Prerrequisitos
- Node.js (v18 o superior)
- npm

### Instalación
1. Navegue al directorio `frontend`.
2. Instale las dependencias:
   ```bash
   npm install
   ```

## 4. Cómo Iniciar la Aplicación
Para iniciar la aplicación en modo de desarrollo, ejecute desde el directorio `frontend`:
```bash
npm start
```
La aplicación se abrirá automáticamente en su navegador en `http://localhost:3000`.

### Conexión con el Backend
El frontend espera que el servidor backend se esté ejecutando en `http://localhost:3001`. Esta configuración se puede ajustar en `src/services/api.ts`.

## 5. Estructura del Proyecto
```
frontend/
├── public/         # Archivos estáticos y el index.html principal
└── src/
    ├── components/   # Componentes de React reutilizables
    ├── context/      # Contexto de React (ej: AuthContext)
    ├── pages/        # Componentes que representan páginas completas
    ├── services/     # Servicios, como el cliente de API (api.ts)
    ├── App.tsx       # Componente raíz y enrutador principal
    └── index.tsx     # Punto de entrada de la aplicación React
```

## 6. Flujos y Características (MVP)
- **Autenticación:** Página de inicio de sesión (`LoginPage`).
- **Navegación Protegida:** Rutas que requieren autenticación.
- **Dashboard:** Vista principal después de iniciar sesión (`DashboardPage`).
- **Catálogo:** Visualización de plantillas de Items, Kits y Productos (`CatalogPage`).
- **Ensamblado:** Página para que los operarios ensamblen Kits/Productos (`AssemblyPage`).