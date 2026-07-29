"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface EmployeeOption {
  id: string;
  name: string;
}

interface EmployeeQuickSearchProps {
  placeholder?: string;
  onSelect: (employee: EmployeeOption) => void;
  className?: string;
}

/** Busca com autocomplete para pular direto para um funcionário, em vez de navegar ano/mês. */
export function EmployeeQuickSearch({
  placeholder = "Buscar funcionário...",
  onSelect,
  className,
}: EmployeeQuickSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmployeeOption[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) return; // limpo já é tratado em handleQueryChange

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/employees?search=${encodeURIComponent(query)}&status=ACTIVE&limit=8`,
          { signal: controller.signal },
        );
        const json = await res.json();
        setResults(json.success ? json.data : []);
        setOpen(true);
      } catch {
        // busca cancelada (nova digitação) ou falhou de rede — ignora
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="pl-10"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-slate-900/[0.08]">
          {results.map((emp) => (
            <button
              key={emp.id}
              type="button"
              className="flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent"
              onClick={() => {
                onSelect(emp);
                setQuery("");
                setResults([]);
                setOpen(false);
              }}
            >
              {emp.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
