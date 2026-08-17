import { prisma } from "@/lib/prisma";
import "dotenv/config";
const CORREO_ADMIN = "admin@chinkachinka.pe";

async function main() {
  console.log("🧹 Iniciando limpieza para entrega...");

  await prisma.$transaction(async (tx) => {
    /*
     * =====================================================
     * 1. DATOS OPERATIVOS
     * =====================================================
     */

    console.log("🗑️ Eliminando pagos...");
    await tx.pago.deleteMany({});

    console.log("🗑️ Eliminando comprobantes...");
    await tx.comprobante.deleteMany({});

    console.log("🗑️ Eliminando detalles de pedidos...");
    await tx.detallePedido.deleteMany({});

    console.log("🗑️ Eliminando pedidos...");
    await tx.pedido.deleteMany({});

    console.log("🗑️ Eliminando atenciones...");
    await tx.atencion.deleteMany({});

    /*
     * =====================================================
     * 2. DATOS DE CONFIGURACIÓN DE PRUEBA
     * =====================================================
     */

    console.log("🗑️ Eliminando mesas...");
    await tx.mesa.deleteMany({});

    console.log("🗑️ Eliminando zonas...");
    await tx.zona.deleteMany({});

    console.log("🗑️ Eliminando productos...");
    await tx.producto.deleteMany({});

    console.log("🗑️ Eliminando categorías...");
    await tx.categoria.deleteMany({});

    /*
     * =====================================================
     * 3. USUARIOS DE PRUEBA
     * =====================================================
     *
     * Conservamos únicamente:
     *
     * admin@chinkachinka.pe
     */

    console.log("🗑️ Eliminando usuarios de prueba...");

    await tx.usuario.deleteMany({
      where: {
        correo: {
          not: CORREO_ADMIN,
        },
      },
    });

    console.log("✅ Administrador conservado:");
    console.log(`   ${CORREO_ADMIN}`);
  });

  console.log("");
  console.log("====================================");
  console.log("✅ LIMPIEZA COMPLETADA");
  console.log("====================================");
  console.log("");
  console.log("👑 Administrador:");
  console.log(`   ${CORREO_ADMIN}`);
  console.log("");
  console.log("🧹 Datos de prueba eliminados.");
  console.log("🚀 Sistema listo para configuración del cliente.");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ ERROR DURANTE LA LIMPIEZA");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });