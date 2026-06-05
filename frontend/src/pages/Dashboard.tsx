import React, { useState } from 'react';
import { 
  Box, Typography, Container, Paper, TextField, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, AppBar, Toolbar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

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
  const navigate = useNavigate();

  // Fetch patients
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.get<Patient[]>('/patients/');
      return res.data;
    }
  });

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
          <Button color="inherit">Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Pacientes
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<PersonAddIcon />}
            disableElevation
          >
            Nuevo Paciente
          </Button>
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
    </Box>
  );
};

export default Dashboard;
