import React, { useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { SnomedAutocomplete } from '../SnomedAutocomplete';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

export const MedicationsTab = ({ patientId, medications = [], problems = [] }: { patientId: string, medications?: any[], problems?: any[] }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ snomed_concept_id: '', descripcion: '', dosis: '', frecuencia: '', via: '', fecha_inicio: new Date().toISOString().split('T')[0], estado: 'activo', problema_id: '' });
  const activeProblems = problems.filter(p => p.estado === 'activo');

  const mutation = useMutation({
    mutationFn: async (data: any) => await api.post('/records/medication', { ...data, paciente_id: Number(patientId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', patientId] });
      setOpen(false);
      setFormData({ snomed_concept_id: '', descripcion: '', dosis: '', frecuencia: '', via: '', fecha_inicio: new Date().toISOString().split('T')[0], estado: 'activo', problema_id: '' });
    }
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
        <Typography variant="h6" fontWeight="bold">Medicación</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} disableElevation>+ Añadir Medicación</Button>
      </Box>
      {medications.length === 0 ? (
        <Typography color="text.secondary">No hay medicación registrada.</Typography>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {medications.map(m => (
            <ListItem key={m.id} divider>
              <ListItemText 
                primary={m.descripcion ? `${m.descripcion} (${m.snomed_concept_id})` : m.snomed_concept_id} 
                secondary={
                  <>
                    <Box component="span" fontWeight="bold" color="primary.main">Problema: {problems.find(p => p.id === m.problema_id)?.description || 'Desconocido'}</Box>
                    <br />
                    {`Dosis: ${m.dosis} | Frecuencia: ${m.frecuencia} | Vía: ${m.via} | Desde: ${m.fecha_inicio} | Estado: ${m.estado.toUpperCase()}`}
                  </>
                } 
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Nueva Medicación</DialogTitle>
        <DialogContent>
           <SnomedAutocomplete 
              label="Buscar Medicamento (SNOMED CT)"
              selectedConceptId={formData.snomed_concept_id}
              selectedTerm={formData.descripcion}
              onSelect={(conceptId, term) => setFormData({...formData, snomed_concept_id: conceptId, descripcion: term})}
              searchEndpoint="/snomed/search-medications"
           />
           <FormControl fullWidth margin="dense" required>
              <InputLabel>Asignar a Problema Activo</InputLabel>
              <Select
                value={formData.problema_id}
                label="Asignar a Problema Activo"
                onChange={e => setFormData({...formData, problema_id: e.target.value as string})}
              >
                {activeProblems.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.description}</MenuItem>
                ))}
                {activeProblems.length === 0 && <MenuItem disabled value="">No hay problemas activos</MenuItem>}
              </Select>
           </FormControl>
           <TextField margin="dense" label="Dosis" fullWidth value={formData.dosis} onChange={e => setFormData({...formData, dosis: e.target.value})} />
           <TextField margin="dense" label="Frecuencia" fullWidth value={formData.frecuencia} onChange={e => setFormData({...formData, frecuencia: e.target.value})} />
           <TextField margin="dense" label="Vía de administración" fullWidth value={formData.via} onChange={e => setFormData({...formData, via: e.target.value})} />
           <TextField margin="dense" label="Fecha de Inicio" type="date" fullWidth value={formData.fecha_inicio} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => mutation.mutate(formData)} disabled={!formData.snomed_concept_id || !formData.problema_id || mutation.isPending}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
