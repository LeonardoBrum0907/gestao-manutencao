import { Link, useNavigate, useParams } from "react-router-dom";
import type { PublicRpDirectoryDto, PublicRpDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { usePublicDirectory, usePublicRp } from "../data/public-rp";
import { newPublicValues, publicRpPath, rememberedMember, valuesFromPublicRp } from "../model/public-rp";
import { PublicRpForm } from "./PublicRpForm";
import { deviceStorage } from "./public-rp-parts";

// O técnico do aparelho já vem marcado, se ainda estiver liberado.
function deviceMember(directory: PublicRpDirectoryDto): string {
  const memberId = rememberedMember(deviceStorage());
  return directory.members.some((member) => member.id === memberId) ? memberId : "";
}

function EditForm({ code, id, directory, onSaved }: { code: string; id: string; directory: PublicRpDirectoryDto; onSaved: (rp: PublicRpDto) => void }) {
  const rp = usePublicRp(code, id);
  if (rp.isPending) return <p className="text-sm text-muted">Carregando RP…</p>;
  if (rp.isError) return <Notice>{errorMessage(rp.error)}</Notice>;
  return <PublicRpForm code={code} directory={directory} initial={valuesFromPublicRp(rp.data)} current={rp.data} onSaved={onSaved} />;
}

/**
 * Novo RP (sem id) ou edição de um RP da página pública.
 * @example <Route path="novo" element={<PublicRpFormPage />} />
 */
export function PublicRpFormPage() {
  const { code = "", id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const directory = usePublicDirectory(code);

  function saved(rp: PublicRpDto) {
    toast({ text: id ? "Alterações gravadas." : "Relatório gravado." });
    navigate(publicRpPath(code, rp.id), { replace: true });
  }

  if (directory.isPending) return <p className="text-sm text-muted">Carregando…</p>;
  if (directory.isError) return <Notice>{errorMessage(directory.error)}</Notice>;

  return (
    <div className="flex flex-col gap-4">
      <Link to={id ? publicRpPath(code, id) : publicRpPath(code)} className="text-sm font-semibold text-accent hover:underline">
        ← {id ? "Voltar para o RP" : "Todos os RPs"}
      </Link>
      <h1 className="font-serif text-2xl font-semibold text-app">{id ? "Editar relatório padrão" : "Novo relatório padrão"}</h1>
      {id ? (
        <EditForm code={code} id={id} directory={directory.data} onSaved={saved} />
      ) : (
        <PublicRpForm code={code} directory={directory.data} initial={newPublicValues(deviceMember(directory.data))} onSaved={saved} />
      )}
    </div>
  );
}
