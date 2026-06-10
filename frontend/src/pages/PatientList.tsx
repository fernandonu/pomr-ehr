import React, { useState } from 'react';
import {
  Box, Typography, Container, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, AppBar, Toolbar, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Snackbar, Alert, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Patient {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono?: string;
  apellido_materno?: string;
  federation_id?: string;
  federated_by?: number;
}

const PatientList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  const [newPatient, setNewPatient] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    fecha_nacimiento: '',
    sexo: '',
    telefono: '',
    apellido_materno: ''
  });
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({open: false, message: '', severity: 'info'});

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, logout } = useAuthStore();
  const canCreatePatient = role === 'superadmin' || role === 'administrativo';

  // Fetch patients
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.get<Patient[]>('/patients/');
      return res.data;
    }
  });

  const createPatientMutation = useMutation({
    mutationFn: async (patient: Omit<Patient, 'id'>) => {
      const res = await api.post('/patients/', patient);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsDialogOpen(false);
      setNewPatient({ nombre: '', apellido: '', documento: '', fecha_nacimiento: '', sexo: '', telefono: '', apellido_materno: '' });
    },
    onError: (error: unknown) => {
      console.error(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      const detail = err.response?.data?.detail;
      setSnackbar({ open: true, message: `Error al guardar: ${typeof detail === 'string' ? detail : JSON.stringify(detail) || err.message}`, severity: 'error' });
    }
  });

  const editPatientMutation = useMutation({
    mutationFn: async (patient: Omit<Patient, 'id'>) => {
      const res = await api.put(`/patients/${editingPatientId}`, patient);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsDialogOpen(false);
      setEditingPatientId(null);
      setNewPatient({ nombre: '', apellido: '', documento: '', fecha_nacimiento: '', sexo: '', telefono: '', apellido_materno: '' });
    },
    onError: (error: unknown) => {
      console.error(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      const detail = err.response?.data?.detail;
      setSnackbar({ open: true, message: `Error al guardar: ${typeof detail === 'string' ? detail : JSON.stringify(detail) || err.message}`, severity: 'error' });
    }
  });

  const federateMutation = useMutation({
    mutationFn: async (patientId: number) => {
      const res = await api.post(`/patients/${patientId}/federate`);
      return res.data;
    },
    onSuccess: (data) => {
      setSnackbar({ open: true, message: data.message || 'Operación exitosa', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (error: unknown) => {
      console.error(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      const detail = err.response?.data?.detail;
      setSnackbar({ open: true, message: `Error al federar: ${typeof detail === 'string' ? detail : JSON.stringify(detail) || err.message}`, severity: 'error' });
    }
  });

  const documentoExistente = patients?.some(
    p => p.documento === newPatient.documento && p.id !== editingPatientId
  );

  const handleSavePatient = () => {
    if (!newPatient.nombre || !newPatient.apellido || !newPatient.documento || !newPatient.fecha_nacimiento || !newPatient.sexo) {
      setSnackbar({ open: true, message: "Por favor completa todos los campos requeridos.", severity: 'error' });
      return;
    }
    
    if (documentoExistente) {
      setSnackbar({ open: true, message: "El documento ingresado ya se encuentra registrado en otro paciente.", severity: 'error' });
      return;
    }

    if (editingPatientId) {
      editPatientMutation.mutate(newPatient);
    } else {
      createPatientMutation.mutate(newPatient);
    }
  };

  const handleOpenNewPatient = () => {
    setEditingPatientId(null);
    setNewPatient({ nombre: '', apellido: '', documento: '', fecha_nacimiento: '', sexo: '', telefono: '', apellido_materno: '' });
    setIsDialogOpen(true);
  };

  const filteredPatients = patients?.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.documento.includes(searchTerm)
  ) || [];

  const paginatedPatients = filteredPatients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  const formatSexo = (sexo: string) => {
    if (sexo === 'M') return 'Masculino';
    if (sexo === 'F') return 'Femenino';
    if (sexo === 'X') return 'Otro';
    return sexo;
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Historia Clínica Electrónica
          </Typography>
          {role === 'superadmin' && (
            <Box sx={{ mr: 2 }}>
              <Button color="inherit" onClick={() => navigate('/api-logs')}>
                Logs de API
              </Button>
              <Button color="inherit" onClick={() => navigate('/users')}>
                Gestión de Usuarios
              </Button>
              <Button color="inherit" onClick={() => navigate('/settings')}>
                Configuración
              </Button>
            </Box>
          )}
          <Button color="inherit" onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ mt: 4, mb: 4, flexGrow: 1, px: { xs: 2, sm: 4, md: 6 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Pacientes
          </Typography>
          {canCreatePatient && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              disableElevation
              onClick={handleOpenNewPatient}
            >
              Nuevo Paciente
            </Button>
          )}
        </Box>

        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }} elevation={1}>
          <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
          <TextField
            fullWidth
            variant="standard"
            placeholder="Buscar por nombre, apellido o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ disableUnderline: true }}
          />
        </Paper>

        <Paper elevation={1} sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="pacientes table">
            <TableHead sx={{ backgroundColor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Documento</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha Nacimiento</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sexo</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} align="center">Cargando...</TableCell></TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No se encontraron pacientes</TableCell></TableRow>
              ) : (
                paginatedPatients.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f5f5f5' } }}
                  >
                    <TableCell component="th" scope="row">{row.id}</TableCell>
                    <TableCell>
                      {row.apellido}, {row.nombre}
                      {row.federation_id && (
                        <Tooltip title={`Federado (ID: ${row.federation_id})`}>
                          <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>{row.documento}</TableCell>
                    <TableCell>{formatDate(row.fecha_nacimiento)}</TableCell>
                    <TableCell>{formatSexo(row.sexo)}</TableCell>
                    <TableCell align="right">
                      {canCreatePatient && (
                        <IconButton
                          color="primary"
                          aria-label="editar paciente"
                          onClick={() => {
                            setEditingPatientId(row.id);
                            setNewPatient({
                              nombre: row.nombre,
                              apellido: row.apellido,
                              apellido_materno: row.apellido_materno || '',
                              documento: row.documento,
                              fecha_nacimiento: row.fecha_nacimiento,
                              sexo: row.sexo,
                              telefono: row.telefono || ''
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      <IconButton
                        color="primary"
                        aria-label="ver historia clinica"
                        onClick={() => navigate(`/patient/${row.id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <Tooltip title={row.federation_id ? "Sincronizar datos" : "Federar paciente"}>
                        <IconButton
                          color={row.federation_id ? "success" : "secondary"}
                          aria-label="federar paciente"
                          onClick={() => federateMutation.mutate(row.id)}
                          disabled={federateMutation.isPending}
                        >
                          <CloudSyncIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPatients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
        </Paper>
      </Container>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingPatientId ? 'Editar Paciente' : 'Nuevo Paciente'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={1} mt={1} mb={1}>
            <TextField
              fullWidth
              margin="dense"
              label="Nombre"
              value={newPatient.nombre}
              onChange={(e) => setNewPatient({ ...newPatient, nombre: e.target.value })}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Apellido"
              value={newPatient.apellido}
              onChange={(e) => setNewPatient({ ...newPatient, apellido: e.target.value })}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Apellido Materno"
              value={newPatient.apellido_materno}
              onChange={(e) => setNewPatient({ ...newPatient, apellido_materno: e.target.value })}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Documento"
              value={newPatient.documento}
              onChange={(e) => setNewPatient({ ...newPatient, documento: e.target.value })}
              error={!!documentoExistente && !!newPatient.documento}
              helperText={!!documentoExistente && !!newPatient.documento ? "Este documento ya se encuentra registrado" : ""}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Fecha de Nacimiento"
              type={newPatient.fecha_nacimiento ? "date" : "text"}
              onFocus={(e) => { (e.target as HTMLInputElement).type = 'date'; }}
              onBlur={(e) => {
                if (!newPatient.fecha_nacimiento) {
                  (e.target as HTMLInputElement).type = 'text';
                }
              }}
              value={newPatient.fecha_nacimiento}
              onChange={(e) => setNewPatient({ ...newPatient, fecha_nacimiento: e.target.value })}
              onKeyDown={(e) => e.preventDefault()}
              onClick={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.type !== 'date') {
                  target.type = 'date';
                }
                if (target.showPicker) {
                  setTimeout(() => target.showPicker(), 50);
                }
              }}
            />
            <TextField
              fullWidth
              margin="dense"
              select
              label="Sexo"
              value={newPatient.sexo}
              onChange={(e) => setNewPatient({ ...newPatient, sexo: e.target.value })}
            >
              <MenuItem value="M">Masculino</MenuItem>
              <MenuItem value="F">Femenino</MenuItem>
              <MenuItem value="X">Otro</MenuItem>
            </TextField>
            <TextField
              fullWidth
              margin="dense"
              label="Teléfono"
              value={newPatient.telefono}
              onChange={(e) => setNewPatient({ ...newPatient, telefono: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSavePatient}
            disabled={createPatientMutation.isPending || editPatientMutation.isPending}
          >
            {createPatientMutation.isPending || editPatientMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientList;
