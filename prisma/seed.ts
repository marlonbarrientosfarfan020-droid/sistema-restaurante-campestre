import "dotenv/config";

import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  RolUsuario,
} from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL no está configurada en el archivo .env."
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Iniciando datos de Chinka Chinka...");

  const empresa = await prisma.empresa.upsert({
    where: {
      ruc: "20600000001",
    },
    update: {
      nombre: "Restaurante Chinka Chinka",
      direccion: "Perú",
      telefono: "999999999",
      correo: "administracion@chinkachinka.pe",
    },
    create: {
      nombre: "Restaurante Chinka Chinka",
      ruc: "20600000001",
      direccion: "Perú",
      telefono: "999999999",
      correo: "administracion@chinkachinka.pe",
    },
  });

  const sucursal = await prisma.sucursal.upsert({
    where: {
      empresaId_codigo: {
        empresaId: empresa.id,
        codigo: "PRINCIPAL",
      },
    },
    update: {
      nombre: "Sucursal Principal",
      direccion: "Restaurante Campestre Chinka Chinka",
    },
    create: {
      empresaId: empresa.id,
      nombre: "Sucursal Principal",
      codigo: "PRINCIPAL",
      direccion: "Restaurante Campestre Chinka Chinka",
    },
  });

  const passwordHash = await hash(
    "Admin123*",
    12
  );

  await prisma.usuario.upsert({
    where: {
      correo: "admin@chinkachinka.pe",
    },
    update: {
      sucursalId: sucursal.id,
      nombres: "Administrador",
      apellidos: "Principal",
      password: passwordHash,
      rol: RolUsuario.SUPERADMIN,
      activo: true,
    },
    create: {
      sucursalId: sucursal.id,
      nombres: "Administrador",
      apellidos: "Principal",
      correo: "admin@chinkachinka.pe",
      password: passwordHash,
      rol: RolUsuario.SUPERADMIN,
      activo: true,
    },
  });

  const nombresZonas = [
    "Salón Principal",
    "Zona Campestre",
    "Terraza",
    "Zona Familiar",
  ];

  const zonas = [];

  for (const nombre of nombresZonas) {
    const zonaExistente = await prisma.zona.findFirst({
      where: {
        sucursalId: sucursal.id,
        nombre,
      },
    });

    const zona =
      zonaExistente ??
      (await prisma.zona.create({
        data: {
          sucursalId: sucursal.id,
          nombre,
        },
      }));

    zonas.push(zona);
  }

  let numeroMesa = 1;

  for (const zona of zonas) {
    for (let indice = 0; indice < 5; indice++) {
      await prisma.mesa.upsert({
        where: {
          zonaId_numero: {
            zonaId: zona.id,
            numero: numeroMesa,
          },
        },
        update: {
          nombre: `Mesa ${String(numeroMesa).padStart(
            2,
            "0"
          )}`,
          capacidad: 4,
          activa: true,
        },
        create: {
          zonaId: zona.id,
          numero: numeroMesa,
          nombre: `Mesa ${String(numeroMesa).padStart(
            2,
            "0"
          )}`,
          capacidad: 4,
          activa: true,
        },
      });

      numeroMesa++;
    }
  }

  const categorias = [
    {
      codigo: "CAT-000001",
      nombre: "Entradas",
      descripcion: "Entradas y aperitivos.",
    },
    {
      codigo: "CAT-000002",
      nombre: "Platos de fondo",
      descripcion: "Platos principales del restaurante.",
    },
    {
      codigo: "CAT-000003",
      nombre: "Parrillas",
      descripcion: "Carnes y preparaciones a la parrilla.",
    },
    {
      codigo: "CAT-000004",
      nombre: "Pescados",
      descripcion: "Platos preparados con pescado.",
    },
    {
      codigo: "CAT-000005",
      nombre: "Bebidas",
      descripcion: "Bebidas frías y calientes.",
    },
    {
      codigo: "CAT-000006",
      nombre: "Postres",
      descripcion: "Postres y dulces.",
    },
    {
      codigo: "CAT-000007",
      nombre: "Promociones",
      descripcion: "Promociones disponibles.",
    },
  ];

  for (const categoria of categorias) {
    await prisma.categoria.upsert({
      where: {
        sucursalId_codigo: {
          sucursalId: sucursal.id,
          codigo: categoria.codigo,
        },
      },
      update: {
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        activa: true,
      },
      create: {
        sucursalId: sucursal.id,
        codigo: categoria.codigo,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        activa: true,
      },
    });
  }

  console.log("✅ Empresa creada:", empresa.nombre);
  console.log("✅ Sucursal creada:", sucursal.nombre);
  console.log("✅ Usuario: admin@chinkachinka.pe");
  console.log("✅ Contraseña temporal: Admin123*");
  console.log("✅ 4 zonas creadas");
  console.log("✅ 20 mesas creadas");
  console.log("✅ 7 categorías creadas");
}

main()
  .catch((error) => {
    console.error("❌ Error ejecutando seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });