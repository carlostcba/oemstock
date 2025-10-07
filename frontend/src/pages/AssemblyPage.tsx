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
  SelectChangeEvent,
  Chip,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import * as api from '../services/api';
import ReusableTable, { Column } from '../components/ReusableTable';

const bomColumns: Column<api.BomItem>[] = [
  { id: 'child_item_id', label: 'ID Componente', minWidth: 120 },
  {
    id: 'Child',
    label: 'Nombre Componente',
    minWidth: 250,
    render: (row: api.BomItem) => row.Child.name,
  },
  { id: 'quantity', label: 'Cantidad Requerida', minWidth: 150 },
];

const AssemblyPage: React.FC = () => {
  // Estados para crear nuevo ensamblado
  const [templates, setTemplates] = useState<api.Item[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [bom, setBom] = useState<api.BomItem[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Estados para listar instancias
  const [assemblies, setAssemblies] = useState<api.AssemblyInstance[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Estados para la UI
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [loadingBom, setLoadingBom] = useState<boolean>(false);
  const [loadingAssemblies, setLoadingAssemblies] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar plantillas al montar
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Cargar instancias al montar y cuando cambie el filtro
  useEffect(() => {
    fetchAssemblies();
  }, [filterStatus]);

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

  const fetchAssemblies = async () => {
    try {
      setLoadingAssemblies(true);
      const data = await api.getAssemblies(filterStatus || undefined);
      setAssemblies(data);
    } catch (err: any) {
      console.error('Error al cargar instancias:', err);
    } finally {
      setLoadingAssemblies(false);
    }
  };

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTemplate || quantity <= 0) {
      setError('Por favor, seleccione una plantilla y una cantidad valida.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: api.AssemblyPayload = {
        templateId: Number(selectedTemplate),
        quantity,
        siteId: 1, // TODO: Agregar selector de sitio
        notes: notes || undefined
      };
      const response = await api.createAssembly(payload);
      setSuccess(response.message);
      
      // Limpiar formulario
      setSelectedTemplate('');
      setBom([]);
      setQuantity(1);
      setNotes('');
      
      // Recargar instancias
      fetchAssemblies();
    } catch (err: any) {
      setError(err.message || 'Ocurrio un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteAssembly = async (id: number) => {
    try {
      const response = await api.completeAssembly(id);
      setSuccess(response.message);
      fetchAssemblies();
    } catch (err: any) {
      setError(err.message || 'Error al completar el ensamblado.');
    }
  };

  const handleCancelAssembly = async (id: number) => {
    try {
      const response = await api.cancelAssembly(id);
      setSuccess(response.message);
      fetchAssemblies();
    } catch (err: any) {
      setError(err.message || 'Error al cancelar el ensamblado.');
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      RESERVADO: { color: 'warning' as const, label: 'Reservado' },
      ENSAMBLADO: { color: 'success' as const, label: 'Ensamblado' },
      CANCELADO: { color: 'error' as const, label: 'Cancelado' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default' as const, label: status };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestion de Ensamblado
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Formulario para crear nuevo ensamblado */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Crear Nuevo Ensamblado
        </Typography>
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
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Cantidad a Ensamblar"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                sx={{ height: '56px' }}
                disabled={submitting || !selectedTemplate}
              >
                {submitting ? <CircularProgress size={24} /> : 'Reservar Stock'}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas (Opcional)"
                multiline
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          </Grid>

          {loadingBom && <CircularProgress sx={{ mt: 2 }} />}
          {bom.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Lista de Materiales (BOM)</Typography>
              <ReusableTable columns={bomColumns} data={bom} />
            </Box>
          )}
        </Box>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Listado de instancias de ensamblado */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Instancias de Ensamblado
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por Estado</InputLabel>
            <Select
              value={filterStatus}
              label="Filtrar por Estado"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="RESERVADO">Reservado</MenuItem>
              <MenuItem value="ENSAMBLADO">Ensamblado</MenuItem>
              <MenuItem value="CANCELADO">Cancelado</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={fetchAssemblies} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {loadingAssemblies ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : assemblies.length === 0 ? (
        <Alert severity="info">No hay instancias de ensamblado para mostrar.</Alert>
      ) : (
        <Grid container spacing={2}>
          {assemblies.map((assembly) => (
            <Grid item xs={12} md={6} lg={4} key={assembly.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {assembly.Template?.name}
                    </Typography>
                    {getStatusChip(assembly.status)}
                  </Box>
                  <Typography color="text.secondary" gutterBottom>
                    SKU: {assembly.Template?.sku}
                  </Typography>
                  <Typography variant="body2">
                    Cantidad: <strong>{assembly.quantity}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Sitio: {assembly.Site?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Creado por: {assembly.Creator?.firstName} {assembly.Creator?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fecha: {new Date(assembly.createdAt).toLocaleDateString()}
                  </Typography>
                  {assembly.notes && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Notas: {assembly.notes}
                    </Typography>
                  )}
                </CardContent>
                {assembly.status === 'RESERVADO' && (
                  <CardActions>
                    <Button
                      size="small"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleCompleteAssembly(assembly.id)}
                    >
                      Completar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleCancelAssembly(assembly.id)}
                    >
                      Cancelar
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AssemblyPage;