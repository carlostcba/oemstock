import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import ReusableTable, { Column } from '../components/ReusableTable';
import * as api from '../services/api';

// Usamos el tipo `Item` de la API para asegurar que los 'id' de las columnas son claves válidas.
const columns: Column<api.Item>[] = [
  { id: 'sku', label: 'SKU', minWidth: 150 },
  { id: 'name', label: 'Nombre', minWidth: 250 },
  { id: 'type', label: 'Tipo', minWidth: 100 },
  {
    id: 'uom',
    label: 'Unidad',
    minWidth: 100,
    render: (item) => item.uom.name, // Usamos render para mostrar el nombre de la unidad
  },
];

export default function CatalogPage() {
  const [items, setItems] = useState<api.Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getTemplates()
      .then(data => setItems(data))
      .catch(err => setError(err.message || 'Error al cargar el catálogo.'))
      .finally(() => setLoading(false));
  }, []);

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
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && <ReusableTable columns={columns} data={items} />}
    </Paper>
  );
}