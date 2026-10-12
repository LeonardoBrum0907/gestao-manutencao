import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { MembersPage } from "../modules/cadastro/ui/MembersPage";
import { TeamsPage } from "../modules/cadastro/ui/TeamsPage";
import { TeamMatrixPage } from "../modules/competencia/ui/TeamMatrixPage";
import { TeamSheetPage } from "../modules/competencia/ui/TeamSheetPage";
import { MemberPage } from "../modules/colaborador/ui/MemberPage";
import { ReportPage } from "../modules/colaborador/ui/ReportPage";
import { SettingsPage } from "../modules/configuracoes/ui/SettingsPage";
import { DashboardPage } from "../modules/dashboard/ui/DashboardPage";
import { AttentionSheetPage } from "../modules/maquina/ui/AttentionSheetPage";
import { DocumentationPage } from "../modules/documentacao/ui/DocumentationPage";
import { MachinePage } from "../modules/maquina/ui/MachinePage";
import { MachinesPage } from "../modules/maquina/ui/MachinesPage";
import { PostPreventiveListPage } from "../modules/pos-preventiva/ui/PostPreventiveListPage";
import { NewPostPreventivePage, PostPreventivePage } from "../modules/pos-preventiva/ui/PostPreventivePage";
import { FollowUpPage } from "../modules/registro/ui/FollowUpPage";
import { InboxPage } from "../modules/registro/ui/InboxPage";
import { RecordSheetPage } from "../modules/registro/ui/RecordSheetPage";
import { RpEditPage } from "../modules/rp/ui/RpEditPage";
import { RpListPage } from "../modules/rp/ui/RpListPage";
import { RpPastePage } from "../modules/rp/ui/RpPastePage";
import { ChamadosPage } from "../modules/turno/ui/ChamadosPage";
import { AppShell } from "../shell/ui/AppShell";
import { LoginPage } from "../shell/ui/LoginPage";

// A matriz passou a morar na ficha do colaborador.
function MatrixRedirect() {
  const { memberId } = useParams();
  return <Navigate to={`/cadastro/colaboradores/${memberId}/matriz`} replace />;
}

// Pendências virou Registros: o endereço antigo (links do painel, favoritos) leva junto o filtro da URL.
function FollowUpRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/registros${search}`} replace />;
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
        <Route path="/entrada" element={<InboxPage />} />
        <Route path="/captura" element={<Navigate to="/entrada" replace />} />
        <Route path="/registros" element={<FollowUpPage />} />
        <Route path="/acompanhamento" element={<FollowUpRedirect />} />
        <Route path="/turno/chamados" element={<ChamadosPage />} />
        <Route path="/turno/chamado" element={<Navigate to="/turno/chamados?abrir=novo" replace />} />
        {/* Ocorrência saiu do menu: anotar um problema rápido é na Entrada. */}
        <Route path="/turno/ocorrencia" element={<Navigate to="/entrada" replace />} />
        <Route path="/rp" element={<RpListPage />} />
        <Route path="/rp/novo" element={<RpPastePage />} />
        <Route path="/rp/:id" element={<RpEditPage />} />
        <Route path="/pos-preventiva" element={<PostPreventiveListPage />} />
        <Route path="/pos-preventiva/nova" element={<NewPostPreventivePage />} />
        <Route path="/pos-preventiva/:id" element={<PostPreventivePage />} />
        <Route path="/maquinas" element={<MachinesPage />} />
        <Route path="/maquinas/:id" element={<MachinePage />} />
        <Route path="/maquinas/:id/folha" element={<AttentionSheetPage />} />
        <Route path="/documentacao" element={<DocumentationPage />} />
        <Route path="/registros/:id" element={<RecordSheetPage />} />
        <Route path="/cadastro/colaboradores" element={<MembersPage />} />
        <Route path="/cadastro/colaboradores/:memberId/relatorio" element={<ReportPage />} />
        <Route path="/cadastro/colaboradores/:memberId/:tab?" element={<MemberPage />} />
        <Route path="/cadastro/tecnicos" element={<Navigate to="/cadastro/colaboradores" replace />} />
        <Route path="/cadastro/equipes" element={<TeamsPage />} />
        <Route path="/configuracoes/:tab?" element={<SettingsPage />} />
        {settingsRedirects.map(([from, tab]) => (
          <Route key={from} path={from} element={<Navigate to={`/configuracoes/${tab}`} replace />} />
        ))}
        <Route path="/competencias" element={<TeamMatrixPage />} />
        <Route path="/competencias/folha" element={<TeamSheetPage />} />
        <Route path="/competencias/:memberId" element={<MatrixRedirect />} />
      </Route>
      <Route path="*" element={<Navigate to="/entrada" replace />} />
    </Routes>
  );
}
