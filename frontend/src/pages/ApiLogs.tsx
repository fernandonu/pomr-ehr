import React, { useState } from 'react';
import { 
  Box, Typography, Container, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, AppBar, Toolbar, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface ApiLog {
  id: number;
  patient_id: number;
  endpoint: string;
  method: string;
  request_payload: string;
  response_payload: string;
  status_code: number;
  timestamp: string;
}

const ApiLogs = () => {
  const navigate = useNavigate();
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['api-logs'],
    queryFn: async () => {
      const res = await api.get<ApiLog[]>('/api-logs/');
      return res.data;
    }
  });

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Logs de Auditoría (API Externa)
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Listado de pacientes</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ mt: 4, mb: 4, flexGrow: 1, px: { xs: 2, sm: 4, md: 6 } }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary" mb={3}>
          Historial de Peticiones
        </Typography>

        <TableContainer component={Paper} elevation={1}>
          <Table sx={{ minWidth: 650 }} aria-label="api logs table">
            <TableHead sx={{ backgroundColor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha/Hora</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Paciente ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Método</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Endpoint</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Detalles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center">Cargando...</TableCell></TableRow>
              ) : !logs || logs.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">No hay registros de llamadas externas.</TableCell></TableRow>
              ) : (
                logs.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f5f5f5' } }}
                  >
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{row.patient_id}</TableCell>
                    <TableCell>{row.method}</TableCell>
                    <TableCell>{row.endpoint}</TableCell>
                    <TableCell sx={{ color: row.status_code >= 400 ? 'red' : 'green', fontWeight: 'bold' }}>
                      {row.status_code}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => setSelectedLog(row)}>
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

      <Dialog open={!!selectedLog} onClose={() => setSelectedLog(null)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de la Petición #{selectedLog?.id}</DialogTitle>
        <DialogContent dividers>
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="bold">Request Payload:</Typography>
            <Box component="pre" sx={{ bgcolor: '#f4f4f4', p: 1, borderRadius: 1, overflowX: 'auto' }}>
              {selectedLog?.request_payload ? JSON.stringify(JSON.parse(selectedLog.request_payload), null, 2) : 'No payload'}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">Response Payload:</Typography>
            <Box component="pre" sx={{ bgcolor: '#f4f4f4', p: 1, borderRadius: 1, overflowX: 'auto' }}>
              {selectedLog?.response_payload ? JSON.stringify(JSON.parse(selectedLog.response_payload), null, 2) : 'No payload'}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiLogs;
