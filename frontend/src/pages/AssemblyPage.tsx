import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Paper, FormControl, InputLabel, Select, 
  MenuItem, TextField, Button, CircularProgress, Alert, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import * as api from '../services/api';

// Lista de sitios hardcodeada hasta que haya un endpoint en el backend
const sites = [
  { id: 1, name: 'Alberti' },
  { id: 2, name: 'Delviso' },
  { id: 3, name: 'Casa Matriz' },
];

const AssemblyPage = () => {
  // --- ESTADO DEL COMPONENTE ---
  const [templates, setTemplates] = useState<api.Item[]>([]);
  const [bom, setBom] = useState<api.BomItem[]>([]);
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(false);
  const [loadingBom, setLoadingBom] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- EFECTOS (LIFECYCLE) ---

  // Cargar plantillas al montar el componente
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const data = await api.getTemplates();
        setTemplates(data);
      } catch (err: any) {
        setError('Error al cargar las plantillas.');
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Cargar BOM cuando se selecciona una plantilla
  useEffect(() => {
    if (!selectedTemplate) {
      setBom([]);
      return;
    }

    const fetchBom = async () => {
      setLoadingBom(true);
      setError(null);
      try {
        const data = await api.getBom(Number(selectedTemplate));
        setBom(data);
      } catch (err: any) {
        setError('Error al cargar la lista de materiales.');
        setBom([]);
      } finally {
        setLoadingBom(false);
      }
    };
    fetchBom();
  }, [selectedTemplate]);

  // --- MANEJADORES DE EVENTOS ---

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTemplate || !selectedSite || !quantity || Number(quantity) <= 0) {
      setError('Por favor, complete todos los campos correctamente.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: api.AssemblyPayload = {
        templateId: Number(selectedTemplate),
        siteId: Number(selectedSite),
        quantity: Number(quantity),
      };
      const response = await api.createAssembly(payload);
      setSuccess(response.message || 'Solicitud de ensamblado creada con éxito.');
      // Resetear formulario
      setSelectedTemplate('');
      setSelectedSite('');
      setQuantity('1');
      setBom([]);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Crear Ensamblado de Stock
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Columna de Formulario */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Paso 1: Seleccionar Producto</Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="template-select-label">Plantilla</InputLabel>
                <Select
                  labelId="template-select-label"
                  value={selectedTemplate}
                  label="Plantilla"
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  disabled={loadingTemplates}
                >
                  {loadingTemplates ? <MenuItem>Cargando...</MenuItem> : templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} ({template.sku})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="site-select-label">Sitio de Ensamblado</InputLabel>
                <Select
                  labelId="site-select-label"
                  value={selectedSite}
                  label="Sitio de Ensamblado"
                  onChange={(e) => setSelectedSite(e.target.value)}
                >
                  {sites.map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Cantidad a Ensamblar"
                type="number"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputProps={{ min: 1 }}
                sx={{ mb: 3 }}
              />
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={submitting || !selectedTemplate || !selectedSite}
                fullWidth
              >
                {submitting ? <CircularProgress size={24} /> : 'Reservar Stock para Ensamblado'}
              </Button>
            </Grid>

            {/* Columna de BOM */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>Paso 2: Materiales Requeridos</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Componente (SKU)</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell align="right">Cantidad Requerida</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingBom ? (
                      <TableRow><TableCell colSpan={3} align="center"><CircularProgress /></TableCell></TableRow>
                    ) : bom.length > 0 ? (
                      bom.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.Child.sku}</TableCell>
                          <TableCell>{item.Child.name}</TableCell>
                          <TableCell align="right">{item.quantity * Number(quantity)} {item.Child.uom.symbol}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} align="center">Seleccione una plantilla para ver los materiales.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
          
          {/* Alertas */}
          <Box sx={{ mt: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AssemblyPage;