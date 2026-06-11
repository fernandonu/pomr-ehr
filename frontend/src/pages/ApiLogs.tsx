import React, { useState } from 'react';
import { 
  Box, Typography, Container, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, AppBar, Toolbar, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tabs, Tab
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabIndex, setTabIndex] = useState(0);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['api-logs'],
    queryFn: async () => {
      const res = await api.get<ApiLog[]>('/api-logs/?limit=1000');
      return res.data;
    }
  });

  const filteredLogs = React.useMemo(() => {
    if (!logs) return [];
    if (tabIndex === 0) return logs.filter(l => (l.endpoint || '').includes('(ITI-68)'));
    if (tabIndex === 1) return logs.filter(l => (l.endpoint || '').includes('(ITI-67)'));
    if (tabIndex === 2) return logs.filter(l => (l.endpoint || '').includes('(ITI-78)'));
    if (tabIndex === 3) return logs.filter(l => (l.endpoint || '').includes('(ITI-104)'));
    if (tabIndex === 4) return logs.filter(l => (l.endpoint || '').includes('(ITI-65)'));
    if (tabIndex === 5) return logs.filter(l => {
      const ep = l.endpoint || '';
      return !ep.includes('(ITI-68)') && 
             !ep.includes('(ITI-67)') && 
             !ep.includes('(ITI-78)') && 
             !ep.includes('(ITI-104)') && 
             !ep.includes('(ITI-65)');
    });
    return logs;
  }, [logs, tabIndex]);

  const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

        <Paper elevation={1} sx={{ width: '100%', overflow: 'hidden' }}>
          <Tabs value={tabIndex} onChange={(e, v) => { setTabIndex(v); setPage(0); }} sx={{ borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
            <Tab label="Consultas IPS (ITI-68)" />
            <Tab label="Búsqueda IPS (ITI-67)" />
            <Tab label="Búsqueda Paciente (ITI-78)" />
            <Tab label="Alta Paciente (ITI-104)" />
            <Tab label="Envío de Doc. (ITI-65)" />
            <Tab label="Otras Llamadas" />
          </Tabs>
          <TableContainer>
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
                paginatedLogs.map((row) => (
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
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
        </Paper>
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
