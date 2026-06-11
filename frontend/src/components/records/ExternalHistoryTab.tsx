import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, List, ListItem, ListItemButton, ListItemText,
  CircularProgress, Alert, Divider, Chip, Grid, IconButton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

interface ExternalHistoryTabProps {
  patientId: string;
}

export const ExternalHistoryTab: React.FC<ExternalHistoryTabProps> = ({ patientId }) => {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [cachedDates, setCachedDates] = useState<Record<string, string>>({});

  // Fetch domains (ITI-67)
  const { data: domainsData, isLoading: isLoadingDomains, isError: isErrorDomains, error: domainsError, refetch: refetchDomains, isFetching: isFetchingDomains } = useQuery({
    queryKey: ['ips-domains', patientId],
    queryFn: async () => (await api.get(`patients/${patientId}/ips-domains`)).data,
    enabled: !!patientId,
    retry: 1
  });

  // Fetch document (ITI-68)
  const { data: docData, isLoading: isLoadingDoc, isError: isErrorDoc, error: docError } = useQuery({
    queryKey: ['ips-document', patientId, selectedUrl],
    queryFn: async () => (await api.get(`patients/${patientId}/ips-document?url=${encodeURIComponent(selectedUrl!)}`)).data,
    enabled: !!selectedUrl,
    enabled: !!selectedUrl,
    retry: 0 // No reintentar si el nodo está caído
  });

  useEffect(() => {
    if (docData && selectedUrl) {
      const compDate = docData.entry?.find((e: any) => e.resource?.resourceType === 'Composition')?.resource?.date;
      if (compDate && !cachedDates[selectedUrl]) {
        setCachedDates(prev => ({ ...prev, [selectedUrl]: new Date(compDate).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) }));
      }
    }
  }, [docData, selectedUrl, cachedDates]);

  const getDomainName = (url: string) => {
    try {
      const { hostname } = new URL(url);
      return hostname;
    } catch {
      return url;
    }
  };

  const getIdFromUrl = (url: string) => {
    try {
      const parts = url.split('/');
      return parts[parts.length - 1] || 'Desconocido';
    } catch {
      return 'Desconocido';
    }
  };

  const renderLeftPanel = () => {
    if (isLoadingDomains) return <Box p={3} textAlign="center"><CircularProgress /></Box>;
    if (isErrorDomains) return <Box p={3}><Alert severity="error">Error al buscar dominios: {(domainsError as Error).message}</Alert></Box>;
    
    let entries = domainsData?.entry || [];
    entries = [...entries].sort((a, b) => {
      const urlA = a?.resource?.content?.[0]?.attachment?.url || '';
      const urlB = b?.resource?.content?.[0]?.attachment?.url || '';
      const idA = parseInt(getIdFromUrl(urlA) || '0', 10);
      const idB = parseInt(getIdFromUrl(urlB) || '0', 10);
      return idB - idA;
    });
    
    if (entries.length === 0) {
      return <Box p={3}><Alert severity="info">El paciente no posee registros en otros dominios.</Alert></Box>;
    }

    return (
      <List disablePadding>
        {entries.map((entry: any, index: number) => {
          const url = entry?.resource?.content?.[0]?.attachment?.url;
          if (!url) return null;
          const domainName = getDomainName(url);
          const bundleId = getIdFromUrl(url);
          const isSelected = selectedUrl === url;
          const docDateRaw = entry?.resource?.date || entry?.resource?.content?.[0]?.attachment?.creation || entry?.resource?.timestamp || entry?.resource?.meta?.lastUpdated || entry?.resource?.indexed || entry?.resource?.created || domainsData?.timestamp;
          let docDate = docDateRaw ? new Date(docDateRaw).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : null;
          if (cachedDates[url]) {
            docDate = cachedDates[url];
          }

          return (
            <ListItem key={index} disablePadding>
              <ListItemButton 
                selected={isSelected}
                onClick={() => setSelectedUrl(url)}
                sx={{
                  borderLeft: 4,
                  borderColor: isSelected ? 'primary.main' : 'transparent',
                  bgcolor: isSelected ? 'action.selected' : 'background.paper',
                  mb: 1,
                  borderRadius: 1
                }}
              >
                <ListItemText 
                  primary={domainName} 
                  secondary={
                    <React.Fragment>
                      <Typography variant="body2" component="div" sx={{ mb: docDate ? 0.5 : 0, mt: 0.5 }}>
                        IPS ID: {bundleId}
                      </Typography>
                      {docDate && (
                        <Typography variant="caption" color="text.secondary" component="div">
                          Generado: {docDate}
                        </Typography>
                      )}
                    </React.Fragment>
                  }
                  primaryTypographyProps={{ fontWeight: isSelected ? 'bold' : 'medium' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    );
  };

  const renderRightPanel = () => {
    if (!selectedUrl) return (
      <Box p={5} textAlign="center" height="100%" display="flex" alignItems="center" justifyContent="center">
        <Typography color="text.secondary">Seleccione un dominio a la izquierda para ver su Resumen Clínico.</Typography>
      </Box>
    );
    if (isLoadingDoc) return <Box p={5} textAlign="center"><CircularProgress /><Typography mt={2}>Conectando con el nodo...</Typography></Box>;
    if (isErrorDoc || docData?.status === 'error' || docData?.error) {
      const errMsg = docData?.message || docData?.error || (docError as Error).message;
      return <Box p={3}><Alert severity="warning">No se pudo recuperar la información del nodo remoto. Error: {errMsg}</Alert></Box>;
    }

    const bundleEntries = docData?.entry || [];
    if (bundleEntries.length === 0) {
      return <Box p={3}><Alert severity="info">El documento recuperado está vacío o no tiene formato válido.</Alert></Box>;
    }

    // Parse resources
    const allergies: any[] = [];
    const problems: any[] = [];
    const medications: any[] = [];
    const immunizations: any[] = [];

    bundleEntries.forEach((e: any) => {
      const res = e.resource;
      if (!res) return;
      if (res.resourceType === 'AllergyIntolerance') allergies.push(res);
      if (res.resourceType === 'Condition') problems.push(res);
      if (res.resourceType === 'MedicationStatement' || res.resourceType === 'MedicationRequest') medications.push(res);
      if (res.resourceType === 'Immunization') immunizations.push(res);
    });

    const getCodeText = (codeObj: any) => {
      return codeObj?.text || codeObj?.coding?.[0]?.display || 'Sin descripción';
    };

    return (
      <Box p={3}>
        <Typography variant="h5" fontWeight="bold" mb={3} color="primary.main">
          Resumen Clínico ({getDomainName(selectedUrl)}) ID: {getIdFromUrl(selectedUrl)}
          {cachedDates[selectedUrl] && <Typography component="span" variant="h6" color="text.secondary" ml={1}>| Generado: {cachedDates[selectedUrl]}</Typography>}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }} elevation={1}>
              <Typography variant="h6" color="error.main" mb={2}>Alergias</Typography>
              <Divider sx={{ mb: 2 }} />
              {allergies.length === 0 ? <Typography variant="body2" color="text.secondary">No registra</Typography> : (
                <List dense disablePadding>
                  {allergies.map((a, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemText 
                        primary={getCodeText(a.code)} 
                        secondary={`Criticidad: ${a.criticality || 'No especificada'} | Estado: ${a.clinicalStatus?.coding?.[0]?.code || 'Activo'}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }} elevation={1}>
              <Typography variant="h6" color="warning.main" mb={2}>Problemas / Diagnósticos</Typography>
              <Divider sx={{ mb: 2 }} />
              {problems.length === 0 ? <Typography variant="body2" color="text.secondary">No registra</Typography> : (
                <List dense disablePadding>
                  {problems.map((p, i) => {
                    return (
                      <ListItem key={i} disableGutters>
                        <ListItemText 
                          primary={getCodeText(p.code)} 
                          secondary={`Estado: ${p.clinicalStatus?.coding?.[0]?.code || 'Activo'}`} 
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }} elevation={1}>
              <Typography variant="h6" color="info.main" mb={2}>Medicación Activa</Typography>
              <Divider sx={{ mb: 2 }} />
              {medications.length === 0 ? <Typography variant="body2" color="text.secondary">No registra</Typography> : (
                <List dense disablePadding>
                  {medications.map((m, i) => {
                    const medName = m.medicationCodeableConcept ? getCodeText(m.medicationCodeableConcept) : 'Medicación especificada por referencia';
                    return (
                      <ListItem key={i} disableGutters>
                        <ListItemText 
                          primary={medName} 
                          secondary={`Estado: ${m.status}`} 
                        />
                      </ListItem>
                    )
                  })}
                </List>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }} elevation={1}>
              <Typography variant="h6" color="success.main" mb={2}>Vacunas Aplicadas</Typography>
              <Divider sx={{ mb: 2 }} />
              {immunizations.length === 0 ? <Typography variant="body2" color="text.secondary">No registra</Typography> : (
                <List dense disablePadding>
                  {immunizations.map((v, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemText 
                        primary={getCodeText(v.vaccineCode)} 
                        secondary={`Fecha: ${v.occurrenceDateTime ? new Date(v.occurrenceDateTime).toLocaleDateString() : 'Desconocida'} | Estado: ${v.status}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', minHeight: 600, overflow: 'hidden', border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Box sx={{ width: 320, minWidth: 320, borderRight: 1, borderColor: 'divider', bgcolor: '#f8fafc', p: 2, overflowY: 'auto', flexShrink: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold" color="text.secondary">Nodos Federados con IPS</Typography>
          <Tooltip title="Actualizar Registros (ITI-67)">
            <IconButton size="small" onClick={() => refetchDomains()} disabled={isFetchingDomains}>
              {isFetchingDomains ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        {renderLeftPanel()}
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.paper', p: 1 }}>
        {renderRightPanel()}
      </Box>
    </Box>
  );
};
