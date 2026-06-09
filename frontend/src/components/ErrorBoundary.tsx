import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box p={3} bgcolor="error.main" color="error.contrastText" borderRadius={2}>
          <Typography variant="h6">¡Ups! Algo salió mal.</Typography>
          <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', mt: 1 }}>
            {this.state.error?.toString()}
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
