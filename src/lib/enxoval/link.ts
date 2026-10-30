/** O link do enxoval vem do fragmento (ADR 0026): nunca chega ao servidor nem ao Referer. */
export function linkDoHash(hash: string): string | null {
  const bruto = hash.replace(/^#/, '').trim();
  if (!bruto) return null;
  let link = bruto;
  try {
    link = decodeURIComponent(bruto);
  } catch {
    // fica como veio
  }
  // O link tem 32 caracteres alfanuméricos; recusa o que não se parece com ele
  // antes de pôr numa URL da API.
  return /^[A-Za-z0-9_-]{8,128}$/.test(link) ? link : null;
}

/** Segundos que faltam até `ate` (milissegundos de época), nunca negativo. */
export function segundosAte(ate: number, agora: number): number {
  return Math.max(0, Math.ceil((ate - agora) / 1000));
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Só dígitos, no máximo seis. */
export function soDigitos(texto: string): string {
  return texto.replace(/\D/g, '').slice(0, 6);
}
