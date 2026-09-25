import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FilterBar } from '../FilterBar';

const mockDict = {
  activeFilters: "Filtros Activos",
  allFilters: "TODOS LOS FILTROS",
  similar: "Similar",
  fresh: "Fresco",
  curveball: "Sorpresa (Curveball)",
  randomize: "Aleatorizar",
  crates: "Cajones",
  removed: "Eliminadas",
  harmonic: "Coincidencia armónica"
};

const mockFilters = {
  harmonic: true,
  bpmTolerance: 3,
  similar: false,
  fresh: false,
  curveball: false,
  randomize: false,
};

describe('FilterBar', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <FilterBar 
        filters={mockFilters} 
        onToggleFilter={vi.fn()} 
        onCycleBpm={vi.fn()} 
        dict={mockDict} 
      />
    );
    
    // Debería mostrar "Filtros Activos (1)" porque 'harmonic' es true
    expect(getByText('Filtros Activos (1)')).toBeDefined();
  });
});