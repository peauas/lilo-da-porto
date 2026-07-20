import { Users, FileText, Wrench, TrendingUp, CheckCircle2 } from "lucide-react";

const employees = [
  { name: "Ana Souza", role: "Recepção", initials: "AS", color: "bg-[#00AAF6]" },
  { name: "Carlos Lima", role: "Cozinha", initials: "CL", color: "bg-[#0066cc]" },
  { name: "Marina Reis", role: "Limpeza", initials: "MR", color: "bg-[#003087]" },
];

export function AuthShowcase() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#001b4d] via-[#003087] to-[#0066cc] p-10 lg:flex lg:flex-col lg:justify-between">
      {/* Decorative circles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5"
      />

      {/* Preview cards */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm space-y-4">
          {/* Employees card */}
          <div className="animate-fade-in rounded-2xl bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">Funcionários</p>
                  <p className="text-xs text-muted-foreground">12 ativos</p>
                </div>
              </div>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                Equipe
              </span>
            </div>
            <ul className="space-y-3">
              {employees.map((employee) => (
                <li key={employee.name} className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground ${employee.color}`}
                  >
                    {employee.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {employee.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{employee.role}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                </li>
              ))}
            </ul>
          </div>

          {/* Payroll + services cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="animate-fade-in rounded-2xl bg-card p-4 shadow-2xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <p className="mt-3 text-xs text-muted-foreground">Folhas do mês</p>
              <p className="text-xl font-bold text-card-foreground">R$ 48.750</p>
              <div className="mt-1 flex items-center gap-1 text-xs font-medium text-[#059669]">
                <TrendingUp className="h-3 w-3" />
                <span>+8,2%</span>
              </div>
            </div>
            <div className="animate-fade-in rounded-2xl bg-card p-4 shadow-2xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <Wrench className="h-5 w-5" />
              </span>
              <p className="mt-3 text-xs text-muted-foreground">Serviços</p>
              <p className="text-xl font-bold text-card-foreground">34</p>
              <p className="mt-1 text-xs text-muted-foreground">concluídos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="relative text-center">
        <h2 className="text-2xl font-bold text-primary-foreground text-balance">
          Gerencie sua equipe com facilidade.
        </h2>
        <p className="mt-2 text-sm text-primary-foreground/70 text-pretty">
          Tudo o que você precisa para controlar funcionários, folhas e serviços em um só lugar.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="h-2 w-6 rounded-full bg-primary-foreground" />
          <span className="h-2 w-2 rounded-full bg-primary-foreground/40" />
          <span className="h-2 w-2 rounded-full bg-primary-foreground/40" />
        </div>
      </div>
    </div>
  );
}
