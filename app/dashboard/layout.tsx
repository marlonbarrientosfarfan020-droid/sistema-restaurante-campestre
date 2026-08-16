"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import MozoAppNavigation from "@/components/mozo/MozoAppNavigation";

type RolSesion =
  | "SUPERADMIN"
  | "ADMINISTRADOR"
  | "CAJERO"
  | "MOZO"
  | "COCINA"
  | "BARRA"
  | "GERENTE";

type SesionActual = {
  sub: string;
  sucursalId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolSesion;
  exp: number;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sesion, setSesion] = useState<SesionActual | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarSesion() {
      try {
        const respuesta = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const resultado =
          (await respuesta.json()) as ApiResponse<SesionActual>;

        if (!respuesta.ok || !resultado.success || !resultado.data) {
          window.location.href = "/login";
          return;
        }

        setSesion(resultado.data);
      } catch {
        window.location.href = "/login";
      } finally {
        setCargando(false);
      }
    }

    cargarSesion();
  }, []);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <LoaderCircle
          size={42}
          className="animate-spin text-amber-500"
        />
      </main>
    );
  }

  if (sesion?.rol === "MOZO") {
    return (
      <MozoAppNavigation sesion={sesion}>
        {children}
      </MozoAppNavigation>
    );
  }

  return <>{children}</>;
}
