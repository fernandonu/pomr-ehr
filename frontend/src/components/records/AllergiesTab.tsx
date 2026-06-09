import React, { useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { SnomedAutocomplete } from '../SnomedAutocomplete';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export const AllergiesTab = ({ patientId, allergies = [] }: { patientId: string, allergies?: any[] }) => {
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const canEditClinic = role === 'superadmin' || role === 'equipo_sanitario';
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ snomed_concept_id: '', descripcion: '', severidad: '', reaccion: '', estado: 'activo' });

  const mutation = useMutation({
    mutationFn: async (data: any) => await api.post('/records/allergy', { ...data, paciente_id: Number(patientId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', patientId] });
      setOpen(false);
      setFormData({ snomed_concept_id: '', descripcion: '', severidad: '', reaccion: '', estado: 'activo' });
    }
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
        <Typography variant="h6" fontWeight="bold">Alergias Registradas</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disableElevation>+ Añadir Alergia</Button>
      </Box>
      {allergies.length === 0 ? (
        <Typography color="text.secondary">No hay alergias registradas.</Typography>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {allergies.map(a => (
            <ListItem key={a.id} divider>
              <ListItemText 
                primary={a.descripcion ? `${a.descripcion} (${a.snomed_concept_id})` : a.snomed_concept_id} 
                secondary={`Severidad: ${a.severidad || 'N/A'} | Reacción: ${a.reaccion || 'N/A'} | Estado: ${a.estado.toUpperCase()}`} 
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Nueva Alergia</DialogTitle>
        <DialogContent>
           <SnomedAutocomplete 
              label="Buscar Alergia (SNOMED CT)"
              selectedConceptId={formData.snomed_concept_id}
              selectedTerm={formData.descripcion}
              onSelect={(conceptId, term) => setFormData({...formData, snomed_concept_id: conceptId, descripcion: term})}
           />
           <TextField margin="dense" label="Severidad" fullWidth value={formData.severidad} onChange={e => setFormData({...formData, severidad: e.target.value})} />
           <TextField margin="dense" label="Reacción" fullWidth value={formData.reaccion} onChange={e => setFormData({...formData, reaccion: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => mutation.mutate(formData)} disabled={!formData.snomed_concept_id || mutation.isPending}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
