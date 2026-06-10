import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Paper, Select, MenuItem, InputLabel, FormControl, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Chip, AppBar, Toolbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export default function UsersManager() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('equipo_sanitario');

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users/');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newUser: { username: string, password?: string, role: string, is_active: boolean }) => {
      await api.post('/users/', newUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setUsername('');
      setPassword('');
    }
  });

  const passwordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number, newPassword: string }) => {
      await api.put(`/users/${id}/password`, { password: newPassword });
    },
    onSuccess: () => {
      setPasswordOpen(false);
      setPassword('');
      setSelectedUserId(null);
    }
  });

  const handleCreate = () => {
    createMutation.mutate({ username, password, role, is_active: true });
  };

  const handlePasswordChange = () => {
    if (selectedUserId) {
      passwordMutation.mutate({ id: selectedUserId, newPassword: password });
    }
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Historia Clínica Electrónica
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Listado de pacientes</Button>
          <Button color="inherit" onClick={() => navigate('/settings')}>Configuración</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">Gestión de Usuarios</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ Nuevo Usuario</Button>
      </Box>

      <Paper elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user: { id: number, username: string, role: string }) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role} 
                    color={user.role === 'superadmin' ? 'error' : user.role === 'administrativo' ? 'primary' : 'success'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setPassword('');
                      setPasswordOpen(true);
                    }}
                  >
                    Cambiar Contraseña
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog for New User */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Username" margin="normal" value={username} onChange={e => setUsername(e.target.value)} />
          <TextField fullWidth label="Contraseña" type="password" margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rol</InputLabel>
            <Select value={role} label="Rol" onChange={e => setRole(e.target.value)}>
              <MenuItem value="equipo_sanitario">Equipo Sanitario (Cargar Evoluciones)</MenuItem>
              <MenuItem value="administrativo">Administrativo (Crear Pacientes)</MenuItem>
              <MenuItem value="superadmin">Superadmin (Acceso Total)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!username || !password}>Crear</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Password Change */}
      <Dialog open={passwordOpen} onClose={() => setPasswordOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar Contraseña</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nueva Contraseña" type="password" margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handlePasswordChange} disabled={!password}>Guardar</Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
}
