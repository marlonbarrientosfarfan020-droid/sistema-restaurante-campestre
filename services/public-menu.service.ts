import { prisma } from "@/lib/prisma";

export type PublicProduct = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioVenta: number;
  imagenUrl: string | null;
  tiempoPreparacion: number;
  disponible: boolean;
  categoria: {
    id: string;
    codigo: string;
    nombre: string;
  };
};

export type PublicCategory = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  totalProductos: number;
};

export type PublicMenuData = {
  empresa: {
    nombre: string;
    ruc: string | null;
    direccion: string | null;
    telefono: string | null;
    correo: string | null;
    logoUrl: string | null;
  };
  categorias: PublicCategory[];
  productos: PublicProduct[];
};

export async function getPublicMenu(): Promise<PublicMenuData> {
  try {
    const sucursal = await prisma.sucursal.findFirst({
      where: { codigo: "PRINCIPAL" },
      include: {
        empresa: true,
      },
    });

    const sucursalId = sucursal?.id;

    // Obtener categorías activas
    const categoriasDb = await prisma.categoria.findMany({
      where: {
        activa: true,
        ...(sucursalId ? { sucursalId } : {}),
      },
      orderBy: { nombre: "asc" },
      include: {
        _count: {
          select: {
            productos: {
              where: { activo: true },
            },
          },
        },
      },
    });

    // Obtener productos activos
    let productosDb = await prisma.producto.findMany({
      where: {
        activo: true,
        categoria: { activa: true },
        ...(sucursalId ? { sucursalId } : {}),
      },
      include: {
        categoria: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
      orderBy: [{ disponible: "desc" }, { nombre: "asc" }],
    });

    // Si no existen productos en la BD, creamos platos típicos gourmet iniciales
    if (productosDb.length === 0 && sucursalId && categoriasDb.length > 0) {
      await sembrarPlatosIniciales(sucursalId, categoriasDb);
      productosDb = await prisma.producto.findMany({
        where: {
          activo: true,
          categoria: { activa: true },
          sucursalId,
        },
        include: {
          categoria: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
        },
        orderBy: [{ disponible: "desc" }, { nombre: "asc" }],
      });
    }

    const categorias: PublicCategory[] = categoriasDb.map((c) => ({
      id: c.id,
      codigo: c.codigo,
      nombre: c.nombre,
      descripcion: c.descripcion,
      totalProductos: c._count?.productos ?? 0,
    }));

    const productos: PublicProduct[] = productosDb.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precioVenta: Number(p.precioVenta),
      imagenUrl: p.imagenUrl,
      tiempoPreparacion: p.tiempoPreparacion || 15,
      disponible: p.disponible,
      categoria: {
        id: p.categoria.id,
        codigo: p.categoria.codigo,
        nombre: p.categoria.nombre,
      },
    }));

    return {
      empresa: {
        nombre: sucursal?.empresa?.nombre || "Restaurante Campestre Chinka Chinka",
        ruc: sucursal?.empresa?.ruc || "20600000001",
        direccion: sucursal?.direccion || "Valle Campestre Chinka Chinka, Perú",
        telefono: sucursal?.empresa?.telefono || "+51 987 654 321",
        correo: sucursal?.empresa?.correo || "contacto@chinkachinka.pe",
        logoUrl: sucursal?.empresa?.logoUrl || "/img/logo-chinka.png",
      },
      categorias,
      productos,
    };
  } catch (error) {
    console.error("Error cargando carta pública de Chinka Chinka:", error);
    return {
      empresa: {
        nombre: "Restaurante Campestre Chinka Chinka",
        ruc: "20600000001",
        direccion: "Valle Campestre Chinka Chinka, Perú",
        telefono: "+51 987 654 321",
        correo: "contacto@chinkachinka.pe",
        logoUrl: "/img/logo-chinka.png",
      },
      categorias: [],
      productos: [],
    };
  }
}

