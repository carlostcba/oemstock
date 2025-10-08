// frontend/src/pages/AssemblyPage.tsx

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
  Tabs,
  Tab
} from '@mui/material';
import * as api from '../services/api';
import KanbanBoard from '../components/KanbanBoard';

const AssemblyPage: React.FC = () => {
  // Estados para datos
  const [templates, setTemplates] = useState<api.Item[]>([]);
  const [users, setUsers] = useState<api.User[]>([]);
  const [sites, setSites] = useState<api.Site[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Estados para instancias
  const [assemblies, setAssemblies] = useState<api.AssemblyInstance[]>([]);
  
  // Estados para la UI
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [loadingSites, setLoadingSites] = useState<boolean>(true);
  const [loadingAssemblies, setLoadingAssemblies] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Detectar rol del usuario
  const [userRole] = useState<'OPERARIO' | 'SUPERVISOR' | 'ADMINISTRADOR'>('ADMINISTRADOR');
  const [activeTab, setActiveTab] = useState(0);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchTemplates();
    fetchUsers();
    fetchSites();
    fetchAssemblies();
  }, []);

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

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSites = async () => {
    try {
      setLoadingSites(true);
      const data = await api.getAllSites();
      setSites(data);
    } catch (err: any) {
      console.error('Error al cargar sitios:', err);
    } finally {
      setLoadingSites(false);
    }
  };

  const fetchAssemblies = async () => {
    try {
      setLoadingAssemblies(true);
      const data = await api.getAssemblies();
      setAssemblies(data);
    } catch (err: any) {
      console.error('Error al cargar instancias:', err);
    } finally {
      setLoadingAssemblies(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTemplate || quantity <= 0 || !selectedSite) {
      setError('Por favor, complete todos los campos requeridos.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: api.AssemblyPayload = {
        templateId: Number(selectedTemplate),
        quantity,
        siteId: Number(selectedSite),
        assignedTo: assignedTo ? Number(assignedTo) : undefined,
        notes: notes || undefined
      };
      
      const response = await api.createAssembly(payload);
      setSuccess(response.message);
      
      // Limpiar formulario
      setSelectedTemplate('');
      setQuantity(1);
      setSelectedSite('');
      setAssignedTo('');
      setNotes('');
      
      // Recargar instancias
      fetchAssemblies();
    } catch (err: any) {
      // Mostrar error con detalles de stock insuficiente
      if (err.message.includes('Stock insuficiente')) {
        const errorResponse = JSON.parse(err.message.split(': ')[1] || '{}');
        if (errorResponse.insufficientComponents) {
          const componentsList = errorResponse.insufficientComponents
            .map((c: any) => `${c.name} (${c.sku}): necesita ${c.required}, disponible ${c.available}`)
            .join('; ');
          setError(`Stock insuficiente: ${componentsList}`);
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message || 'Ocurrio un error inesperado.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canCreateAssembly = userRole === 'ADMINISTRADOR' || userRole === 'SUPERVISOR';

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestion de Ensamblado
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Tablero Kanban" />
        {canCreateAssembly && <Tab label="Crear Ensamblado" />}
      </Tabs>

      {/* Tab 1: Tablero Kanban */}
      {activeTab === 0 && (
        <Box>
          {loadingAssemblies ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <KanbanBoard 
              assemblies={assemblies} 
              userRole={userRole}
              onRefresh={fetchAssemblies}
            />
          )}
        </Box>
      )}

      {/* Tab 2: Crear Nuevo Ensamblado */}
      {activeTab === 1 && canCreateAssembly && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Crear Nuevo Ensamblado
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={loadingTemplates}>
                  <InputLabel id="template-select-label">Plantilla de Producto/Kit *</InputLabel>
                  <Select
                    labelId="template-select-label"
                    value={selectedTemplate}
                    label="Plantilla de Producto/Kit *"
                    onChange={(e) => setSelectedTemplate(e.target.value)}
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
                <FormControl fullWidth disabled={loadingSites}>
                  <InputLabel id="site-select-label">Sitio *</InputLabel>
                  <Select
                    labelId="site-select-label"
                    value={selectedSite}
                    label="Sitio *"
                    onChange={(e) => setSelectedSite(e.target.value)}
                  >
                    {sites.map((site) => (
                      <MenuItem key={site.id} value={site.id}>
                        {site.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Cantidad a Ensamblar *"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth disabled={loadingUsers}>
                  <InputLabel id="assigned-select-label">Asignar a (Opcional)</InputLabel>
                  <Select
                    labelId="assigned-select-label"
                    value={assignedTo}
                    label="Asignar a (Opcional)"
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Sin asignar</em>
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  fullWidth 
                  sx={{ height: '56px' }}
                  disabled={submitting || !selectedTemplate || !selectedSite}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Crear Solicitud'}
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
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AssemblyPage;