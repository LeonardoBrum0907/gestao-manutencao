import { Card, PageTitle } from "../../../design/ui/controls";
import { useRoles } from "../data/cadastro";

export function RolesPage() {
  const roles = useRoles();
  return (
    <div>
      <PageTitle
        eyebrow="Apoio"
        title="Funções"
        text="As seis funções do SIGEM. Cadastro fechado: só leitura."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {roles.data?.map((role) => (
          <Card key={role.id}>
            <p className="font-medium capitalize">{role.name}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
