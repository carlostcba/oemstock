import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import * as api from '../services/api';

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  items: api.AssemblyInstance[];
}

interface KanbanBoardProps {
  assemblies: api.AssemblyInstance[];
  userRole: 'OPERARIO' | 'SUPERVISOR' | 'ADMINISTRADOR';
  onRefresh: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ assemblies, userRole, onRefresh }) => {
  const [selectedAssembly, setSelectedAssembly] = useState<api.AssemblyInstance | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Definir columnas segun el rol
  const getColumns = (): KanbanColumn[] => {
    const allColumns: KanbanColumn[] = [
      { id: 'BACKLOG', title: 'Backlog', color: '#9e9e9e', items: [] },
      { id: 'TODO', title: 'To Do', color: '#2196f3', items: [] },
      { id: 'IN_PROGRESS', title: 'In Progress', color: '#ff9800', items: [] },
      { id: 'TO_VERIFY', title: 'To Verify', color: '#9c27b0', items: [] },
      { id: 'DONE', title: 'Done', color: '#4caf50', items: [] }
    ];

    // Filtrar columnas segun el rol
    if (userRole === 'OPERARIO') {
      return allColumns.filter(col => ['TODO', 'IN_PROGRESS', 'TO_VERIFY'].includes(col.id));
    }

    return allColumns;
  };

  const columns = getColumns();

  // Distribuir assemblies en columnas
  columns.forEach(column => {
    column.items = assemblies.filter(assembly => assembly.status === column.id);
  });

  const handleCardClick = (assembly: api.AssemblyInstance, targetStatus: string) => {
    setSelectedAssembly(assembly);
    setNewStatus(targetStatus);
    setNotes('');
    setOpenDialog(true);
  };

  const handleStatusChange = async () => {
    if (!selectedAssembly) return;

    try {
      const response = await fetch(`http://localhost:3001/api/stock/assemblies/${selectedAssembly.id}/change-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          status: newStatus,  // ✅ Cambiado de "newStatus" a "status"
          notes: notes || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      setSuccess('Estado actualizado exitosamente');
      setOpenDialog(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado');
    }
  };

  const getStatusActions = (assembly: api.AssemblyInstance) => {
    const transitions: { [key: string]: { label: string; status: string; color: any }[] } = {
      'BACKLOG': [
        { label: 'Mover a To Do', status: 'TODO', color: 'primary' }
      ],
      'TODO': [
        { label: 'Iniciar', status: 'IN_PROGRESS', color: 'warning' }
      ],
      'IN_PROGRESS': [
        { label: 'Completar', status: 'TO_VERIFY', color: 'secondary' }
      ],
      'TO_VERIFY': [
        { label: 'Verificar y Aprobar', status: 'DONE', color: 'success' }
      ]
    };

    const actions = transitions[assembly.status] || [];

    // Operario no puede aprobar (mover a DONE)
    if (userRole === 'OPERARIO') {
      return actions.filter(action => action.status !== 'DONE');
    }

    return actions;
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
        {columns.map(column => (
          <Paper
            key={column.id}
            sx={{
              minWidth: 300,
              maxWidth: 300,
              bgcolor: '#f5f5f5',
              p: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: column.color,
                  mr: 1
                }}
              />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {column.title}
              </Typography>
              <Chip label={column.items.length} size="small" />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {column.items.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No hay items
                </Typography>
              ) : (
                column.items.map(assembly => (
                  <Card key={assembly.id} sx={{ cursor: 'pointer' }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {assembly.Template?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        SKU: {assembly.Template?.sku}
                      </Typography>
                      <Typography variant="body2">
                        Cantidad: <strong>{assembly.quantity}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sitio: {assembly.Site?.name}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Creado: {formatDateTime(assembly.createdAt)}
                      </Typography>
                      {assembly.completed_at && (
                        <Typography variant="caption" display="block">
                          Completado: {formatDateTime(assembly.completed_at)}
                        </Typography>
                      )}
                      <Typography variant="caption" display="block" color="text.secondary">
                        Por: {assembly.Creator?.firstName} {assembly.Creator?.lastName}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ pt: 0, flexWrap: 'wrap', gap: 0.5 }}>
                      {getStatusActions(assembly).map(action => (
                        <Button
                          key={action.status}
                          size="small"
                          variant="contained"
                          color={action.color}
                          onClick={() => handleCardClick(assembly, action.status)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </CardActions>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Dialog de Confirmacion */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Desea cambiar el estado de <strong>{selectedAssembly?.Template?.name}</strong> a <strong>{newStatus}</strong>?
          </Typography>
          <TextField
            fullWidth
            label="Notas (Opcional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleStatusChange}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KanbanBoard;