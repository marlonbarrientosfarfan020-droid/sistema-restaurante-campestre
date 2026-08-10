import "dotenv/config";

import {
  PrismaClient,
  RolUsuario,
} from "../app/generated/prisma/client";

import {
  PrismaPg,
} from "@prisma/adapter-pg";

import {
  hashPassword,
} from "../lib/password";

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Falta DATABASE_URL en el archivo .env"
  );
}

const adapter =
  new PrismaPg({
    connectionString,
  });

const prisma =
  new PrismaClient({
    adapter,
  });

async function main() {
  const sucursal =
    await prisma.sucursal.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

  if (!sucursal) {
    throw new Error(
      "No existe ninguna sucursal. Primero debes crear una sucursal."
    );
  }

  const correo =
    "admin@chinkachinka.pe";

  const password =
    "Chinka2026";

  const usuario =
    await prisma.usuario.upsert({
      where: {
        correo,
      },

      update: {
        nombres:
          "Administrador",

        apellidos:
          "Chinka Chinka",

        password:
          hashPassword(
            password
          ),

        rol:
          RolUsuario.ADMINISTRADOR,

        activo:
          true,

        sucursalId:
          sucursal.id,
      },

      create: {
        nombres:
          "Administrador",

        apellidos:
          "Chinka Chinka",

        correo,

        password:
          hashPassword(
            password
          ),

        rol:
          RolUsuario.ADMINISTRADOR,

        activo:
          true,

        sucursalId:
          sucursal.id,
      },
    });

  console.log(
    "\n=============================="
  );

  console.log(
    "ADMINISTRADOR CREADO"
  );

  console.log(
    "Correo:",
    usuario.correo
  );

  console.log(
    "Contraseña:",
    password
  );

  console.log(
    "Rol:",
    usuario.rol
  );

  console.log(
    "Sucursal:",
    sucursal.nombre
  );

  console.log(
    "==============================\n"
  );
}

main()
  .catch((error) => {
    console.error(
      "ERROR:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });