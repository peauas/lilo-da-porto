"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgot", email: data.email }),
      });
      const json = await res.json();
      if (json.success) {
        setSent(true);
        if (json.data?.resetUrl) {
          toast.info(`Dev: acesse ${json.data.resetUrl}`);
        }
      } else {
        toast.error(json.error?.message ?? "Erro ao enviar recuperação");
      }
    } catch {
      toast.error("Erro ao enviar recuperação");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <MailCheck className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-bold text-foreground">Verifique seu e-mail</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          Se o e-mail existir em nossa base, você receberá um link para redefinir sua senha em
          instantes.
        </p>
        <Button variant="ghost" className="mt-8 w-full" asChild>
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <img src="/logo-lockup.png" alt="Lilo da Porto" className="mb-8 h-14 w-auto object-contain" />

      <h1 className="text-2xl font-bold text-foreground">Esqueceu sua senha?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="seu@email.com" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar link de recuperação
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      </form>
    </div>
  );
}
