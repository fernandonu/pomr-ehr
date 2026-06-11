import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, AppBar, Toolbar, Snackbar, Alert, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, logout } = useAuthStore();

  const [nodoUrl, setNodoUrl] = useState('');
  const [abmUrl, setAbmUrl] = useState('');
  const [tokenExpire, setTokenExpire] = useState<number | string>('');
  const [codigoRefes, setCodigoRefes] = useState('');
  const [renaperNombre, setRenaperNombre] = useState('');
  const [renaperClave, setRenaperClave] = useState('');
  const [renaperCodDominio, setRenaperCodDominio] = useState('');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({open: false, message: '', severity: 'info'});

  // If not superadmin, redirect
  useEffect(() => {
    if (role !== 'superadmin') {
      navigate('/');
    }
  }, [role, navigate]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings/');
      return res.data;
    },
    enabled: role === 'superadmin'
  });

  useEffect(() => {
    if (settings) {
      setNodoUrl(settings.NODO_BASE_URL || '');
      setAbmUrl(settings.URL_ALTA_ABM_DOMINIO || '');
      setTokenExpire(settings.ACCESS_TOKEN_EXPIRE_MINUTES || '');
      setCodigoRefes(settings.CODIGO_REFES || '');
      setRenaperNombre(settings.RENAPER_NOMBRE || '');
      setRenaperClave(settings.RENAPER_CLAVE || '');
      setRenaperCodDominio(settings.RENAPER_COD_DOMINIO || '');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: { NODO_BASE_URL: string, URL_ALTA_ABM_DOMINIO: string, ACCESS_TOKEN_EXPIRE_MINUTES: number, CODIGO_REFES: string, RENAPER_NOMBRE: string, RENAPER_CLAVE: string, RENAPER_COD_DOMINIO: string }) => {
      const res = await api.put('/settings/', newSettings);
      return res.data;
    },
    onSuccess: (data) => {
      setSnackbar({ open: true, message: data.message || 'Configuración guardada exitosamente', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: unknown) => {
      console.error(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      const detail = err.response?.data?.detail;
      setSnackbar({ open: true, message: `Error al guardar: ${typeof detail === 'string' ? detail : JSON.stringify(detail) || err.message}`, severity: 'error' });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({
      NODO_BASE_URL: nodoUrl,
      URL_ALTA_ABM_DOMINIO: abmUrl,
      ACCESS_TOKEN_EXPIRE_MINUTES: Number(tokenExpire),
      CODIGO_REFES: codigoRefes,
      RENAPER_NOMBRE: renaperNombre,
      RENAPER_CLAVE: renaperClave,
      RENAPER_COD_DOMINIO: renaperCodDominio
    });
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Historia Clínica Electrónica - Configuración
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Volver al inicio</Button>
          <Button color="inherit" onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SettingsIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">Configuración del Sistema</Typography>
        </Box>

        {isLoading ? (
          <Typography>Cargando configuración...</Typography>
        ) : (
          <Paper elevation={2} sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>URLs de Integración Nacional</Typography>
                <TextField
                  fullWidth
                  label="URL Base Nodo Nacional (FHIR)"
                  variant="outlined"
                  value={nodoUrl}
                  onChange={(e) => setNodoUrl(e.target.value)}
                  helperText="Ejemplo: https://ipsgarrahan.fgnu.ar"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="URL Alta Dominio ABM"
                  variant="outlined"
                  value={abmUrl}
                  onChange={(e) => setAbmUrl(e.target.value)}
                  helperText="Sistema de Identificación (Renaper)"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Código REFES Efector"
                  variant="outlined"
                  value={codigoRefes}
                  onChange={(e) => setCodigoRefes(e.target.value)}
                  helperText="Código oficial de la institución en el Registro Federal (Ej. 2004010004)"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Seguridad y Sesiones</Typography>
                <TextField
                  fullWidth
                  label="Expiración del Token de Acceso (Minutos)"
                  type="number"
                  variant="outlined"
                  value={tokenExpire}
                  onChange={(e) => setTokenExpire(e.target.value)}
                  helperText="El tiempo en minutos que dura una sesión (1 hora = 60, 1 día = 1440)"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Credenciales BUS MSAL (Renaper y Cobertura)</Typography>
                <TextField
                  fullWidth
                  label="Nombre de Usuario (Token)"
                  variant="outlined"
                  value={renaperNombre}
                  onChange={(e) => setRenaperNombre(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Clave (Token)"
                  variant="outlined"
                  value={renaperClave}
                  onChange={(e) => setRenaperClave(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Código de Dominio"
                  variant="outlined"
                  value={renaperCodDominio}
                  onChange={(e) => setRenaperCodDominio(e.target.value)}
                  helperText="URL o identificador del dominio institucional"
                />
              </Grid>

            </Grid>
            <Box display="flex" justifyContent="flex-end" mt={4} pt={2} sx={{ borderTop: '1px solid #eee' }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large" 
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saveMutation.isPending || !nodoUrl || !abmUrl || !tokenExpire}
              >
                {saveMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </Box>
          </Paper>
        )}
      </Container>
      
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
}
