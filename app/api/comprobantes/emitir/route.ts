import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  EstadoAtencion,
  TipoComprobante,
} from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import {
  fail,
  ok,
} from "@/lib/response";

export const runtime = "nodejs";

type TipoPermitido =
  | "NOTA_VENTA"
  | "BOLETA"
  | "FACTURA";

function redondear(
  valor: number
) {
  return (
    Math.round(valor * 100) /
    100
  );
}

function seriePorTipo(
  tipo: TipoPermitido
) {
  if (tipo === "FACTURA") {
    return "F001";
  }

  if (tipo === "BOLETA") {
    return "B001";
  }

  return "NV01";
}

function validarCliente({
  tipo,
  documento,
  nombre,
  direccion,
}: {
  tipo: TipoPermitido;
  documento: string;
  nombre: string;
  direccion: string;
}) {
  if (
    tipo === "FACTURA"
  ) {
    if (
      !/^\d{11}$/.test(
        documento
      )
    ) {
      throw new Error(
        "FACTURA_RUC_INVALIDO"
      );
    }

    if (!nombre) {
      throw new Error(
        "FACTURA_RAZON_SOCIAL_REQUERIDA"
      );
    }

    if (!direccion) {
      throw new Error(
        "FACTURA_DIRECCION_REQUERIDA"
      );
    }
  }

  if (
    tipo === "BOLETA" &&
    documento &&
    !/^\d{8}$/.test(
      documento
    )
  ) {
    throw new Error(
      "BOLETA_DNI_INVALIDO"
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const atencionId =
      typeof body.atencionId ===
      "string"
        ? body.atencionId.trim()
        : "";

    const tipoTexto =
      typeof body.tipo ===
      "string"
        ? body.tipo
            .trim()
            .toUpperCase()
        : "";

    const tiposValidos:
      TipoPermitido[] = [
        "NOTA_VENTA",
        "BOLETA",
        "FACTURA",
      ];

    if (!atencionId) {
      return NextResponse.json(
        fail(
          "La atención es obligatoria."
        ),
        {
          status: 400,
        }
      );
    }

    if (
      !tiposValidos.includes(
        tipoTexto as TipoPermitido
      )
    ) {
      return NextResponse.json(
        fail(
          "El tipo de comprobante no es válido."
        ),
        {
          status: 400,
        }
      );
    }

    const tipo =
      tipoTexto as TipoPermitido;

    const clienteDocumento =
      typeof body.clienteDocumento ===
      "string"
        ? body.clienteDocumento.trim()
        : "";

    const clienteNombre =
      typeof body.clienteNombre ===
      "string"
        ? body.clienteNombre.trim()
        : "";

    const clienteDireccion =
      typeof body.clienteDireccion ===
      "string"
        ? body.clienteDireccion.trim()
        : "";

    validarCliente({
      tipo,
      documento:
        clienteDocumento,
      nombre:
        clienteNombre,
      direccion:
        clienteDireccion,
    });

    const atencion =
      await prisma.atencion.findUnique({
        where: {
          id: atencionId,
        },
        select: {
          id: true,
          codigo: true,
          estado: true,
          sucursalId: true,
          total: true,
        },
      });

    if (!atencion) {
      return NextResponse.json(
        fail(
          "La atención no existe."
        ),
        {
          status: 404,
        }
      );
    }

    if (
      atencion.estado !==
      EstadoAtencion.PAGADA
    ) {
      return NextResponse.json(
        fail(
          "Primero debe completarse el pago antes de emitir el comprobante."
        ),
        {
          status: 409,
        }
      );
    }

    const tipoEnum =
      TipoComprobante[
        tipo as keyof typeof TipoComprobante
      ];

    const existente =
      await prisma.comprobante.findFirst({
        where: {
          atencionId,
          tipo:
            tipoEnum,
        },
      });

    if (existente) {
      return NextResponse.json(
        ok(
          existente,
          `${tipo.replace(
            "_",
            " "
          )} ya había sido generado.`
        )
      );
    }

    const serie =
      seriePorTipo(tipo);

    const ultimo =
      await prisma.comprobante.findFirst({
        where: {
          sucursalId:
            atencion.sucursalId,
          tipo:
            tipoEnum,
          serie,
        },
        orderBy: {
          correlativo: "desc",
        },
        select: {
          correlativo: true,
        },
      });

    const correlativo =
      (ultimo?.correlativo ??
        0) + 1;

    const numero =
      `${serie}-${String(
        correlativo
      ).padStart(
        8,
        "0"
      )}`;

    const total =
      redondear(
        Number(
          atencion.total
        )
      );

    /*
     * Supuesto actual del restaurante:
     * precioVenta es precio final con IGV incluido.
     * Para BOLETA/FACTURA separamos base e IGV 18%.
     */
    const baseImponible =
      tipo === "NOTA_VENTA"
        ? total
        : redondear(
            total / 1.18
          );

    const igv =
      tipo === "NOTA_VENTA"
        ? 0
        : redondear(
            total -
              baseImponible
          );

    const comprobante =
      await prisma.comprobante.create({
        data: {
          sucursalId:
            atencion.sucursalId,
          atencionId:
            atencion.id,
          tipo:
            tipoEnum,
          serie,
          correlativo,
          numero,
          clienteDocumento:
            clienteDocumento ||
            null,
          clienteNombre:
            clienteNombre ||
            (tipo ===
            "NOTA_VENTA"
              ? "Cliente general"
              : null),
          clienteDireccion:
            clienteDireccion ||
            null,
          subtotal:
            baseImponible,
          igv,
          total,
          /*
           * "emitido" aquí significa creado dentro del sistema.
           * No significa aceptación de SUNAT.
           */
          emitido: true,
        },
      });

    const etiqueta =
      tipo === "FACTURA"
        ? "Factura"
        : tipo === "BOLETA"
          ? "Boleta"
          : "Nota de Venta";

    return NextResponse.json(
      ok(
        comprobante,
        `${etiqueta} ${comprobante.numero} generada correctamente.`
      ),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error emitiendo comprobante:",
      error
    );

    const codigo =
      error instanceof Error
        ? error.message
        : "";

    const errores: Record<
      string,
      string
    > = {
      FACTURA_RUC_INVALIDO:
        "Para la factura ingresa un RUC válido de 11 dígitos.",
      FACTURA_RAZON_SOCIAL_REQUERIDA:
        "La razón social es obligatoria para la factura.",
      FACTURA_DIRECCION_REQUERIDA:
        "La dirección fiscal es obligatoria para la factura.",
      BOLETA_DNI_INVALIDO:
        "Si registras DNI para la boleta, debe tener 8 dígitos.",
    };

    if (errores[codigo]) {
      return NextResponse.json(
        fail(
          errores[codigo]
        ),
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      fail(
        process.env.NODE_ENV ===
          "development"
          ? `Error emitiendo comprobante: ${
              error instanceof Error
                ? error.message
                : "Error desconocido"
            }`
          : "No se pudo generar el comprobante."
      ),
      {
        status: 500,
      }
    );
  }
}
