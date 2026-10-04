import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { MembersPage } from "../modules/cadastro/ui/MembersPage";
import { TeamsPage } from "../modules/cadastro/ui/TeamsPage";
import { MemberPage } from "../modules/colaborador/ui/MemberPage";
import { SettingsPage } from "../modules/configuracoes/ui/SettingsPage";
import { DashboardPage } from "../modules/dashboard/ui/DashboardPage";
import { CapturePage } from "../modules/registro/ui/CapturePage";
import { FollowUpPage } from "../modules/registro/ui/FollowUpPage";
import { RecordSheetPage } from "../modules/registro/ui/RecordSheetPage";
import { ChamadoPage } from "../modules/turno/ui/ChamadoPage";
import { OcorrenciaPage } from "../modules/turno/ui/OcorrenciaPage";
import { AppShell } from "../shell/ui/AppShell";
import { LoginPage } from "../shell/ui/LoginPage";

// A matriz passou a morar na ficha do colaborador.
function MatrixRedirect() {
  const { memberId } = useParams();
  return <Navigate to={`/cadastro/colaboradores/${memberId}/matriz`} replace />;
}

// Endereços antigos dos cadastros, que foram para Configurações.
const settingsRedirects = [
  ["/cadastro/fabricas", "fabricas"],
  ["/cadastro/maquinas", "fabricas"],
  ["/cadastro/funcoes", "funcoes"],
  ["/cadastro/graus", "funcoes"],
  ["/cadastro/competencias", "avaliacao"],
  ["/cadastro/matriz", "avaliacao"],
] as const;

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
        <Route path="/registros" element={<Navigate to="/acompanhamento" replace />} />
        <Route path="/registros/:id" element={<RecordSheetPage />} />
        <Route path="/cadastro/colaboradores" element={<MembersPage />} />
        <Route path="/cadastro/colaboradores/:memberId/:tab?" element={<MemberPage />} />
        <Route path="/cadastro/tecnicos" element={<Navigate to="/cadastro/colaboradores" replace />} />
        <Route path="/cadastro/equipes" element={<TeamsPage />} />
        <Route path="/configuracoes/:tab?" element={<SettingsPage />} />
        {settingsRedirects.map(([from, tab]) => (
          <Route key={from} path={from} element={<Navigate to={`/configuracoes/${tab}`} replace />} />
        ))}
        <Route path="/competencias" element={<Navigate to="/cadastro/colaboradores" replace />} />
        <Route path="/competencias/:memberId" element={<MatrixRedirect />} />
      </Route>
      <Route path="*" element={<Navigate to="/captura" replace />} />
    </Routes>
  );
}
