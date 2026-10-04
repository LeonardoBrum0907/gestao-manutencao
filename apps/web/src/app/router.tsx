import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { FactoriesPage } from "../modules/cadastro/ui/FactoriesPage";
import { DashboardPage } from "../modules/dashboard/ui/DashboardPage";
import { CompetenciesPage } from "../modules/cadastro/ui/CompetenciesPage";
import { GradesPage } from "../modules/cadastro/ui/GradesPage";
import { MachinesPage } from "../modules/cadastro/ui/MachinesPage";
import { RolesPage } from "../modules/cadastro/ui/RolesPage";
import { MembersPage } from "../modules/cadastro/ui/MembersPage";
import { MemberPage } from "../modules/colaborador/ui/MemberPage";
import { TeamsPage } from "../modules/cadastro/ui/TeamsPage";
import { ChamadoPage } from "../modules/turno/ui/ChamadoPage";
import { OcorrenciaPage } from "../modules/turno/ui/OcorrenciaPage";
import { CapturePage } from "../modules/registro/ui/CapturePage";
import { FollowUpPage } from "../modules/registro/ui/FollowUpPage";
import { RecordSheetPage } from "../modules/registro/ui/RecordSheetPage";
import { RecordsPage } from "../modules/registro/ui/RecordsPage";
import { AppShell } from "../shell/ui/AppShell";
import { LoginPage } from "../shell/ui/LoginPage";

// A matriz passou a morar na ficha do colaborador.
function MatrixRedirect() {
  const { memberId } = useParams();
  return <Navigate to={`/cadastro/colaboradores/${memberId}/matriz`} replace />;
}

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
        <Route path="/cadastro/competencias" element={<CompetenciesPage />} />
        <Route path="/cadastro/colaboradores" element={<MembersPage />} />
        <Route path="/cadastro/colaboradores/:memberId/:tab?" element={<MemberPage />} />
        <Route path="/cadastro/tecnicos" element={<Navigate to="/cadastro/colaboradores" replace />} />
        <Route path="/cadastro/equipes" element={<TeamsPage />} />
        <Route path="/competencias" element={<Navigate to="/cadastro/colaboradores" replace />} />
        <Route path="/competencias/:memberId" element={<MatrixRedirect />} />
      </Route>
      <Route path="*" element={<Navigate to="/captura" replace />} />
    </Routes>
  );
}
