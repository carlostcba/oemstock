const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

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
  notes?: string;
}

export interface AssemblyInstance {
  id: number;
  template_id: number;
  site_id: number;
  quantity: number;
  status: 'RESERVADO' | 'ENSAMBLADO' | 'CANCELADO';
  created_by: number;
  completed_at: string | null;
  completed_by: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  Template?: Item;
  Site?: {
    id: number;
    name: string;
  };
  Creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  Completer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// --- Logica de API ---

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

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

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// --- Endpoints de Items ---

export const getTemplates = async (): Promise<Item[]> => {
  return apiFetch<Item[]>(`${BASE_URL}/items/templates`);
};

export const getBom = async (templateId: number): Promise<BomItem[]> => {
  return apiFetch<BomItem[]>(`${BASE_URL}/items/${templateId}/bom`);
};

// --- Endpoints de Ensamblado ---

export const createAssembly = async (payload: AssemblyPayload): Promise<{ message: string; assemblyInstance: AssemblyInstance }> => {
  return apiFetch<{ message: string; assemblyInstance: AssemblyInstance }>(`${BASE_URL}/stock/assembly`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getAssemblies = async (status?: string, siteId?: number): Promise<AssemblyInstance[]> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (siteId) params.append('siteId', siteId.toString());
  
  const queryString = params.toString();
  const url = queryString ? `${BASE_URL}/stock/assemblies?${queryString}` : `${BASE_URL}/stock/assemblies`;
  
  return apiFetch<AssemblyInstance[]>(url);
};

export const getAssemblyById = async (id: number): Promise<AssemblyInstance> => {
  return apiFetch<AssemblyInstance>(`${BASE_URL}/stock/assemblies/${id}`);
};

export const completeAssembly = async (id: number): Promise<{ message: string; assembly: AssemblyInstance }> => {
  return apiFetch<{ message: string; assembly: AssemblyInstance }>(`${BASE_URL}/stock/assemblies/${id}/complete`, {
    method: 'POST',
  });
};

export const cancelAssembly = async (id: number): Promise<{ message: string; assembly: AssemblyInstance }> => {
  return apiFetch<{ message: string; assembly: AssemblyInstance }>(`${BASE_URL}/stock/assemblies/${id}/cancel`, {
    method: 'POST',
  });
};

// --- Endpoints de Autenticacion ---

export const login = async (email: string, password: string): Promise<{ token: string }> => {
  return apiFetch<{ token: string }>(`${BASE_URL.replace('/api', '')}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};