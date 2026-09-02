"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatBRLNumber, parseBRLNumber } from "@/lib/utils";

interface CurrencyInputProps extends Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "type"
> {
  value: number | undefined;
  onChange: (value: number) => void;
}

/**
 * Campo numérico no padrão brasileiro (ponto de milhar, vírgula decimal).
 * Usa `type="text"` de propósito: `type="number"` interpreta o ponto como
 * separador decimal, então "1.500" virava 1,5 (ver parseBRLNumber). Enquanto
 * o usuário digita, mantém o texto cru; ao sair do campo (blur), normaliza e
 * reexibe formatado (ex.: "1.500,00").
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onBlur, ...props }, ref) => {
    const [text, setText] = React.useState(() => formatBRLNumber(value ?? 0));
    const [focused, setFocused] = React.useState(false);

    // Reflete mudanças externas do valor quando o campo não está em edição.
    React.useEffect(() => {
      if (!focused) setText(formatBRLNumber(value ?? 0));
    }, [value, focused]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={text}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseBRLNumber(e.target.value));
        }}
        onBlur={(e) => {
          setFocused(false);
          const n = parseBRLNumber(e.target.value);
          setText(formatBRLNumber(n));
          onChange(n);
          onBlur?.(e);
        }}
        {...props}
      />
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";
