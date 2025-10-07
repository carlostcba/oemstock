import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import * as api from '../services/api';

interface BomEntry {
  child_item_id: number;
  quantity: number;
}

const CatalogPage: React.FC = () => {
  // Estados para items
  const [items, setItems] = useState<api.Item[]>([]);
  const [elements, setElements] = useState<api.Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para el modal
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<api.Item | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    type: 'ELEMENT' as 'ELEMENT' | 'KIT' | 'PRODUCT',
    uom_id: 1,
    notes: ''
  });

  // Estados para el BOM
  const [bom, setBom] = useState<BomEntry[]>([]);
  const [newBomItem, setNewBomItem] = useState({ child_item_id: 0, quantity: 1 });

  // Cargar datos al montar
  useEffect(() => {
    fetchItems();
    fetchElements();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await api.getAllItems();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar items');
    } finally {
      setLoading(false);
    }
  };

  const fetchElements = async () => {
    try {
      const data = await api.getElements();
      setElements(data);
    } catch (err: any) {
      console.error('Error al cargar elementos:', err);
    }
  };

  const handleOpenDialog = async (item?: api.Item) => {
    if (item) {
      // Modo edicion
      setEditingItem(item);
      setFormData({
        sku: item.sku,
        name: item.name,
        type: item.type,
        uom_id: item.uom_id,
        notes: item.notes || ''
      });
      
      // Cargar BOM si es KIT o PRODUCT
      if (item.type === 'KIT' || item.type === 'PRODUCT') {
        try {
          const bomData = await api.getBom(item.id);
          const bomEntries: BomEntry[] = bomData.map(b => ({
            child_item_id: b.child_item_id,
            quantity: b.quantity
          }));
          setBom(bomEntries);
        } catch (err) {
          console.error('Error al cargar BOM:', err);
          setBom([]);
        }
      } else {
        setBom([]);
      }
    } else {
      // Modo creacion
      setEditingItem(null);
      setFormData({
        sku: '',
        name: '',
        type: 'ELEMENT',
        uom_id: 1,
        notes: ''
      });
      setBom([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setBom([]);
    setNewBomItem({ child_item_id: 0, quantity: 1 });
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddBomItem = () => {
    if (newBomItem.child_item_id && newBomItem.quantity > 0) {
      setBom(prev => [...prev, newBomItem]);
      setNewBomItem({ child_item_id: 0, quantity: 1 });
    }
  };

  const handleRemoveBomItem = (index: number) => {
    setBom(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!formData.sku || !formData.name) {
      setError('SKU y Nombre son campos obligatorios');
      return;
    }

    if ((formData.type === 'KIT' || formData.type === 'PRODUCT') && bom.length === 0) {
      setError('Un KIT o PRODUCT debe tener al menos un componente en su BOM');
      return;
    }

    try {
      setSubmitting(true);

      const itemData: api.ItemInput = {
        sku: formData.sku,
        name: formData.name,
        type: formData.type,
        uom_id: formData.uom_id,
        notes: formData.notes || undefined,
        bom: (formData.type === 'KIT' || formData.type === 'PRODUCT') ? bom : undefined
      };

      if (editingItem) {
        const response = await api.updateItem(editingItem.id, itemData);
        setSuccess(response.message);
      } else {
        const response = await api.createItem(itemData);
        setSuccess(response.message);
      }

      handleCloseDialog();
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Esta seguro de que desea desactivar este item?')) {
      return;
    }

    try {
      const response = await api.deleteItem(id);
      setSuccess(response.message);
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el item');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      ELEMENT: 'Elemento',
      KIT: 'Kit',
      PRODUCT: 'Producto'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" } = {
      ELEMENT: 'default',
      KIT: 'primary',
      PRODUCT: 'secondary'
    };
    return colors[type] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Catalogo de Items
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          ANADIR ITEM
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>SKU</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Unidad</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay items para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getTypeLabel(item.type)} 
                        color={getTypeColor(item.type)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{item.uom?.name || 'Unidad'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.active ? 'Activo' : 'Inactivo'} 
                        color={item.active ? 'success' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="primary" 
                        size="small"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        size="small"
                        onClick={() => handleDelete(item.id)}
                        disabled={!item.active}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para Crear/Editar Item */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Editar Item' : 'Crear Nuevo Item'}
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={(e) => handleFormChange('sku', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo"
                  onChange={(e: SelectChangeEvent) => handleFormChange('type', e.target.value)}
                >
                  <MenuItem value="ELEMENT">Elemento Base</MenuItem>
                  <MenuItem value="KIT">Kit</MenuItem>
                  <MenuItem value="PRODUCT">Producto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Unidad de Medida</InputLabel>
                <Select
                  value={formData.uom_id}
                  label="Unidad de Medida"
                  onChange={(e: SelectChangeEvent<number>) => handleFormChange('uom_id', e.target.value)}
                >
                  <MenuItem value={1}>Unidad</MenuItem>
                  <MenuItem value={2}>Kilogramo</MenuItem>
                  <MenuItem value={3}>Metro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas (Opcional)"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
              />
            </Grid>

            {/* BOM Section */}
            {(formData.type === 'KIT' || formData.type === 'PRODUCT') && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Lista de Materiales (BOM)
                  </Typography>
                </Grid>
                <Grid item xs={12} md={8}>
                  <FormControl fullWidth>
                    <InputLabel>Componente</InputLabel>
                    <Select
                      value={newBomItem.child_item_id}
                      label="Componente"
                      onChange={(e: SelectChangeEvent<number>) => 
                        setNewBomItem(prev => ({ ...prev, child_item_id: Number(e.target.value) }))
                      }
                    >
                      <MenuItem value={0}>Seleccionar...</MenuItem>
                      {elements.map((el) => (
                        <MenuItem key={el.id} value={el.id}>
                          {el.name} ({el.sku})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    type="number"
                    value={newBomItem.quantity}
                    onChange={(e) => 
                      setNewBomItem(prev => ({ ...prev, quantity: Number(e.target.value) }))
                    }
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ height: '56px' }}
                    onClick={handleAddBomItem}
                  >
                    <AddIcon />
                  </Button>
                </Grid>

                {/* Lista de componentes agregados */}
                {bom.length > 0 && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Componentes:
                      </Typography>
                      {bom.map((item, index) => {
                        const element = elements.find(el => el.id === item.child_item_id);
                        return (
                          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography>
                              {element?.name || `ID: ${item.child_item_id}`} - Cantidad: {item.quantity}
                            </Typography>
                            <IconButton size="small" color="error" onClick={() => handleRemoveBomItem(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Paper>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : editingItem ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CatalogPage;