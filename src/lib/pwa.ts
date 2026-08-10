'use client';

import { useEffect, useState } from 'react';

// True cuando la app corre como PWA instalada (display: standalone). En ese modo
// abrir un PDF inline atrapa al usuario sin botón de volver, así que conviene
// descargarlo (?dl=1) para que el sistema muestre su visor con "Listo"/atrás.
export function useIsStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const mm = window.matchMedia?.('(display-mode: standalone)');
    const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setStandalone(Boolean(mm?.matches) || iosStandalone);
  }, []);
  return standalone;
}
