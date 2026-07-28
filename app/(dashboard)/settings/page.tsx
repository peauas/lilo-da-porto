"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Download, Puzzle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { changePasswordSchema, type ChangePasswordInput } from "@/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import extensionManifest from "@/extension/manifest.json";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: ChangePasswordInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change", ...data }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Erro ao alterar senha");
        return;
      }
      toast.success("Senha alterada com sucesso");
      reset();
    } catch {
      toast.error("Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in">
      <PageHeader title="Configurações" description="Gerencie sua conta" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Puzzle className="h-4 w-4 text-primary" />
              Extensão do Chrome
            </CardTitle>
            <Badge variant="secondary">v{extensionManifest.version}</Badge>
          </div>
          <CardDescription>
            Capture serviços do portal Porto direto do navegador e envie para o sistema em um
            clique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild>
            <a href="/downloads/lilo-da-porto-extension.zip" download>
              <Download className="mr-2 h-4 w-4" />
              Baixar extensão (.zip)
            </a>
          </Button>

          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Como instalar</p>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Baixe e extraia o arquivo .zip</li>
              <li>
                Abra{" "}
                <code className="rounded bg-secondary px-1 py-0.5 text-xs text-secondary-foreground">
                  chrome://extensions
                </code>
              </li>
              <li>Ative o &quot;Modo do desenvolvedor&quot; no canto superior direito</li>
              <li>Clique em &quot;Carregar sem compactação&quot; e selecione a pasta extraída</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>Defina uma nova senha de acesso ao sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <Input id="currentPassword" type="password" {...register("currentPassword")} />
              {errors.currentPassword && (
                <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input id="newPassword" type="password" {...register("newPassword")} />
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar nova senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
