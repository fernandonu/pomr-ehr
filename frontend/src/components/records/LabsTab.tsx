import React, { useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { SnomedAutocomplete } from '../SnomedAutocomplete';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

export const LabsTab = ({ patientId, labs = [] }: { patientId: string, labs?: any[] }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ snomed_concept_id: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], resultado: '', unidad: '', referencia: '' });

  const mutation = useMutation({
    mutationFn: async (data: any) => await api.post('/records/lab_result', { ...data, paciente_id: Number(patientId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', patientId] });
      setOpen(false);
      setFormData({ snomed_concept_id: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], resultado: '', unidad: '', referencia: '' });
    }
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
        <Typography variant="h6" fontWeight="bold">Laboratorio</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disableElevation>+ Añadir Resultado</Button>
      </Box>
      {labs.length === 0 ? (
        <Typography color="text.secondary">No hay resultados de laboratorio registrados.</Typography>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {labs.map(l => (
            <ListItem key={l.id} divider>
              <ListItemText 
                primary={l.descripcion ? `${l.descripcion} (${l.snomed_concept_id})` : l.snomed_concept_id} 
                secondary={`Fecha: ${l.fecha} | Resultado: ${l.resultado} ${l.unidad || ''} (Ref: ${l.referencia || '-'})`} 
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Añadir Resultado de Laboratorio</DialogTitle>
        <DialogContent>
           <SnomedAutocomplete 
              label="Buscar Examen de Laboratorio (SNOMED CT)"
              selectedConceptId={formData.snomed_concept_id}
              selectedTerm={formData.descripcion}
              onSelect={(conceptId, term) => setFormData({...formData, snomed_concept_id: conceptId, descripcion: term})}
           />
           <TextField margin="dense" label="Fecha" type="date" fullWidth value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} InputLabelProps={{ shrink: true }} />
           <TextField margin="dense" label="Resultado" fullWidth value={formData.resultado} onChange={e => setFormData({...formData, resultado: e.target.value})} />
           <TextField margin="dense" label="Unidad" fullWidth value={formData.unidad} onChange={e => setFormData({...formData, unidad: e.target.value})} />
           <TextField margin="dense" label="Valor de Referencia" fullWidth value={formData.referencia} onChange={e => setFormData({...formData, referencia: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => mutation.mutate(formData)} disabled={!formData.snomed_concept_id || !formData.resultado || mutation.isPending}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
