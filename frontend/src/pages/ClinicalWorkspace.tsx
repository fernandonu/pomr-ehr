import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Divider, List, ListItem, ListItemText, ListItemButton,
  AppBar, Toolbar, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tabs, Tab, IconButton, CircularProgress
} from '@mui/material';
import { SnomedAutocomplete } from '../components/SnomedAutocomplete';
import EditIcon from '@mui/icons-material/Edit';
import { AllergiesTab } from '../components/records/AllergiesTab';
import { MedicationsTab } from '../components/records/MedicationsTab';
import { VaccinesTab } from '../components/records/VaccinesTab';
import { LabsTab } from '../components/records/LabsTab';
import { ProceduresTab } from '../components/records/ProceduresTab';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import ErrorBoundary from '../components/ErrorBoundary';

const ClinicalWorkspace = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const canEditClinic = role === 'superadmin' || role === 'equipo_sanitario';

  const [selectedProblem, setSelectedProblem] = useState<number | null>(null);
  const [openAddProblem, setOpenAddProblem] = useState(false);
  const [newProblemDesc, setNewProblemDesc] = useState('');
  const [newProblemCode, setNewProblemCode] = useState('');
  const [openAddEvol, setOpenAddEvol] = useState(false);
  const [openEditEvol, setOpenEditEvol] = useState(false);
  const [editEvolId, setEditEvolId] = useState<number | null>(null);
  const [editMotivo, setEditMotivo] = useState('');

  const [newEvolText, setNewEvolText] = useState('');
  const [newEvolVitals, setNewEvolVitals] = useState({ peso_kg: '', talla_cm: '', perimetro_cefalico_cm: '', tension_arterial: '' });
  const [currentTab, setCurrentTab] = useState(0);

  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const diffMs = Date.now() - new Date(dob).getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  // Fetch Clinical Records (Allergies, Meds, etc)
  const { data: records } = useQuery({
    queryKey: ['records', patientId],
    queryFn: async () => (await api.get(`/records/patient/${patientId}`)).data,
    enabled: !!patientId,
  });

  const addProblemMutation = useMutation({
    mutationFn: async (desc: string) => {
      return await api.post('/problems/', {
        paciente_id: Number(patientId),
        snomed_concept_id: newProblemCode || "00000",
        description: desc,
        estado: 'activo'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems', patientId] });
      setOpenAddProblem(false);
      setNewProblemDesc('');
      setNewProblemCode('');
    }
  });

  const addEvolutionMutation = useMutation({
    mutationFn: async (text: string) => {
      return await api.post('/evolutions/', {
        paciente_id: Number(patientId),
        problema_id: selectedProblem,
        texto_clinico: text,
        peso_kg: newEvolVitals.peso_kg ? Number(newEvolVitals.peso_kg) : null,
        talla_cm: newEvolVitals.talla_cm ? Number(newEvolVitals.talla_cm) : null,
        perimetro_cefalico_cm: newEvolVitals.perimetro_cefalico_cm ? Number(newEvolVitals.perimetro_cefalico_cm) : null,
        tension_arterial: newEvolVitals.tension_arterial || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolutions', selectedProblem] });
      setOpenAddEvol(false);
      setNewEvolText('');
      setNewEvolVitals({ peso_kg: '', talla_cm: '', perimetro_cefalico_cm: '', tension_arterial: '' });
    }
  });

  const editEvolutionMutation = useMutation({
    mutationFn: async () => {
      return await api.put(`/evolutions/${editEvolId}`, {
        texto_clinico: newEvolText,
        motivo_edicion: editMotivo,
        peso_kg: newEvolVitals.peso_kg ? Number(newEvolVitals.peso_kg) : null,
        talla_cm: newEvolVitals.talla_cm ? Number(newEvolVitals.talla_cm) : null,
        perimetro_cefalico_cm: newEvolVitals.perimetro_cefalico_cm ? Number(newEvolVitals.perimetro_cefalico_cm) : null,
        tension_arterial: newEvolVitals.tension_arterial || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolutions', selectedProblem] });
      setOpenEditEvol(false);
      setNewEvolText('');
      setEditMotivo('');
      setNewEvolVitals({ peso_kg: '', talla_cm: '', perimetro_cefalico_cm: '', tension_arterial: '' });
      setEditEvolId(null);
    }
  });

  const updateProblemStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await api.put(`/problems/${selectedProblem}/status?status=${status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems', patientId] });
      setSelectedProblem(null);
    }
  });

  const handleOpenEdit = (evo: any) => {
    setEditEvolId(evo.id);
    setNewEvolText(evo.texto_clinico);
    setNewEvolVitals({
      peso_kg: evo.peso_kg?.toString() || '',
      talla_cm: evo.talla_cm?.toString() || '',
      perimetro_cefalico_cm: evo.perimetro_cefalico_cm?.toString() || '',
      tension_arterial: evo.tension_arterial || ''
    });
    setEditMotivo('');
    setOpenEditEvol(true);
  };

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

  const activeProblems = problems?.filter((p: any) => p.estado === 'activo').sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];
  const inactiveProblems = problems?.filter((p: any) => p.estado === 'inactivo').sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];
  
  const sortedEvolutions = evolutions?.slice().sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) || [];
  
  const sortRecordsDesc = (arr: any[] | undefined) => {
    if (!arr) return [];
    return arr.slice().sort((a, b) => new Date(b.fecha || b.fecha_inicio || b.created_at).getTime() - new Date(a.fecha || a.fecha_inicio || a.created_at).getTime());
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Historia Clínica Electrónica
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Listado de pacientes</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Panel: Context & Problems */}
        <Box sx={{ width: 360, borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper', overflowY: 'auto' }}>
          <Box p={3} textAlign="center" sx={{ bgcolor: '#f8fafc' }}>
            <Typography variant="h5" fontWeight="bold" color="primary.main">
              {patient?.apellido}, {patient?.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              DNI: {patient?.documento} | Sexo: {patient?.sexo}
            </Typography>
            {patient?.fecha_nacimiento && (
              <Typography variant="body2" color="text.secondary">
                Fecha Nac.: {formatDate(patient.fecha_nacimiento)} ({calculateAge(patient.fecha_nacimiento)} años)
              </Typography>
            )}
          </Box>
          <Divider />

          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="900" color="primary.dark" textTransform="uppercase" sx={{ letterSpacing: 1 }}>
                Problemas Activos
              </Typography>
              {canEditClinic && (
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary" 
                  onClick={() => setOpenAddProblem(true)}
                  sx={{ borderRadius: 6, textTransform: 'none', fontWeight: 'bold', boxShadow: 2 }}
                >
                  + Añadir Problema
                </Button>
              )}
            </Box>
            <List disablePadding>
              {activeProblems.map((p: any) => (
                <ListItem key={p.id} disablePadding>
                  <ListItemButton 
                    selected={selectedProblem === p.id}
                    onClick={() => {
                      setSelectedProblem(p.id);
                      setCurrentTab(0);
                    }}
                    sx={{ 
                      borderRadius: 2, 
                      mb: 1,
                      borderLeft: 4,
                      borderColor: 'primary.main',
                      bgcolor: selectedProblem === p.id ? 'action.selected' : 'background.paper',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.contrastText' }
                    }}
                  >
                    <ListItemText 
                      primary={p.description} 
                      secondary={`Cargado el: ${new Date(p.created_at).toLocaleDateString()}`}
                      primaryTypographyProps={{ 
                        fontWeight: selectedProblem === p.id ? 'bold' : 'medium',
                        fontSize: '0.9rem' 
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {activeProblems.length === 0 && (
                <Typography variant="body2" color="text.secondary">No hay problemas activos.</Typography>
              )}
            </List>
          </Box>

          <Divider />
          <Box p={2} sx={{ bgcolor: '#fafafa' }}>
            <Typography variant="h6" fontWeight="900" color="text.secondary" textTransform="uppercase" mb={2} sx={{ letterSpacing: 1 }}>
              Problemas Inactivos
            </Typography>
            <List disablePadding>
              {inactiveProblems.map((p: any) => (
                <ListItem key={p.id} disablePadding>
                  <ListItemButton 
                    selected={selectedProblem === p.id}
                    onClick={() => {
                      setSelectedProblem(p.id);
                      setCurrentTab(0);
                    }}
                    sx={{ 
                      borderRadius: 2, 
                      mb: 1, 
                      opacity: 0.8,
                      borderLeft: 4,
                      borderColor: 'grey.400',
                      bgcolor: 'background.paper',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <ListItemText 
                      primary={p.description} 
                      secondary={`Cargado el: ${new Date(p.created_at).toLocaleDateString()}`}
                      primaryTypographyProps={{ color: 'text.secondary', fontSize: '0.9rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>

        {/* Main Panel: Evolutions & Details */}
        <Box sx={{ flexGrow: 1, bgcolor: '#f4f6f8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 3, pt: 2 }}>
            <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable" scrollButtons="auto">
              <Tab label="Problemas" />
              <Tab label="Alergias" />
              <Tab label="Medicación" />
              <Tab label="Vacunas" />
              <Tab label="Laboratorio" />
              <Tab label="Procedimientos" />
            </Tabs>
          </Box>
          <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
            {currentTab === 0 && (
              <Box>
          {selectedProblem ? (
            <>
              <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" fontWeight="bold" mb={1}>
                      {problems?.find((p: any) => p.id === selectedProblem)?.description}
                    </Typography>
                    <Chip 
                      label={problems?.find((p: any) => p.id === selectedProblem)?.estado.toUpperCase()} 
                      color={problems?.find((p: any) => p.id === selectedProblem)?.estado === 'activo' ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                  {canEditClinic && problems?.find((p: any) => p.id === selectedProblem)?.estado === 'activo' && (
                    <Button 
                      variant="outlined" 
                      color="warning" 
                      size="small"
                      onClick={() => {
                        if(window.confirm('¿Estás seguro de pasar este problema a inactivo?')) {
                          updateProblemStatusMutation.mutate('inactivo');
                        }
                      }}
                      disabled={updateProblemStatusMutation.isPending}
                    >
                      Pasar a inactivo
                    </Button>
                  )}
                  {canEditClinic && problems?.find((p: any) => p.id === selectedProblem)?.estado === 'inactivo' && (
                    <Button 
                      variant="outlined" 
                      color="success" 
                      size="small"
                      onClick={() => {
                        if(window.confirm('¿Estás seguro de reactivar este problema?')) {
                          updateProblemStatusMutation.mutate('activo');
                        }
                      }}
                      disabled={updateProblemStatusMutation.isPending}
                    >
                      Pasar a activo
                    </Button>
                  )}
                </Box>
              </Paper>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">Evoluciones</Typography>
                {canEditClinic && (
                  <Button variant="contained" disableElevation disabled={problems?.find((p: any) => p.id === selectedProblem)?.estado === 'inactivo'} onClick={() => {
                    setNewEvolText('');
                    setNewEvolVitals({ peso_kg: '', talla_cm: '', perimetro_cefalico_cm: '', tension_arterial: '' });
                    setOpenAddEvol(true);
                  }}>Nueva Evolución</Button>
                )}
              </Box>

              {sortedEvolutions.map((evo: any) => (
                <Paper key={evo.id} sx={{ p: 3, mb: 2 }} elevation={1}>
                  <Box display="flex" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(evo.fecha).toLocaleString()} - Autor ID: {evo.autor_id}
                      {evo.is_edited && (
                        <span style={{color: '#d32f2f', fontWeight: 'bold'}}>
                           {' '}(Editado: {evo.motivo_edicion})
                        </span>
                      )}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {evo.peso_kg && <Chip size="small" variant="outlined" label={`Peso: ${evo.peso_kg} kg`} />}
                      {evo.talla_cm && <Chip size="small" variant="outlined" label={`Talla: ${evo.talla_cm} cm`} />}
                      {evo.perimetro_cefalico_cm && <Chip size="small" variant="outlined" label={`PC: ${evo.perimetro_cefalico_cm} cm`} />}
                      {evo.tension_arterial && <Chip size="small" variant="outlined" label={`TA: ${evo.tension_arterial}`} />}
                      {canEditClinic && (
                        <IconButton size="small" onClick={() => handleOpenEdit(evo)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {evo.texto_clinico}
                  </Typography>
                </Paper>
              ))}
              {sortedEvolutions.length === 0 && (
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
            )}

            {currentTab === 1 && <AllergiesTab patientId={patientId as string} allergies={sortRecordsDesc(records?.allergies)} />}
            {currentTab === 2 && <MedicationsTab patientId={patientId as string} medications={sortRecordsDesc(records?.medications)} problems={problems} />}
            {currentTab === 3 && <VaccinesTab patientId={patientId as string} vaccines={sortRecordsDesc(records?.vaccines)} />}
            {currentTab === 4 && <LabsTab patientId={patientId as string} labs={sortRecordsDesc(records?.lab_results)} />}
            {currentTab === 5 && <ProceduresTab patientId={patientId as string} procedures={sortRecordsDesc(records?.procedures)} />}
          </Box>
        </Box>
      </Box>

      {/* Add Problem Dialog */}
      <ErrorBoundary>
        <Dialog open={openAddProblem} onClose={() => setOpenAddProblem(false)} fullWidth maxWidth="md">
          <DialogTitle>Añadir Problema Activo</DialogTitle>
          <DialogContent>
          <SnomedAutocomplete
            label="Descripción del problema (Busca en SNOMED CT...)"
            selectedConceptId={newProblemCode}
            selectedTerm={newProblemDesc}
            onSelect={(conceptId, term) => {
              setNewProblemCode(conceptId);
              setNewProblemDesc(term);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddProblem(false)}>Cancelar</Button>
          <Button 
            onClick={() => addProblemMutation.mutate(newProblemDesc)} 
            variant="contained" 
            disabled={!newProblemDesc.trim() || !newProblemCode.trim() || addProblemMutation.isPending}
          >
            Guardar
          </Button>
          </DialogActions>
        </Dialog>
      </ErrorBoundary>

      {/* Add Evolution Dialog */}
      <Dialog open={openAddEvol} onClose={() => setOpenAddEvol(false)} fullWidth maxWidth="md">
        <DialogTitle>Nueva Evolución Clínica</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={2} mb={2} mt={1}>
            <TextField label="Peso (kg)" type="number" size="small" value={newEvolVitals.peso_kg} onChange={(e) => setNewEvolVitals({...newEvolVitals, peso_kg: e.target.value})} />
            <TextField label="Talla (cm)" type="number" size="small" value={newEvolVitals.talla_cm} onChange={(e) => setNewEvolVitals({...newEvolVitals, talla_cm: e.target.value})} />
            <TextField label="P. Cefálico (cm)" type="number" size="small" value={newEvolVitals.perimetro_cefalico_cm} onChange={(e) => setNewEvolVitals({...newEvolVitals, perimetro_cefalico_cm: e.target.value})} />
            <TextField label="TA (Ej. 120/80)" size="small" value={newEvolVitals.tension_arterial} onChange={(e) => setNewEvolVitals({...newEvolVitals, tension_arterial: e.target.value})} />
          </Box>
          <TextField 
            autoFocus
            margin="dense"
            label="Texto clínico"
            fullWidth
            multiline
            rows={4}
            value={newEvolText}
            onChange={(e) => setNewEvolText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddEvol(false)}>Cancelar</Button>
          <Button 
            onClick={() => addEvolutionMutation.mutate(newEvolText)} 
            variant="contained" 
            disabled={!newEvolText.trim() || addEvolutionMutation.isPending}
          >
            Guardar Evolución
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Evolution Dialog */}
      <Dialog open={openEditEvol} onClose={() => setOpenEditEvol(false)} fullWidth maxWidth="md">
        <DialogTitle>Editar Evolución Clínica</DialogTitle>
        <DialogContent>
          <TextField 
            margin="dense"
            label="Motivo de edición (obligatorio)"
            fullWidth
            required
            value={editMotivo}
            onChange={(e) => setEditMotivo(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box display="flex" gap={2} mb={2}>
            <TextField label="Peso (kg)" type="number" size="small" value={newEvolVitals.peso_kg} onChange={(e) => setNewEvolVitals({...newEvolVitals, peso_kg: e.target.value})} />
            <TextField label="Talla (cm)" type="number" size="small" value={newEvolVitals.talla_cm} onChange={(e) => setNewEvolVitals({...newEvolVitals, talla_cm: e.target.value})} />
            <TextField label="P. Cefálico (cm)" type="number" size="small" value={newEvolVitals.perimetro_cefalico_cm} onChange={(e) => setNewEvolVitals({...newEvolVitals, perimetro_cefalico_cm: e.target.value})} />
            <TextField label="TA (Ej. 120/80)" size="small" value={newEvolVitals.tension_arterial} onChange={(e) => setNewEvolVitals({...newEvolVitals, tension_arterial: e.target.value})} />
          </Box>
          <TextField 
            margin="dense"
            label="Texto clínico"
            fullWidth
            multiline
            rows={4}
            value={newEvolText}
            onChange={(e) => setNewEvolText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditEvol(false)}>Cancelar</Button>
          <Button 
            onClick={() => editEvolutionMutation.mutate()} 
            variant="contained" 
            disabled={!newEvolText.trim() || !editMotivo.trim() || editEvolutionMutation.isPending}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClinicalWorkspace;
