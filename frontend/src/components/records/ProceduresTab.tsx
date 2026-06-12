import React, { useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { SnomedAutocomplete } from '../SnomedAutocomplete';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

export const ProceduresTab = ({ patientId, procedures = [] }: { patientId: string, procedures?: any[] }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ snomed_concept_id: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], observaciones: '' });

  const mutation = useMutation({
    mutationFn: async (data: any) => await api.post('/records/procedure', { ...data, paciente_id: Number(patientId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', patientId] });
      setOpen(false);
      setFormData({ snomed_concept_id: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], observaciones: '' });
    }
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
        <Typography variant="h6" fontWeight="bold">Procedimientos</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disableElevation>+ Registrar Procedimiento</Button>
      </Box>
      {procedures.length === 0 ? (
        <Typography color="text.secondary">No hay procedimientos registrados.</Typography>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {procedures.map(p => (
            <ListItem key={p.id} divider>
              <ListItemText 
                primary={p.descripcion ? `${p.descripcion} (${p.snomed_concept_id})` : p.snomed_concept_id} 
                secondary={`Fecha: ${p.fecha} | Observaciones: ${p.observaciones || '-'}`} 
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Registrar Procedimiento</DialogTitle>
        <DialogContent>
           <SnomedAutocomplete 
              label="Buscar Procedimiento (SNOMED CT)"
              selectedConceptId={formData.snomed_concept_id}
              selectedTerm={formData.descripcion}
              onSelect={(conceptId, term) => setFormData({...formData, snomed_concept_id: conceptId, descripcion: term})}
              searchEndpoint="/snomed/search-procedures"
           />
           <TextField margin="dense" label="Fecha" type="date" fullWidth value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} InputLabelProps={{ shrink: true }} />
           <TextField margin="dense" label="Observaciones" fullWidth value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => mutation.mutate(formData)} disabled={!formData.snomed_concept_id || mutation.isPending}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
