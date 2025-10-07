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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Grid,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import * as api from '../services/api';

interface Stock {
  id: number;
  itemId: number;
  siteId: number;
  on_hand: number;
  reserved: number;
  Item?: api.Item;
  Site?: {
    id: number;
    name: string;
  };
}

const StockPage: React.FC = () => {
  const [stock, setStock] = useState<Stock[]>([]);
  const [elements, setElements] = useState<api.Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados del modal
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    itemId: 0,
    siteId: 1,
    quantity: 0,
    adjustment_type: 'ENTRADA' as 'ENTRADA' | 'SALIDA' | 'AJUSTE',
    notes: ''
  });

  useEffect(() => {
    fetchStock();
    fetchElements();
  }, []);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/stock', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setStock(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el stock');
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

  const handleOpenDialog = () => {
    setFormData({
      itemId: 0,
      siteId: 1,
      quantity: 0,
      adjustment_type: 'ENTRADA',
      notes: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!formData.itemId || formData.quantity <= 0) {
      setError('Selecciona un item y una cantidad valida');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('http://localhost:3001/api/stock/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al ajustar stock');
      }

      const data = await response.json();
      setSuccess(data.message);
      handleCloseDialog();
      fetchStock();
    } catch (err: any) {
      setError(err.message || 'Error al ajustar el stock');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableStock = (item: Stock) => {
    return item.on_hand - item.reserved;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestion de Stock
        </Typography>
        <Box>
          <IconButton onClick={fetchStock} color="primary">
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{ ml: 1 }}
          >
            AJUSTAR STOCK
          </Button>
        </Box>
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
                <TableCell><strong>Item</strong></TableCell>
                <TableCell><strong>Sitio</strong></TableCell>
                <TableCell align="right"><strong>Stock Fisico</strong></TableCell>
                <TableCell align="right"><strong>Reservado</strong></TableCell>
                <TableCell align="right"><strong>Disponible</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay registros de stock
                  </TableCell>
                </TableRow>
              ) : (
                stock.map((item) => {
                  const available = getAvailableStock(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.Item?.sku}</TableCell>
                      <TableCell>{item.Item?.name}</TableCell>
                      <TableCell>{item.Site?.name}</TableCell>
                      <TableCell align="right">{item.on_hand}</TableCell>
                      <TableCell align="right">{item.reserved}</TableCell>
                      <TableCell align="right"><strong>{available}</strong></TableCell>
                      <TableCell>
                        <Chip 
                          label={available > 0 ? 'Disponible' : 'Sin Stock'} 
                          color={available > 0 ? 'success' : 'error'} 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para Ajustar Stock */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Ajustar Stock
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Elemento Base</InputLabel>
                <Select
                  value={formData.itemId}
                  label="Elemento Base"
                  onChange={(e: SelectChangeEvent<number>) => handleFormChange('itemId', Number(e.target.value))}
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
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Sitio</InputLabel>
                <Select
                  value={formData.siteId}
                  label="Sitio"
                  onChange={(e: SelectChangeEvent<number>) => handleFormChange('siteId', Number(e.target.value))}
                >
                  <MenuItem value={1}>Alberti</MenuItem>
                  <MenuItem value={2}>Delviso</MenuItem>
                  <MenuItem value={3}>Casa Matriz</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Ajuste</InputLabel>
                <Select
                  value={formData.adjustment_type}
                  label="Tipo de Ajuste"
                  onChange={(e: SelectChangeEvent) => handleFormChange('adjustment_type', e.target.value)}
                >
                  <MenuItem value="ENTRADA">Entrada (Agregar)</MenuItem>
                  <MenuItem value="SALIDA">Salida (Quitar)</MenuItem>
                  <MenuItem value="AJUSTE">Ajuste (Correccion)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleFormChange('quantity', Number(e.target.value))}
                InputProps={{ inputProps: { min: 1 } }}
              />
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Ajustar Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockPage;