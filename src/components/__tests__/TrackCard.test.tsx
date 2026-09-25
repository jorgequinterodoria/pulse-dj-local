import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TrackCard } from '../TrackCard';
import { Track } from '../../types';

// 1. Simulamos el diccionario de idiomas que ahora requiere el componente
const mockDict = {
  unknown: "Desconocido"
};

// 2. Simulamos una canción con TODAS las propiedades requeridas
const mockTrack: Track = {
  id: "123",
  title: "Test Track",
  artist: "Test Artist",
  bpm: 128,
  key: "8A",
  energy: 7,
  rating: 5,
  location: "/Users/jorgequintero/Music/test.mp3"
};

describe('TrackCard', () => {
  it('renders track information correctly', () => {
    const { getByText } = render(
      <TrackCard 
        track={mockTrack} 
        index={0} 
        dict={mockDict} 
      />
    );
    
    // Verificamos que el componente se renderiza sin errores
    expect(getByText('Test Track')).toBeDefined();
    expect(getByText('Test Artist')).toBeDefined();
    expect(getByText('8A')).toBeDefined();
    expect(getByText('128')).toBeDefined();
  });
});