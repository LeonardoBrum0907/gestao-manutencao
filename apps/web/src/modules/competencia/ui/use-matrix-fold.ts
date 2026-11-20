import { useState } from "react";
import { deviceStorage } from "../../../app/device-storage";
import {
  initialOpenEquipment,
  readCollapsedSubgroups,
  readOpenEquipment,
  saveOpenEquipment,
  subgroupFoldKey,
  toggleCollapsedSubgroup,
} from "../model/matrix-fold";

/** Equipamento aberto e subconjuntos recolhidos da Matriz do colaborador. */
export type MatrixFold = {
  openEquipment: string | null;
  toggleOpenEquipment: (equipment: string) => void;
  isSubgroupOpen: (equipment: string, subgroup: string, query: string) => boolean;
  toggleSubgroup: (equipment: string, subgroup: string) => void;
};

/**
 * Lembra no aparelho o que o gestor abriu e recolheu, para valer ao trocar de colaborador ou voltar à tela.
 * Com busca ativa os subconjuntos ficam todos abertos, para o resultado nunca ficar escondido.
 * @example const fold = useMatrixFold(matrix.equipments, params.get("equipamento")); fold.isSubgroupOpen("eq1", "Desbobinador", query)
 */
export function useMatrixFold(equipments: readonly string[], wanted: string | null): MatrixFold {
  const [openEquipment, setOpenEquipment] = useState(() => initialOpenEquipment(equipments, wanted, readOpenEquipment(deviceStorage())));
  const [collapsed, setCollapsed] = useState(() => readCollapsedSubgroups(deviceStorage()));
  function toggleOpenEquipment(equipment: string) {
    const next = openEquipment === equipment ? null : equipment;
    setOpenEquipment(next);
    saveOpenEquipment(deviceStorage(), next);
  }
  return {
    openEquipment,
    toggleOpenEquipment,
    isSubgroupOpen: (equipment, subgroup, query) => Boolean(query.trim()) || !collapsed.has(subgroupFoldKey(equipment, subgroup)),
    toggleSubgroup: (equipment, subgroup) =>
      setCollapsed(toggleCollapsedSubgroup(deviceStorage(), collapsed, subgroupFoldKey(equipment, subgroup))),
  };
}
