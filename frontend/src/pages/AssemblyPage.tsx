import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  SelectChangeEvent
} from '@mui/material';
import * as api from '../services/api';
import ReusableTable, { Column } from '../components/ReusableTable'; // Importamos Column

// Definimos las columnas para la tabla de la lista de materiales (BOM)
const bomColumns: Column<api.BomItem>[] = [ // Usamos la interfaz Column importada
  { id: 'child_item_id', label: 'ID Componente', minWidth: 120 },
  {
    id: 'Child',
    label: 'Nombre Componente',
    minWidth: 250,
    // Usamos una función de renderizado para mostrar el nombre del ítem anidado
    render: (row: api.BomItem) => row.Child.name,
  },
  { id: 'quantity', label: 'Cantidad Requerida', minWidth: 150 },
];

const AssemblyPage: React.FC = () => {
  // Estados para los datos
  const [templates, setTemplates] = useState<api.Item[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [bom, setBom] = useState<api.BomItem[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  // Estados para la UI (carga, errores, éxito)
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [loadingBom, setLoadingBom] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar las plantillas al montar el componente
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const data = await api.getTemplates();
        setTemplates(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar las plantillas.');
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Manejar el cambio de plantilla seleccionada
  const handleTemplateChange = async (event: SelectChangeEvent<string>) => {
    const templateId = event.target.value;
    setSelectedTemplate(templateId);
    setBom([]);
    setError(null);
    setSuccess(null);

    if (templateId) {
      try {
        setLoadingBom(true);
        const bomData = await api.getBom(Number(templateId));
        setBom(bomData);
      } catch (err: any) {
        setError(err.message || 'Error al cargar la lista de materiales.');
      } finally {
        setLoadingBom(false);
      }
    }
  };

  // Manejar el envío del formulario de ensamblado
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTemplate || quantity <= 0) {
      setError('Por favor, seleccione una plantilla y una cantidad válida.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: api.AssemblyPayload = {
        templateId: Number(selectedTemplate),
        quantity,
        siteId: 1, // Hardcodeado por ahora, podría venir de un selector de sitio
      };
      const response = await api.createAssembly(payload);
      setSuccess(response.message);
    } catch (err: any) {
      // Aquí se mostrará el error específico de la API, como "Stock insuficiente"
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3, margin: 'auto', flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Iniciar Ensamblado
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={loadingTemplates}>
              <InputLabel id="template-select-label">Plantilla de Producto/Kit</InputLabel>
              <Select
                labelId="template-select-label"
                value={selectedTemplate}
                label="Plantilla de Producto/Kit"
                onChange={handleTemplateChange}
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} ({template.sku})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cantidad a Ensamblar"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
        </Grid>

        <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }} disabled={submitting || !selectedTemplate}>
          {submitting ? <CircularProgress size={24} /> : 'Reservar Stock y Ensamblar'}
        </Button>
      </Box>

      {loadingBom && <CircularProgress sx={{ mt: 2 }} />}
      {bom.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>Lista de Materiales (BOM)</Typography>
          <ReusableTable columns={bomColumns} data={bom} />
        </Box>
      )}
    </Paper>
  );
};

export default AssemblyPage;