async function sembrarPlatosIniciales(
  sucursalId: string,
  categorias: Array<{ id: string; nombre: string }>
) {
  const getCatId = (nombreBuscado: string) => {
    const encontrada = categorias.find((c) =>
      c.nombre.toLowerCase().includes(nombreBuscado.toLowerCase())
    );
    return encontrada?.id || categorias[0].id;
  };

  const platos = [
    {
      codigo: "PROD-001",
      nombre: "Lomo Saltado a la Leña Gourmet",
      descripcion:
        "Tierno lomo fino flameado al wok con cebolla morada crujiente, tomates maduros, ají amarillo y papas nativas doradas a la leña. Acompañado de arroz al cilantro.",
      precioVenta: 46.0,
      costo: 22.0,
      tiempoPreparacion: 18,
      imagenUrl: "/img/lomo-saltado.jpg",
      disponible: true,
      categoriaId: getCatId("fondo"),
    },
    {
      codigo: "PROD-002",
      nombre: "Ceviche Mixto Campestre",
      descripcion:
        "Pesca del día y mariscos seleccionados en vibrante leche de tigre al ají limo y rocoto, con choclo gigante andino y camote glaseado a la naranja.",
      precioVenta: 42.0,
      costo: 20.0,
      tiempoPreparacion: 15,
      imagenUrl: "/img/ceviche-mixto.jpg",
      disponible: true,
      categoriaId: getCatId("pescado"),
    },
    {
      codigo: "PROD-003",
      nombre: "Parrilla Campestre Chinka Chinka (2 Personas)",
      descripcion:
        "Cortes selectos de bife de chorizo, anticuchos de corazón a la brasa, chorizo artesanal, chinchulines crocantes, papas doradas y ensalada campestre con vinagreta de la casa.",
      precioVenta: 89.0,
      costo: 42.0,
      tiempoPreparacion: 25,
      imagenUrl: "/img/chinka-gastronomia.png",
      disponible: true,
      categoriaId: getCatId("parrilla"),
    },
    {
      codigo: "PROD-004",
      nombre: "Causa Limeña con Pulpa de Cangrejo y Trucha",
      descripcion:
        "Suave masa de papa amarilla prensada con ají amarillo y limón sutil, rellena de pulpa de cangrejo y trucha ahumada con palta fuerte y mayonesa de rocoto.",
      precioVenta: 32.0,
      costo: 14.0,
      tiempoPreparacion: 12,
      imagenUrl: "/img/chinka-cultura.png",
      disponible: true,
      categoriaId: getCatId("entrada"),
    },
    {
      codigo: "PROD-005",
      nombre: "Arroz con Pato a la Chiclayana",
      descripcion:
        "Tradicional pato tierno cocinado a fuego lento con chicha de jora, cerveza negra y culantro fresco, acompañado de salsa criolla y plátano frito.",
      precioVenta: 48.0,
      costo: 24.0,
      tiempoPreparacion: 22,
      imagenUrl: "/img/lomo-saltado.jpg",
      disponible: true,
      categoriaId: getCatId("fondo"),
    },
    {
      codigo: "PROD-006",
      nombre: "Chicha Morada Tradicional de la Casa (Jarra 1L)",
      descripcion:
        "Elaborada con maíz morado selecto, cáscara de piña, manzana andina, canela y clavo de olor. 100% natural y refrescante.",
      precioVenta: 18.0,
      costo: 6.0,
      tiempoPreparacion: 5,
      imagenUrl: "/img/hero-campestre.jpg",
      disponible: true,
      categoriaId: getCatId("bebida"),
    },
  ];

  for (const plato of platos) {
    try {
      await prisma.producto.upsert({
        where: {
          sucursalId_codigo: {
            sucursalId,
            codigo: plato.codigo,
          },
        },
        update: {
          nombre: plato.nombre,
          descripcion: plato.descripcion,
          precioVenta: plato.precioVenta,
          costo: plato.costo,
          tiempoPreparacion: plato.tiempoPreparacion,
          imagenUrl: plato.imagenUrl,
          disponible: plato.disponible,
          categoriaId: plato.categoriaId,
          activo: true,
        },
        create: {
          sucursalId,
          codigo: plato.codigo,
          nombre: plato.nombre,
          descripcion: plato.descripcion,
          precioVenta: plato.precioVenta,
          costo: plato.costo,
          tiempoPreparacion: plato.tiempoPreparacion,
          imagenUrl: plato.imagenUrl,
          disponible: plato.disponible,
          categoriaId: plato.categoriaId,
          activo: true,
        },
      });
    } catch {
      // Ignorar duplicados
    }
  }
}
