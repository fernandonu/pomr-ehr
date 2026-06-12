import React, { useState } from 'react';
import {
  Box, Typography, Container, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, AppBar, Toolbar, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Snackbar, Alert, Tooltip, Grid, TableSortLabel
} from '@mui/material';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MapIcon from '@mui/icons-material/Map';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/es';
import 'leaflet/dist/leaflet.css';

const DraggableMarker = ({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) => {
  const markerRef = React.useRef<L.Marker>(null);
  const eventHandlers = React.useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          setPosition([latLng.lat, latLng.lng]);
        }
      },
    }),
    [setPosition],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
      <Popup minWidth={90}>
        Arrastra el pin para ajustar.
      </Popup>
    </Marker>
  );
};

const MapResizer = () => {
  const map = useMap();
  React.useEffect(() => {
    // Invalidate size multiple times during and after MUI Dialog transition
    let count = 0;
    const intervalId = setInterval(() => {
      map.invalidateSize();
      count++;
      if (count > 8) clearInterval(intervalId); // 8 * 50ms = 400ms
    }, 50);

    return () => clearInterval(intervalId);
  }, [map]);
  return null;
};

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
  cobertura?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  departamento?: string;
  cpostal?: string;
  barrio?: string;
  monoblock?: string;
  ciudad?: string;
  municipio?: string;
  provincia?: string;
  pais?: string;
  latitud?: number;
  longitud?: number;
}

