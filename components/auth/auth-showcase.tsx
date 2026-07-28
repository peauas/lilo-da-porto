"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  Wrench,
  TrendingUp,
  CheckCircle2,
  Puzzle,
} from "lucide-react";

const employees = [
  { name: "Ana Souza", subtitle: "Repasse 70%", initials: "AS", color: "bg-[#00AAF6]" },
  { name: "Carlos Lima", subtitle: "Repasse 65%", initials: "CL", color: "bg-[#0066cc]" },
  { name: "Marina Reis", subtitle: "Repasse 80%", initials: "MR", color: "bg-[#003087]" },
];

const services = [
  { number: "04/4818774-26", date: "23/07", value: "R$ 181,00" },
  { number: "04/4900231-11", date: "24/07", value: "R$ 140,00" },
  { number: "04/4900876-98", date: "25/07", value: "R$ 95,00" },
];

function EmployeesSlide() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="rounded-2xl bg-card p-5 shadow-2xl">
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
                <p className="truncate text-xs text-muted-foreground">{employee.subtitle}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[#059669]" />
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card p-4 shadow-2xl">
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
        <div className="rounded-2xl bg-card p-4 shadow-2xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
            <Wrench className="h-5 w-5" />
          </span>
          <p className="mt-3 text-xs text-muted-foreground">Serviços</p>
          <p className="text-xl font-bold text-card-foreground">34</p>
          <p className="mt-1 text-xs text-muted-foreground">concluídos</p>
        </div>
      </div>
    </div>
  );
}

function PayrollSlide() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-card-foreground">Folha — Carlos Lima</p>
              <p className="text-xs text-muted-foreground">Julho / 2026</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-700">
            Fechada
          </span>
        </div>

        <ul className="space-y-2.5 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Valor bruto</span>
            <span className="font-medium text-card-foreground">R$ 3.200,00</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Percentual aplicado</span>
            <span className="font-medium text-card-foreground">65%</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">INSS</span>
            <span className="font-medium text-card-foreground">− R$ 160,00</span>
          </li>
        </ul>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-primary px-4 py-3">
          <span className="text-xs font-semibold text-primary-foreground/80">VALOR LÍQUIDO</span>
          <span className="text-lg font-bold text-primary-foreground">R$ 2.850,00</span>
        </div>
      </div>
    </div>
  );
}

function ServicesSlide() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
              <Wrench className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-card-foreground">Serviços</p>
              <p className="text-xs text-muted-foreground">Capturados hoje</p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            <Puzzle className="h-3 w-3" />
            Extensão
          </span>
        </div>

        <ul className="space-y-3">
          {services.map((service) => (
            <li key={service.number} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-card-foreground">
                  {service.number}
                </p>
                <p className="text-xs text-muted-foreground">{service.date}</p>
              </div>
              <span className="text-sm font-semibold text-primary">{service.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const slides = [
  {
    Card: EmployeesSlide,
    title: "Gerencie sua equipe com facilidade.",
    description:
      "Tudo o que você precisa para controlar funcionários, folhas e serviços em um só lugar.",
  },
  {
    Card: PayrollSlide,
    title: "Calcule folhas de pagamento em segundos.",
    description:
      "Repasses, descontos e valor líquido calculados automaticamente para cada funcionário.",
  },
  {
    Card: ServicesSlide,
    title: "Capture serviços direto do navegador.",
    description:
      "Nossa extensão para Chrome preenche os dados da ordem de serviço automaticamente.",
  },
];

const AUTO_ADVANCE_MS = 5000;

export function AuthShowcase() {
  const [index, setIndex] = useState(0);

  // O carrossel sempre avança automaticamente. Quem prefere menos movimento
  // (prefers-reduced-motion) ainda vê a troca de slide, só sem a animação de
  // deslizar — isso é feito via CSS (motion-reduce:transition-none abaixo),
  // não desligando o auto-avanço inteiro.
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, []);

  const activeSlide = slides[index];

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

      {/* Slides */}
      <div className="relative flex flex-1 items-center overflow-hidden">
        <div
          className="flex w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map(({ Card }, i) => (
            <div key={i} className="flex w-full shrink-0 items-center justify-center px-1">
              <Card />
            </div>
          ))}
        </div>
      </div>

      {/* Caption */}
      <div className="relative text-center">
        <h2
          key={`title-${index}`}
          className="animate-fade-in text-2xl font-bold text-primary-foreground text-balance"
        >
          {activeSlide.title}
        </h2>
        <p
          key={`desc-${index}`}
          className="animate-fade-in mt-2 text-sm text-primary-foreground/70 text-pretty"
        >
          {activeSlide.description}
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir para o slide ${i + 1}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-primary-foreground" : "w-2 bg-primary-foreground/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
