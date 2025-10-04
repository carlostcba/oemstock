
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ReusableTable from '../components/ReusableTable';

// Usaremos datos de ejemplo por ahora
const mockItems = [
  { id: 1, sku: 'EL-TOR-001', name: 'Tornillo 1', type: 'ELEMENT', uom: 'unidad' },
  { id: 2, sku: 'EL-TUE-001', name: 'Tuerca 1', type: 'ELEMENT', uom: 'unidad' },
  { id: 3, sku: 'KIT-MEC-3M', name: 'Kit Mecánico Barrera 3 Metros', type: 'KIT', uom: 'kit' },
  { id: 4, sku: 'PROD-BARRERA', name: 'Barrera Completa', type: 'PRODUCT', uom: 'unidad' },
];

const columns = [
  { id: 'sku', label: 'SKU', minWidth: 150 },
  { id: 'name', label: 'Nombre', minWidth: 250 },
  { id: 'type', label: 'Tipo', minWidth: 100 },
  { id: 'uom', label: 'Unidad', minWidth: 100 },
];

export default function CatalogPage() {
  return (
    <Paper sx={{ p: 2, margin: 'auto', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Catálogo de Ítems
        </Typography>
        <Button variant="contained" color="primary">
          Añadir Ítem
        </Button>
      </Box>
      <ReusableTable columns={columns} data={mockItems} />
    </Paper>
  );
}
