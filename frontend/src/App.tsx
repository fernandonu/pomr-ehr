import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import Dashboard from './pages/Dashboard';
import ClinicalWorkspace from './pages/ClinicalWorkspace';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: '#2b5ea8',
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
  },
  shape: {
    borderRadius: 8,
  },
});

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // Bypass auth for now to allow development flow
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" />;
  // }
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* <Route path="/login" element={<Login />} /> */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
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
