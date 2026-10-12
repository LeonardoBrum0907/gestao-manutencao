// Anexos e documentos abrem no navegador (PDF e imagem numa guia nova) em vez de baixar; o nome fica
// no cabeçalho para quem salvar. Pedido do Léo na thread "5. Documentação técnica por máquina".
export function inlineDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
