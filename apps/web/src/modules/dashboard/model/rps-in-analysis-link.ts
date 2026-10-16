/**
 * Para onde vai "RPs em análise": a lista de RPs em análise, na fábrica escolhida no Dashboard. O número do quadro já
 * conta só essa fábrica; sem levar a fábrica, a lista abria com as RPs de todas e mostrava mais do que o quadro.
 * @example rpsInAnalysisLink("fab_2") // "/rp?status=analysis&factoryId=fab_2"
 * @example rpsInAnalysisLink(null) // "/rp?status=analysis"
 */
export function rpsInAnalysisLink(factoryId: string | null): string {
  const search = new URLSearchParams({ status: "analysis" });
  if (factoryId) search.set("factoryId", factoryId);
  return `/rp?${search.toString()}`;
}
