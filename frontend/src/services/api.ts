const BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

// --- Tipos de Datos ---
export interface Uom {
  id: number;
  name: string;
  symbol: string;
}

export interface Item {
  id: number;
  sku: string;
  name: string;
  type: 'ELEMENT' | 'KIT' | 'PRODUCT';
  active: boolean;
  notes: string;
  uom_id: number;
  uom: Uom;
}

export interface BomItem {
  id: number;
  parent_item_id: number;
  child_item_id: number;
  quantity: number;
  Child: Item;
}

export interface AssemblyPayload {
  templateId: number;
  quantity: number;
  siteId: number;
}

// --- Lógica de API ---

let authToken: string | null = null;

/**
 * Establece el token de autenticación para todas las futuras llamadas a la API.
 * @param token - El token JWT.
 */
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/**
 * Centraliza el manejo de errores de la API.
 */
async function handleApiError(response: Response): Promise<void> {
  try {
    const errorData = await response.json();
    throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Realiza una petición fetch y maneja la respuesta y la autenticación.
 */
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    await handleApiError(response);
  }

  // Si la respuesta es 204 No Content, no hay cuerpo que parsear
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Obtiene todas las plantillas (items de tipo KIT o PRODUCT)
 */
export const getTemplates = async (): Promise<Item[]> => {
  return apiFetch<Item[]>(`${BASE_URL}/items/templates`);
};

/**
 * Obtiene la lista de materiales (BOM) para una plantilla específica
 */
export const getBom = async (templateId: number): Promise<BomItem[]> => {
  return apiFetch<BomItem[]>(`${BASE_URL}/items/${templateId}/bom`);
};

/**
 * Envía una nueva solicitud de ensamblado para reservar stock
 */
export const createAssembly = async (payload: AssemblyPayload): Promise<any> => {
  return apiFetch<any>(`${BASE_URL}/stock/assembly`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Inicia sesión de un usuario.
 */
export const login = async (email: string, password: string): Promise<{ token: string }> => {
  return apiFetch<{ token: string }>(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};