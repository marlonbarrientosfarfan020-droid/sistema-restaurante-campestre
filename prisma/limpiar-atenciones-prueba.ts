import {
  EstadoAtencion,
  EstadoMesa,
} from "../app/generated/prisma/client";
import "dotenv/config"

import { prisma } from "../lib/prisma";

async function main() {
  const ahora =
    new Date();

  /*
   * Seguridad:
   * solo consideramos "antiguas"
   * las atenciones con más de 12 horas.
   *
   * Así evitamos cerrar una atención
   * reciente que estés probando ahora.
   */
  const limite =
    new Date(
      ahora.getTime() -
        12 * 60 * 60 * 1000
    );

  const estadosActivos: EstadoAtencion[] = [
    EstadoAtencion.ABIERTA,
    EstadoAtencion.SOLICITO_CUENTA,
    EstadoAtencion.PAGADA,
  ];

  const antiguas =
    await prisma.atencion.findMany({
      where: {
        estado: {
          in: estadosActivos,
        },

        fechaApertura: {
          lt: limite,
        },
      },

      select: {
        id: true,
        codigo: true,
        estado: true,
        fechaApertura: true,

        mesa: {
          select: {
            id: true,
            nombre: true,
            estado: true,
          },
        },
      },

      orderBy: {
        fechaApertura: "asc",
      },
    });

  console.log(
    `Atenciones antiguas encontradas: ${antiguas.length}`
  );

  if (
    antiguas.length === 0
  ) {
    console.log(
      "No hay atenciones antiguas para limpiar."
    );

    return;
  }

  antiguas.forEach(
    (atencion) => {
      console.log(
        `${atencion.codigo} | ${atencion.mesa.nombre} | ${atencion.estado} | ${atencion.fechaApertura.toISOString()}`
      );
    }
  );

  const mesaIds =
    Array.from(
      new Set(
        antiguas.map(
          (atencion) =>
            atencion.mesa.id
        )
      )
    );

  await prisma.$transaction(
    async (tx) => {
      /*
       * Cerramos las atenciones antiguas.
       */
      await tx.atencion.updateMany({
        where: {
          id: {
            in:
              antiguas.map(
                (atencion) =>
                  atencion.id
              ),
          },
        },

        data: {
          estado:
            EstadoAtencion.CERRADA,

          fechaCierre:
            ahora,
        },
      });

      /*
       * Liberamos las mesas asociadas.
       */
      await tx.mesa.updateMany({
        where: {
          id: {
            in: mesaIds,
          },
        },

        data: {
          estado:
            EstadoMesa.LIBRE,
        },
      });
    }
  );

  console.log("");
  console.log(
    "Limpieza completada correctamente."
  );

  console.log(
    `Atenciones cerradas: ${antiguas.length}`
  );

  console.log(
    `Mesas liberadas: ${mesaIds.length}`
  );
}

main()
  .catch((error) => {
    console.error(
      "Error ejecutando limpieza:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });