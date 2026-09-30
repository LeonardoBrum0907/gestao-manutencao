import { Navigate, Route, Routes } from "react-router-dom";
import { FactoriesPage } from "../modules/cadastro/ui/FactoriesPage";
import { MachinesPage } from "../modules/cadastro/ui/MachinesPage";
import { RolesPage } from "../modules/cadastro/ui/RolesPage";
import { TechniciansPage } from "../modules/cadastro/ui/TechniciansPage";
import { CapturePage } from "../modules/registro/ui/CapturePage";
import { FollowUpPage } from "../modules/registro/ui/FollowUpPage";
import { RecordSheetPage } from "../modules/registro/ui/RecordSheetPage";
import { RecordsPage } from "../modules/registro/ui/RecordsPage";
import { AppShell } from "../shell/ui/AppShell";
import { LoginPage } from "../shell/ui/LoginPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/captura" element={<CapturePage />} />
        <Route path="/acompanhamento" element={<FollowUpPage />} />
        <Route path="/registros" element={<RecordsPage />} />
        <Route path="/registros/:id" element={<RecordSheetPage />} />
        <Route path="/cadastro/fabricas" element={<FactoriesPage />} />
        <Route path="/cadastro/maquinas" element={<MachinesPage />} />
        <Route path="/cadastro/funcoes" element={<RolesPage />} />
        <Route path="/cadastro/tecnicos" element={<TechniciansPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/captura" replace />} />
    </Routes>
  );
}
