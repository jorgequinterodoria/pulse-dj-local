export const getCompatibleKeys = (currentKey: string, isCurveball: boolean): string[] => {
  if (!currentKey || currentKey === "NaN") return [];
  const match = currentKey.match(/^(\d+)([AB])$/);
  if (!match) return [];
  
  const num = parseInt(match[1], 10);
  const letter = match[2];
  
  if (isCurveball) {
    // Curveball: Salto de Energía (+2) o Caída profunda (-3)
    const boost = num + 2 > 12 ? num + 2 - 12 : num + 2;
    const drop = num - 3 < 1 ? num - 3 + 12 : num - 3;
    return [`${boost}${letter}`, `${drop}${letter}`];
  }

  // Armónico tradicional (Misma escala, +1, -1, o cambio de A/B)
  const prev = num === 1 ? 12 : num - 1;
  const next = num === 12 ? 1 : num + 1;
  const oppositeLetter = letter === 'A' ? 'B' : 'A';
  
  return [
    `${num}${letter}`,
    `${prev}${letter}`,
    `${next}${letter}`,
    `${num}${oppositeLetter}`
  ];
};