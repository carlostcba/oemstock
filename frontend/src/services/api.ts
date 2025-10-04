const BASE_URL = '/api'; // Asumimos que el frontend se sirve desde el mismo origen que el backend

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

// --- Funciones de API ---

/**
 * Obtiene todas las plantillas (items de tipo KIT o PRODUCT)
 */
export const getTemplates = async (): Promise<Item[]> => {
  const response = await fetch(`${BASE_URL}/items/templates`);
  if (!response.ok) {
    throw new Error('Error al obtener las plantillas');
  }
  return response.json();
};

/**
 * Obtiene la lista de materiales (BOM) para una plantilla específica
 * @param templateId - El ID de la plantilla
 */
export const getBom = async (templateId: number): Promise<BomItem[]> => {
  const response = await fetch(`${BASE_URL}/items/${templateId}/bom`);
  if (!response.ok) {
    throw new Error('Error al obtener la lista de materiales');
  }
  return response.json();
};

/**
 * Envía una nueva solicitud de ensamblado para reservar stock
 * @param payload - Los datos para el ensamblado
 */
export const createAssembly = async (payload: AssemblyPayload): Promise<any> => {
  const response = await fetch(`${BASE_URL}/stock/assembly`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al crear la solicitud de ensamblado');
  }
  return response.json();
};