import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Divider, List, ListItem, ListItemText, ListItemButton,
  AppBar, Toolbar, Button, Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

const ClinicalWorkspace = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [selectedProblem, setSelectedProblem] = useState<number | null>(null);

  // Fetch Patient
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => (await api.get(`/patients/${patientId}`)).data,
    enabled: !!patientId,
  });

  // Fetch Problems
  const { data: problems } = useQuery({
    queryKey: ['problems', patientId],
    queryFn: async () => (await api.get(`/problems/patient/${patientId}`)).data,
    enabled: !!patientId,
  });

  // Fetch Evolutions for selected problem
  const { data: evolutions } = useQuery({
    queryKey: ['evolutions', selectedProblem],
    queryFn: async () => (await api.get(`/evolutions/problem/${selectedProblem}`)).data,
    enabled: !!selectedProblem,
  });

  const activeProblems = problems?.filter((p: any) => p.estado === 'activo') || [];
  const inactiveProblems = problems?.filter((p: any) => p.estado === 'inactivo') || [];

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            POMR EHR - Historia Clínica
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Volver al Dashboard</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Panel: Context & Problems */}
        <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper', overflowY: 'auto' }}>
          <Box p={2}>
            <Typography variant="h6" fontWeight="bold">
              {patient?.apellido}, {patient?.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              DNI: {patient?.documento} | Sexo: {patient?.sexo}
            </Typography>
          </Box>
          <Divider />

          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight="bold">Problemas Activos</Typography>
              <Button size="small" variant="text">+ Añadir</Button>
            </Box>
            <List disablePadding>
              {activeProblems.map((p: any) => (
                <ListItem key={p.id} disablePadding>
                  <ListItemButton 
                    selected={selectedProblem === p.id}
                    onClick={() => setSelectedProblem(p.id)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText primary={p.description} />
                  </ListItemButton>
                </ListItem>
              ))}
              {activeProblems.length === 0 && (
                <Typography variant="body2" color="text.secondary">No hay problemas activos.</Typography>
              )}
            </List>
          </Box>

          <Divider />
          <Box p={2}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>Problemas Inactivos</Typography>
            <List disablePadding>
              {inactiveProblems.map((p: any) => (
                <ListItem key={p.id} disablePadding>
                  <ListItemButton 
                    selected={selectedProblem === p.id}
                    onClick={() => setSelectedProblem(p.id)}
                    sx={{ borderRadius: 1, mb: 0.5, opacity: 0.7 }}
                  >
                    <ListItemText primary={p.description} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>

        {/* Main Panel: Evolutions & Details */}
        <Box sx={{ flexGrow: 1, bgcolor: '#f4f6f8', p: 3, overflowY: 'auto' }}>
          {selectedProblem ? (
            <>
              <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
                <Typography variant="h5" fontWeight="bold" mb={1}>
                  {problems?.find((p: any) => p.id === selectedProblem)?.description}
                </Typography>
                <Chip 
                  label={problems?.find((p: any) => p.id === selectedProblem)?.estado.toUpperCase()} 
                  color={problems?.find((p: any) => p.id === selectedProblem)?.estado === 'activo' ? 'primary' : 'default'}
                  size="small"
                />
              </Paper>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">Evoluciones</Typography>
                <Button variant="contained" disableElevation>Nueva Evolución</Button>
              </Box>

              {evolutions?.map((evo: any) => (
                <Paper key={evo.id} sx={{ p: 3, mb: 2 }} elevation={1}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    {new Date(evo.fecha).toLocaleString()} - Autor ID: {evo.autor_id}
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {evo.texto_clinico}
                  </Typography>
                </Paper>
              ))}
              {evolutions?.length === 0 && (
                <Typography variant="body1" color="text.secondary">No hay evoluciones registradas para este problema.</Typography>
              )}
            </>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography variant="h6" color="text.secondary">
                Seleccione un problema para ver sus evoluciones
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ClinicalWorkspace;
