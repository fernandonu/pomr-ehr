import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Paper, Alert, IconButton, InputAdornment, Link } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const KairosLogo = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 3, md: 5 }, justifyContent: 'center' }}>
    <Box sx={{ mr: 3 }}>
      <svg width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 84.6 25 A 40 40 0 1 0 84.6 75" stroke="url(#kairos-gradient)" strokeWidth="6" strokeLinecap="round" />
        <path d="M 50 22 L 50 50 L 58 50 L 64 32 L 72 68 L 78 50 L 95 50" stroke="#00C4B4" strokeWidth="5.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
        <defs>
          <linearGradient id="kairos-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00AEEF" />
            <stop offset="100%" stopColor="#00C4B4" />
          </linearGradient>
        </defs>
      </svg>
    </Box>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Typography variant="h3" component="div" sx={{ fontWeight: 800, color: '#1c2833', letterSpacing: '-1px', lineHeight: 1 }}>
        Kairos <Box component="span" sx={{ color: '#00C4B4' }}>EHR</Box>
      </Typography>
      <Typography variant="h6" sx={{ color: '#5D6D7E', mt: 1, fontWeight: 400, letterSpacing: '0px', fontSize: { xs: '0.9rem', md: '1.15rem' } }}>
        Gestión Clínica en el Momento Oportuno
      </Typography>
    </Box>
  </Box>
);

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await axios.post('http://localhost:8000/api/v1/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      login(response.data.access_token, response.data.role);
      navigate('/');
    } catch (err) {
      setError('Credenciales incorrectas o usuario inactivo');
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f4f6f8'
    }}>
      <Container component="main" maxWidth="sm" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <KairosLogo />

          <Paper elevation={4} sx={{ p: { xs: 4, sm: 5 }, width: '100%', borderRadius: 3, bgcolor: '#ffffff' }}>
            <Typography component="h1" variant="h5" align="center" gutterBottom fontWeight="600" color="#2c3e50" sx={{ mb: 4 }}>
              Iniciar sesión
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
            
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Nombre de usuario"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                <Link href="#" variant="body2" sx={{ color: '#00C4B4', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Clave"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        sx={{ color: '#00C4B4' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Button 
                type="submit" 
                fullWidth 
                variant="contained" 
                sx={{ 
                  mt: 4, 
                  mb: 2, 
                  py: 1.5, 
                  bgcolor: '#00C4B4', 
                  '&:hover': { bgcolor: '#00a396' },
                  fontWeight: 'bold',
                  fontSize: '1.05rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(0, 196, 180, 0.4)'
                }}
              >
                INGRESAR
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
      
      <Box component="footer" sx={{ py: 3, px: 4, mt: 'auto', backgroundColor: '#8c959c', color: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
               <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.9 }}>
                 Hospital de Alta Complejidad
               </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Kairos EHR V. 1.0.0
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
