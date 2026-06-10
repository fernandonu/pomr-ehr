import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Paper, Select, MenuItem, InputLabel, FormControl, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Chip, AppBar, Toolbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export default function UsersManager() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('equipo_sanitario');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [matricula, setMatricula] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [servicio, setServicio] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users/');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newUser: any) => {
      await api.post('/users/', newUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setUsername('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setMatricula('');
      setEspecialidad('');
      setServicio('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updatedUser }: { id: number, updatedUser: any }) => {
      await api.put(`/users/${id}`, updatedUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditOpen(false);
      setUsername('');
      setFirstName('');
      setLastName('');
      setMatricula('');
      setEspecialidad('');
      setServicio('');
      setSelectedUserId(null);
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
    createMutation.mutate({ 
      username, 
      password, 
      role, 
      is_active: true,
      first_name: firstName,
      last_name: lastName,
      matricula,
      especialidad,
      servicio
    });
  };

  const handlePasswordChange = () => {
    if (selectedUserId) {
      passwordMutation.mutate({ id: selectedUserId, newPassword: password });
    }
  };

  const handleUpdate = () => {
    if (selectedUserId) {
      updateMutation.mutate({
        id: selectedUserId,
        updatedUser: {
          first_name: firstName,
          last_name: lastName,
          matricula,
          especialidad,
          servicio,
          role
        }
      });
    }
  };

  const openEditDialog = (user: any) => {
    setSelectedUserId(user.id);
    setUsername(user.username);
    setRole(user.role);
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setMatricula(user.matricula || '');
    setEspecialidad(user.especialidad || '');
    setServicio(user.servicio || '');
    setEditOpen(true);
  };

  const openCreateDialog = () => {
    setUsername('');
    setPassword('');
    setRole('equipo_sanitario');
    setFirstName('');
    setLastName('');
    setMatricula('');
    setEspecialidad('');
    setServicio('');
    setOpen(true);
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
        <Button variant="contained" onClick={openCreateDialog}>+ Nuevo Usuario</Button>
      </Box>

      <Paper elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Matrícula</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.first_name || '-'}</TableCell>
                <TableCell>{user.last_name || '-'}</TableCell>
                <TableCell>{user.matricula || '-'}</TableCell>
                <TableCell>{user.especialidad || '-'}</TableCell>
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
                    color="secondary"
                    sx={{ mr: 1 }}
                    onClick={() => openEditDialog(user)}
                  >
                    Editar Perfil
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setPassword('');
                      setPasswordOpen(true);
                    }}
                  >
                    Contraseña
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
          <TextField fullWidth label="Nombre" margin="normal" value={firstName} onChange={e => setFirstName(e.target.value)} />
          <TextField fullWidth label="Apellido" margin="normal" value={lastName} onChange={e => setLastName(e.target.value)} />
          <TextField fullWidth label="Matrícula Profesional" margin="normal" value={matricula} onChange={e => setMatricula(e.target.value)} />
          <TextField fullWidth label="Especialidad" margin="normal" value={especialidad} onChange={e => setEspecialidad(e.target.value)} />
          <TextField fullWidth label="Servicio Médico" margin="normal" value={servicio} onChange={e => setServicio(e.target.value)} />
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
          <Button variant="contained" onClick={handleCreate} disabled={!username || !password || createMutation.isPending}>Crear</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Edit User */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Perfil de {username}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Username" margin="normal" value={username} disabled />
          <TextField fullWidth label="Nombre" margin="normal" value={firstName} onChange={e => setFirstName(e.target.value)} />
          <TextField fullWidth label="Apellido" margin="normal" value={lastName} onChange={e => setLastName(e.target.value)} />
          <TextField fullWidth label="Matrícula Profesional" margin="normal" value={matricula} onChange={e => setMatricula(e.target.value)} />
          <TextField fullWidth label="Especialidad" margin="normal" value={especialidad} onChange={e => setEspecialidad(e.target.value)} />
          <TextField fullWidth label="Servicio Médico" margin="normal" value={servicio} onChange={e => setServicio(e.target.value)} />
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
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={updateMutation.isPending}>Guardar Cambios</Button>
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
