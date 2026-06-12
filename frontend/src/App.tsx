import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import PatientList from './pages/PatientList';
import ClinicalWorkspace from './pages/ClinicalWorkspace';
import Login from './pages/Login';
import UsersManager from './pages/UsersManager';
import ApiLogs from './pages/ApiLogs';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: '#00C4B4', // Changed from '#2b5ea8' to match the login theme
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#e35f66',
    },
    background: {
      default: '#f4f6f8',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.3px',
    }
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '6px 16px',
        },
        textInherit: {
          color: 'rgba(255, 255, 255, 0.9)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
          }
        }
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: '#00C4B4',
          color: '#ffffff',
          fontWeight: 600,
        }
      }
    },
  }
});

const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && role && role !== 'superadmin' && !allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PatientList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <UsersManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/api-logs"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <ApiLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:patientId"
              element={
                <ProtectedRoute>
                  <ClinicalWorkspace />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