const PatientList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMapPatient, setViewMapPatient] = useState<Patient | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);

  React.useEffect(() => {
    if (viewMapPatient || isDialogOpen) {
      const timer = setTimeout(() => setMapReady(true), 350);
      return () => clearTimeout(timer);
    } else {
      setMapReady(false);
    }
  }, [viewMapPatient, isDialogOpen]);

  const [newPatient, setNewPatient] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    fecha_nacimiento: '',
    sexo: '',
    telefono: '',
    apellido_materno: '',
    cobertura: '',
    calle: '',
    numero: '',
    piso: '',
    departamento: '',
    cpostal: '',
    barrio: '',
    monoblock: '',
    ciudad: '',
    municipio: '',
    provincia: '',
    pais: '',
    latitud: undefined as number | undefined,
    longitud: undefined as number | undefined
  });
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({open: false, message: '', severity: 'info'});
  const [isValidatingRenaper, setIsValidatingRenaper] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<keyof Patient>('id');

  const handleGeolocate = async () => {
    setIsGeolocating(true);
    try {
      const { calle, numero, ciudad, provincia, pais } = newPatient;
      let queryParts = [];
      if (calle && numero) queryParts.push(`${calle} ${numero}`);
      else if (calle) queryParts.push(calle);
      if (ciudad) queryParts.push(ciudad);
      if (provincia) queryParts.push(provincia);
      if (pais) queryParts.push(pais);

      const query = queryParts.join(', ');

      if (!query.trim()) {
        setSnackbar({ open: true, message: "Por favor complete al menos la calle o ciudad para geolocalizar.", severity: "info" });
        setIsGeolocating(false);
        return;
      }

      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setNewPatient(prev => ({
          ...prev,
          latitud: parseFloat(data[0].lat),
          longitud: parseFloat(data[0].lon)
        }));
        setSnackbar({ open: true, message: "Coordenadas obtenidas correctamente.", severity: "success" });
      } else {
        setSnackbar({ open: true, message: "No se encontró la dirección exacta. Intente agregar más detalles.", severity: "error" });
      }
    } catch (error) {
      console.error("Error geolocalizando", error);
      setSnackbar({ open: true, message: "Error de red al intentar geolocalizar.", severity: "error" });
    } finally {
      setIsGeolocating(false);
    }
  };

  const handleRequestSort = (property: keyof Patient) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

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
      setNewPatient({ nombre: '', apellido: '', documento: '', fecha_nacimiento: '', sexo: '', telefono: '', apellido_materno: '', cobertura: '', calle: '', numero: '', piso: '', departamento: '', cpostal: '', barrio: '', monoblock: '', ciudad: '', municipio: '', provincia: '', pais: '', latitud: undefined, longitud: undefined });
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
      setNewPatient({ nombre: '', apellido: '', documento: '', fecha_nacimiento: '', sexo: '', telefono: '', apellido_materno: '', cobertura: '', calle: '', numero: '', piso: '', departamento: '', cpostal: '', barrio: '', monoblock: '', ciudad: '', municipio: '', provincia: '', pais: '', latitud: undefined, longitud: undefined });
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

  const handleValidateRenaper = async () => {
    if (!newPatient.documento || !newPatient.sexo) return;
    setIsValidatingRenaper(true);
    try {
      const res = await api.get(`/patients/validate-renaper/cobertura?documento=${newPatient.documento}&sexo=${newPatient.sexo}`);
      if (res.data) {
        setNewPatient(prev => ({
          ...prev,
          nombre: res.data.nombre || prev.nombre,
          apellido: res.data.apellido || prev.apellido,
          fecha_nacimiento: res.data.fecha_nacimiento || prev.fecha_nacimiento,
          cobertura: res.data.cobertura || prev.cobertura,
          calle: res.data.calle || prev.calle,
          numero: res.data.numero || prev.numero,
          piso: res.data.piso || prev.piso,
          departamento: res.data.departamento || prev.departamento,
          cpostal: res.data.cpostal || prev.cpostal,
          barrio: res.data.barrio || prev.barrio,
          monoblock: res.data.monoblock || prev.monoblock,
          ciudad: res.data.ciudad?.replace(/_/g, ' ') || prev.ciudad,
          municipio: res.data.municipio?.replace(/_/g, ' ') || prev.municipio,
          provincia: res.data.provincia?.replace(/_/g, ' ') || prev.provincia,
          pais: res.data.pais || prev.pais
        }));
        setSnackbar({ open: true, message: "Datos validados correctamente desde el BUS.", severity: 'success' });
      }
    } catch (err: any) {
      console.error(err);
      setSnackbar({ open: true, message: "No se pudieron obtener datos del BUS para este documento.", severity: 'info' });
    } finally {
      setIsValidatingRenaper(false);
    }
  };

  const handleSavePatient = () => {
    if (!newPatient.nombre || !newPatient.apellido || !newPatient.apellido_materno || !newPatient.documento || !newPatient.fecha_nacimiento || !newPatient.sexo) {
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
    setNewPatient({ nombre: '', apellido: '', documento: '', fecha_nacimiento: '', sexo: '', telefono: '', apellido_materno: '', cobertura: '', calle: '', numero: '', piso: '', departamento: '', cpostal: '', barrio: '', monoblock: '', ciudad: '', municipio: '', provincia: '', pais: '' });
    setIsDialogOpen(true);
  };

  const filteredPatients = patients?.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.documento.includes(searchTerm)
  ) || [];

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    let aVal = a[orderBy];
    let bVal = b[orderBy];
    
    if (orderBy === 'nombre') {
      aVal = `${a.apellido}, ${a.nombre}`;
      bVal = `${b.apellido}, ${b.nombre}`;
    }
    
    if (aVal === undefined || aVal === null) aVal = '';
    if (bVal === undefined || bVal === null) bVal = '';

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedPatients = sortedPatients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppBar position="static" elevation={0} color="primary">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px' }}>
              <path d="M 84.6 25 A 40 40 0 1 0 84.6 75" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
              <path d="M 50 22 L 50 50 L 58 50 L 64 32 L 72 68 L 78 50 L 95 50" stroke="#ffffff" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            </svg>
            <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
              Kairos EHR
            </Typography>
          </Box>
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

      <Container maxWidth={false} sx={{ mt: 4, mb: 4, flexGrow: 1, px: { xs: 2, sm: 4, md: 6 }, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexShrink={0}>
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

        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', flexShrink: 0 }} elevation={1}>
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

        <Paper elevation={1} sx={{ width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Table stickyHeader sx={{ minWidth: 650 }} aria-label="pacientes table">
            <TableHead sx={{ backgroundColor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel active={orderBy === 'id'} direction={orderBy === 'id' ? order : 'asc'} onClick={() => handleRequestSort('id')}>
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel active={orderBy === 'nombre'} direction={orderBy === 'nombre' ? order : 'asc'} onClick={() => handleRequestSort('nombre')}>
                    Nombre y Apellido
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Documento</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel active={orderBy === 'fecha_nacimiento'} direction={orderBy === 'fecha_nacimiento' ? order : 'asc'} onClick={() => handleRequestSort('fecha_nacimiento')}>
                    Fecha Nacimiento
                  </TableSortLabel>
                </TableCell>
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
                              telefono: row.telefono || '',
                              cobertura: row.cobertura || '',
                              calle: row.calle || '',
                              numero: row.numero || '',
                              piso: row.piso || '',
                              departamento: row.departamento || '',
                              cpostal: row.cpostal || '',
                              barrio: row.barrio || '',
                              monoblock: row.monoblock || '',
                              ciudad: row.ciudad || '',
                              municipio: row.municipio || '',
                              provincia: row.provincia || '',
                              pais: row.pais || '',
                              latitud: row.latitud,
                              longitud: row.longitud
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
                      {row.latitud !== undefined && row.latitud !== null && row.longitud !== undefined && row.longitud !== null && (
                        <Tooltip title="Ver en Mapa">
                          <IconButton
                            color="info"
                            aria-label="ver mapa"
                            onClick={() => setViewMapPatient(row)}
                          >
                            <MapIcon />
                          </IconButton>
                        </Tooltip>
                      )}
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

      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        maxWidth="xl" 
        fullWidth
      >
        <DialogTitle>{editingPatientId ? 'Editar Paciente' : 'Nuevo Paciente'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: 3 }}>
            {/* Columna Izquierda: Datos Personales */}
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                Datos Personales
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
            <TextField
              fullWidth
              required
              margin="dense" size="small"
              label="Documento"
              value={newPatient.documento}
              onChange={(e) => setNewPatient({ ...newPatient, documento: e.target.value })}
              error={!!documentoExistente && !!newPatient.documento}
              helperText={!!documentoExistente && !!newPatient.documento ? "Este documento ya se encuentra registrado" : ""}
            />
            <TextField
              fullWidth
              required
              margin="dense" size="small"
              select
              label="Sexo"
              value={newPatient.sexo}
              onChange={(e) => {
                setNewPatient({ ...newPatient, sexo: e.target.value });
              }}
              onBlur={handleValidateRenaper}
              disabled={isValidatingRenaper}
            >
              <MenuItem value="M">Masculino</MenuItem>
              <MenuItem value="F">Femenino</MenuItem>
              <MenuItem value="X">Otro</MenuItem>
            </TextField>
            <TextField
              fullWidth
              required
              margin="dense" size="small"
              label="Nombre"
              value={newPatient.nombre}
              onChange={(e) => setNewPatient({ ...newPatient, nombre: e.target.value })}
            />
            <TextField
              fullWidth
              required
              margin="dense" size="small"
              label="Apellido"
              value={newPatient.apellido}
              onChange={(e) => setNewPatient({ ...newPatient, apellido: e.target.value })}
            />
            <TextField
              fullWidth
              required
              margin="dense" size="small"
              label="Apellido Materno"
              value={newPatient.apellido_materno}
              onChange={(e) => setNewPatient({ ...newPatient, apellido_materno: e.target.value })}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <DatePicker
                label="Fecha de Nacimiento"
                value={newPatient.fecha_nacimiento ? dayjs(newPatient.fecha_nacimiento, 'YYYY-MM-DD') : null}
                onChange={(newValue) => setNewPatient({ ...newPatient, fecha_nacimiento: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true,
                    margin: 'dense',
                    size: 'small'
                  }
                }}
              />
            </LocalizationProvider>
            <TextField
              fullWidth
              margin="dense" size="small"
              label="Teléfono"
              value={newPatient.telefono}
              onChange={(e) => setNewPatient({ ...newPatient, telefono: e.target.value })}
            />
            <TextField
              fullWidth
              margin="dense" size="small"
              label="Cobertura Social"
              value={newPatient.cobertura || ''}
              onChange={(e) => setNewPatient({ ...newPatient, cobertura: e.target.value })}
              helperText="Información obtenida del servicio de cobertura MSAL"
            />
              </Box>
            </Box>

            {/* Columna Derecha: Domicilio */}
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                Datos de Domicilio
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <TextField
                  fullWidth margin="dense" size="small" label="Calle" value={newPatient.calle || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, calle: e.target.value })}
                />
                <TextField
                  fullWidth margin="dense" size="small" label="Número" value={newPatient.numero || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, numero: e.target.value })}
                />
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth margin="dense" size="small" label="Piso" value={newPatient.piso || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, piso: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth margin="dense" size="small" label="Departamento" value={newPatient.departamento || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, departamento: e.target.value })}
                    />
                  </Grid>
                </Grid>
                <TextField
                  fullWidth margin="dense" size="small" label="Código Postal" value={newPatient.cpostal || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, cpostal: e.target.value })}
                />
                <TextField
                  fullWidth margin="dense" size="small" label="Barrio" value={newPatient.barrio || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, barrio: e.target.value })}
                />
                <TextField
                  fullWidth margin="dense" size="small" label="Monoblock / Torre" value={newPatient.monoblock || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, monoblock: e.target.value })}
                />
                <TextField
                  fullWidth margin="dense" size="small" label="Ciudad" value={newPatient.ciudad || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, ciudad: e.target.value })}
                />
                <TextField
                  fullWidth margin="dense" size="small" label="Municipio" value={newPatient.municipio || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, municipio: e.target.value })}
                />
                <TextField
                  fullWidth margin="dense" size="small" label="Provincia" value={newPatient.provincia || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, provincia: e.target.value })}
                />
                <TextField
                  fullWidth margin="dense" size="small" label="País" value={newPatient.pais || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, pais: e.target.value })}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleGeolocate} 
                  disabled={isGeolocating}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  {isGeolocating ? 'Buscando...' : 'Obtener Coordenadas'}
                </Button>
              </Box>
            </Box>
          </Box>
          {newPatient.latitud !== undefined && newPatient.longitud !== undefined && (
            <Box mt={3} height={300} width="100%" sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
              {mapReady ? (
                <MapContainer 
                  center={[Number(newPatient.latitud), Number(newPatient.longitud)]} 
                  zoom={15} 
                  scrollWheelZoom={false} 
                  style={{ height: '100%', width: '100%', minHeight: '300px' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <DraggableMarker 
                    position={[Number(newPatient.latitud), Number(newPatient.longitud)]} 
                    setPosition={(pos) => setNewPatient({ ...newPatient, latitud: pos[0], longitud: pos[1] })} 
                  />
                </MapContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography>Cargando mapa...</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSavePatient}
            disabled={createPatientMutation.isPending || editPatientMutation.isPending || !!documentoExistente}
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

      <Dialog 
        open={!!viewMapPatient} 
        onClose={() => {
          setViewMapPatient(null);
          setMapReady(false);
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Ubicación de {viewMapPatient?.nombre} {viewMapPatient?.apellido}</DialogTitle>
        <DialogContent dividers>
          {viewMapPatient?.latitud !== undefined && viewMapPatient?.longitud !== undefined && (
            <Box height={400} width="100%">
              {mapReady ? (
                <MapContainer 
                  center={[Number(viewMapPatient.latitud), Number(viewMapPatient.longitud)]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%', minHeight: '300px' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[Number(viewMapPatient.latitud), Number(viewMapPatient.longitud)]}>
                    <Popup>
                      {viewMapPatient.calle} {viewMapPatient.numero}<br/>
                      {viewMapPatient.ciudad}, {viewMapPatient.provincia}
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography>Cargando mapa...</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewMapPatient(null);
            setMapReady(false);
          }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientList;
