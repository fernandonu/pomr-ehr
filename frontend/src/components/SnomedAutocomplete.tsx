import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { api } from '../services/api';

interface SnomedConcept {
  conceptid: string;
  term: string;
}

interface SnomedAutocompleteProps {
  label: string;
  onSelect: (conceptId: string, term: string) => void;
  selectedConceptId?: string;
  selectedTerm?: string;
  searchEndpoint?: string;
}

export const SnomedAutocomplete: React.FC<SnomedAutocompleteProps> = ({ 
  label, 
  onSelect, 
  selectedConceptId = '', 
  selectedTerm = '',
  searchEndpoint = '/snomed/search'
}) => {
  const [inputValue, setInputValue] = useState(selectedTerm);
  const [options, setOptions] = useState<SnomedConcept[]>([]);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<SnomedConcept | null>(
    selectedConceptId && selectedTerm ? { conceptid: selectedConceptId, term: selectedTerm } : null
  );

  // Reset internal state if props are cleared externally (e.g. form reset)
  useEffect(() => {
    if (!selectedConceptId && !selectedTerm) {
      setInputValue('');
      setValue(null);
    }
  }, [selectedConceptId, selectedTerm]);

  useEffect(() => {
    let active = true;

    if (inputValue.length < 3) {
      setOptions(value ? [value] : []);
      return undefined;
    }

    setLoading(true);

    const fetchSnomed = async () => {
      try {
        const response = await api.get(`${searchEndpoint}?q=${encodeURIComponent(inputValue)}`);
        if (active) {
          setOptions(response.data);
        }
      } catch (error) {
        console.error("Error fetching SNOMED concepts", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSnomed();
    }, 500);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [inputValue, value]);

  return (
    <React.Fragment>
      <Autocomplete
        fullWidth
        margin="dense"
        getOptionLabel={(option) => typeof option === 'string' ? option : option.term}
        filterOptions={(x) => x}
        options={options}
        autoComplete
        includeInputInList
        filterSelectedOptions
        value={value}
        noOptionsText={inputValue.length < 3 ? "Escribe al menos 3 letras..." : "Sin resultados"}
        onChange={(event: any, newValue: SnomedConcept | null) => {
          setOptions(newValue ? [newValue, ...options] : options);
          setValue(newValue);
          if (newValue) {
            onSelect(newValue.conceptid, newValue.term);
          } else {
            onSelect('', '');
          }
        }}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        renderInput={(params) => (
          <TextField 
            {...params} 
            label={label} 
            fullWidth 
            margin="dense"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps?.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
      />
      <TextField 
        margin="dense"
        label="Código SNOMED"
        fullWidth
        value={value?.conceptid || ''}
        InputProps={{
          readOnly: true,
        }}
      />
    </React.Fragment>
  );
};
