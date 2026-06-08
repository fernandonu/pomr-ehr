import React, { useState } from 'react';
import {
  Box, Typography, Container, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, AppBar, Toolbar, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
}

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    fecha_nacimiento: '',
    sexo: ''
  });

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
      setNewPatient({ nombre: '', apellido: '', documento: '', fecha_nacimiento: '', sexo: '' });
    },
    onError: (error: any) => {
      console.error(error);
      const detail = error.response?.data?.detail;
      alert(`Error al guardar: ${typeof detail === 'string' ? detail : JSON.stringify(detail) || error.message}`);
    }
  });

  const handleCreatePatient = () => {
    if (!newPatient.nombre || !newPatient.apellido || !newPatient.documento || !newPatient.fecha_nacimiento || !newPatient.sexo) {
      alert("Por favor completa todos los campos requeridos.");
      return;
    }
    createPatientMutation.mutate(newPatient);
  };

  const filteredPatients = patients?.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.documento.includes(searchTerm)
  ) || [];

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            POMR EHR
          </Typography>
          {role === 'superadmin' && (
            <Button color="inherit" onClick={() => navigate('/users')} sx={{ mr: 2 }}>
              Gestión de Usuarios
            </Button>
          )}
          <Button color="inherit" onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
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
              onClick={() => setIsDialogOpen(true)}
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

        <TableContainer component={Paper} elevation={1}>
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
                filteredPatients.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f5f5f5' } }}
                  >
                    <TableCell component="th" scope="row">{row.id}</TableCell>
                    <TableCell>{row.apellido}, {row.nombre}</TableCell>
                    <TableCell>{row.documento}</TableCell>
                    <TableCell>{row.fecha_nacimiento}</TableCell>
                    <TableCell>{row.sexo}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        aria-label="ver historia clinica"
                        onClick={() => navigate(`/patient/${row.id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Paciente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={newPatient.nombre}
                onChange={(e) => setNewPatient({ ...newPatient, nombre: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={newPatient.apellido}
                onChange={(e) => setNewPatient({ ...newPatient, apellido: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Documento"
                value={newPatient.documento}
                onChange={(e) => setNewPatient({ ...newPatient, documento: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newPatient.fecha_nacimiento}
                onChange={(e) => setNewPatient({ ...newPatient, fecha_nacimiento: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Sexo"
                value={newPatient.sexo}
                onChange={(e) => setNewPatient({ ...newPatient, sexo: e.target.value })}
              >
                <MenuItem value="M">Masculino</MenuItem>
                <MenuItem value="F">Femenino</MenuItem>
                <MenuItem value="X">Otro</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreatePatient}
            disabled={createPatientMutation.isPending}
          >
            {createPatientMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
