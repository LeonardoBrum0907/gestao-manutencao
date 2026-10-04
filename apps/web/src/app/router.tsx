import { Navigate, Route, Routes } from "react-router-dom";
import { FactoriesPage } from "../modules/cadastro/ui/FactoriesPage";
import { MatrixPage } from "../modules/competencia/ui/MatrixPage";
import { DashboardPage } from "../modules/dashboard/ui/DashboardPage";
import { GradesPage } from "../modules/cadastro/ui/GradesPage";
import { MachinesPage } from "../modules/cadastro/ui/MachinesPage";
import { RolesPage } from "../modules/cadastro/ui/RolesPage";
import { MembersPage } from "../modules/cadastro/ui/MembersPage";
import { ChamadoPage } from "../modules/turno/ui/ChamadoPage";
import { OcorrenciaPage } from "../modules/turno/ui/OcorrenciaPage";
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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/captura" element={<CapturePage />} />
        <Route path="/acompanhamento" element={<FollowUpPage />} />
        <Route path="/turno/chamado" element={<ChamadoPage />} />
        <Route path="/turno/ocorrencia" element={<OcorrenciaPage />} />
        <Route path="/registros" element={<RecordsPage />} />
        <Route path="/registros/:id" element={<RecordSheetPage />} />
        <Route path="/cadastro/fabricas" element={<FactoriesPage />} />
        <Route path="/cadastro/maquinas" element={<MachinesPage />} />
        <Route path="/cadastro/funcoes" element={<RolesPage />} />
        <Route path="/cadastro/graus" element={<GradesPage />} />
        <Route path="/cadastro/colaboradores" element={<MembersPage />} />
        <Route path="/cadastro/tecnicos" element={<Navigate to="/cadastro/colaboradores" replace />} />
        <Route path="/competencias" element={<MatrixPage />} />
        <Route path="/competencias/:memberId" element={<MatrixPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/captura" replace />} />
    </Routes>
  );
}
