import React, { useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { SnomedAutocomplete } from '../SnomedAutocomplete';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

export const VaccinesTab = ({ patientId, vaccines = [] }: { patientId: string, vaccines?: any[] }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ snomed_concept_id: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], lote: '', observaciones: '' });

  const mutation = useMutation({
    mutationFn: async (data: any) => await api.post('/records/vaccine', { ...data, paciente_id: Number(patientId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', patientId] });
      setOpen(false);
      setFormData({ snomed_concept_id: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], lote: '', observaciones: '' });
    }
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
        <Typography variant="h6" fontWeight="bold">Vacunas</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disableElevation>+ Registrar Vacuna</Button>
      </Box>
      {vaccines.length === 0 ? (
        <Typography color="text.secondary">No hay vacunas registradas.</Typography>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {vaccines.map(v => (
            <ListItem key={v.id} divider>
              <ListItemText 
                primary={v.descripcion ? `${v.descripcion} (${v.snomed_concept_id})` : v.snomed_concept_id} 
                secondary={`Fecha: ${v.fecha} | Lote: ${v.lote || 'N/A'} | Obs: ${v.observaciones || '-'}`} 
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Registrar Vacuna</DialogTitle>
        <DialogContent>
           <SnomedAutocomplete 
              label="Buscar Vacuna (SNOMED CT)"
              selectedConceptId={formData.snomed_concept_id}
              selectedTerm={formData.descripcion}
              onSelect={(conceptId, term) => setFormData({...formData, snomed_concept_id: conceptId, descripcion: term})}
           />
           <TextField margin="dense" label="Fecha de Aplicación" type="date" fullWidth value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} InputLabelProps={{ shrink: true }} />
           <TextField margin="dense" label="Lote" fullWidth value={formData.lote} onChange={e => setFormData({...formData, lote: e.target.value})} />
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
