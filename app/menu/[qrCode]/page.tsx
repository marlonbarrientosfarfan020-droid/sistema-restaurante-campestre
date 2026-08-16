"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  History,
  ImageIcon,
  LoaderCircle,
  Minus,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  UtensilsCrossed,
  X,
} from "lucide-react";

import {
  useParams,
} from "next/navigation";

type ProductoMenu = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioVenta: number | string;
  imagenUrl: string | null;
  tiempoPreparacion: number;
};

type CategoriaMenu = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  productos: ProductoMenu[];
};

type MenuData = {
  restaurante: {
    empresaId: string;
    nombre: string;
    logoUrl: string | null;

    sucursal: {
      id: string;
      nombre: string;
      direccion: string | null;
    };
  };

  mesa: {
    id: string;
    numero: number;
    nombre: string;
    capacidad: number;
    estado: string;
    qrCode: string | null;

    zona: {
      id: string;
      nombre: string;
    };
  };

  categorias: CategoriaMenu[];
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type ItemCarrito = {
  producto: ProductoMenu;
  cantidad: number;
  observacion: string;
};

type MetodoPagoPrevisto =
  | "EFECTIVO"
  | "YAPE"
  | "PLIN"
  | "TARJETA"
  | "MIXTO";

type PedidoCliente = {
  id: string;
  numero: string;
  estado: string;
  origen: string;
  subtotal: number | string;
  observacion?: string | null;
  fechaPedido: string;
  detalles: Array<{
    id: string;
    cantidad: number | string;
    precioUnitario: number | string;
    subtotal: number | string;
    observacion?: string | null;

    producto: {
      id: string;
      codigo: string;
      nombre: string;
      imagenUrl?: string | null;
      tiempoPreparacion?: number;
    };
  }>;
};

type AtencionActiva = {
  id: string;
  codigo: string;
  estado: string;
  subtotal: number | string;
  descuento: number | string;
  total: number | string;
  fechaApertura: string;
  fechaSolicitudCuenta?: string | null;
  metodoPagoPrevisto?: MetodoPagoPrevisto | null;
};

function estadoPedidoVisual(
  estado: string
) {
  const mapa: Record<
    string,
    {
      texto: string;
      clases: string;
    }
  > = {
    PENDIENTE_CONFIRMACION: {
      texto: "Esperando confirmación",
      clases:
        "bg-orange-100 text-orange-700",
    },

    NUEVO: {
      texto: "Esperando confirmación",
      clases:
        "bg-orange-100 text-orange-700",
    },

    RECIBIDO: {
      texto: "Pedido recibido",
      clases:
        "bg-sky-100 text-sky-700",
    },

    PREPARANDO: {
      texto: "Preparando",
      clases:
        "bg-amber-100 text-amber-700",
    },

    ENTREGADO: {
      texto: "Entregado",
      clases:
        "bg-emerald-100 text-emerald-700",
    },

    ANULADO: {
      texto: "Anulado",
      clases:
        "bg-red-100 text-red-700",
    },
  };

  return (
    mapa[estado] ?? {
      texto: estado,
      clases:
        "bg-slate-100 text-slate-700",
    }
  );
}

function formatearHora(
  fecha: string
) {
  return new Intl.DateTimeFormat(
    "es-PE",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Lima",
    }
  ).format(
    new Date(fecha)
  );
}

export default function MenuQRPage() {
  const params =
    useParams<{
      qrCode: string;
    }>();

  const qrCode =
    params.qrCode;

  const [
    menu,
    setMenu,
  ] =
    useState<MenuData | null>(
      null
    );

  const [
    atencion,
    setAtencion,
  ] =
    useState<AtencionActiva | null>(
      null
    );

  const [
    pedidos,
    setPedidos,
  ] =
    useState<PedidoCliente[]>(
      []
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    cargandoEstado,
    setCargandoEstado,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    busqueda,
    setBusqueda,
  ] =
    useState("");

  const [
    categoriaSeleccionada,
    setCategoriaSeleccionada,
  ] =
    useState("");

  const [
    carrito,
    setCarrito,
  ] =
    useState<ItemCarrito[]>(
      []
    );

  const [
    mostrarCarrito,
    setMostrarCarrito,
  ] =
    useState(false);

  const [
    mostrarPedidos,
    setMostrarPedidos,
  ] =
    useState(false);

  const [
    enviandoPedido,
    setEnviandoPedido,
  ] =
    useState(false);

  const [
    solicitandoCuenta,
    setSolicitandoCuenta,
  ] =
    useState(false);

  const [
    ocupandoMesa,
    setOcupandoMesa,
  ] =
    useState(false);

  const [
    liberandoMesa,
    setLiberandoMesa,
  ] =
    useState(false);

  const [
    cantidadPersonas,
    setCantidadPersonas,
  ] =
    useState(1);

  const [
    mensajePedido,
    setMensajePedido,
  ] =
    useState("");

  const [
    pedidoEnviado,
    setPedidoEnviado,
  ] =
    useState<{
      numero: string;
    } | null>(
      null
    );

  const [
    errorPedido,
    setErrorPedido,
  ] =
    useState("");

  const [
    cuentaSolicitadaLocal,
    setCuentaSolicitadaLocal,
  ] =
    useState(false);

  const [
    metodoPagoSeleccionado,
    setMetodoPagoSeleccionado,
  ] =
    useState<MetodoPagoPrevisto | null>(
      null
    );

  const claveAtencionLocal =
    useMemo(
      () =>
        qrCode
          ? `chinka_atencion_${qrCode}`
          : "",
      [qrCode]
    );

  const claveCuentaLocal =
    useMemo(
      () =>
        qrCode
          ? `chinka_cuenta_${qrCode}`
          : "",
      [qrCode]
    );

  const cargarMenu =
    useCallback(async () => {
      if (!qrCode) {
        return;
      }

      try {
        setCargando(true);
        setError("");

        const respuesta =
          await fetch(
            `/api/menu/${encodeURIComponent(
              qrCode
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<MenuData>;

        if (
          !respuesta.ok ||
          !resultado.success ||
          !resultado.data
        ) {
          throw new Error(
            resultado.message ||
              "No se pudo cargar el menú."
          );
        }

        setMenu(
          resultado.data
        );
      } catch (
        errorDesconocido
      ) {
        setError(
          errorDesconocido instanceof
            Error
            ? errorDesconocido.message
            : "No se pudo cargar el menú."
        );
      } finally {
        setCargando(false);
      }
    }, [qrCode]);

  const cargarPedidos =
    useCallback(
      async (
        atencionId: string
      ) => {
        try {
          const respuesta =
            await fetch(
              `/api/pedidos?atencionId=${encodeURIComponent(
                atencionId
              )}`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const resultado =
            (await respuesta.json()) as ApiResponse<
              PedidoCliente[]
            >;

          if (
            !respuesta.ok ||
            !resultado.success
          ) {
            throw new Error(
              resultado.message ||
                "No se pudieron cargar los pedidos."
            );
          }

          setPedidos(
            resultado.data ?? []
          );
        } catch (
          errorDesconocido
        ) {
          setErrorPedido(
            errorDesconocido instanceof
              Error
              ? errorDesconocido.message
              : "No se pudieron cargar tus pedidos."
          );
        }
      },
      []
    );

  const cargarEstadoAtencion =
    useCallback(
      async (
        mesaId: string
      ) => {
        try {
          setCargandoEstado(true);

          const respuesta =
            await fetch(
              `/api/atenciones?mesaId=${encodeURIComponent(
                mesaId
              )}`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const resultado =
            (await respuesta.json()) as ApiResponse<
              AtencionActiva | null
            >;

          if (
            !respuesta.ok ||
            !resultado.success
          ) {
            throw new Error(
              resultado.message ||
                "No se pudo consultar la atención."
            );
          }

          const actual =
            resultado.data ?? null;

          if (actual) {
            setAtencion(
              actual
            );

            if (
              actual.metodoPagoPrevisto
            ) {
              setMetodoPagoSeleccionado(
                actual.metodoPagoPrevisto
              );
            }

            if (
              claveAtencionLocal
            ) {
              window.localStorage.setItem(
                claveAtencionLocal,
                actual.id
              );
            }

            await cargarPedidos(
              actual.id
            );

            return;
          }

          /*
           * GET /api/atenciones solamente
           * devuelve una atención ABIERTA.
           *
           * Si ya se solicitó la cuenta,
           * conservamos temporalmente el
           * identificador del navegador para
           * poder seguir mostrando pedidos.
           */
          const atencionGuardada =
            claveAtencionLocal
              ? window.localStorage.getItem(
                  claveAtencionLocal
                )
              : null;

          /*
           * Si la mesa ya está LIBRE, no recuperamos
           * pedidos históricos del navegador.
           * Es una nueva sesión de cliente.
           */
          if (
            menu?.mesa.estado ===
              "LIBRE"
          ) {
            setAtencion(null);
            setPedidos([]);
            setCuentaSolicitadaLocal(
              false
            );

            if (
              claveAtencionLocal
            ) {
              window.localStorage.removeItem(
                claveAtencionLocal
              );
            }

            if (
              claveCuentaLocal
            ) {
              window.localStorage.removeItem(
                claveCuentaLocal
              );
            }

            return;
          }

          if (
            atencionGuardada
          ) {
            await cargarPedidos(
              atencionGuardada
            );
          }
        } catch (
          errorDesconocido
        ) {
          setErrorPedido(
            errorDesconocido instanceof
              Error
              ? errorDesconocido.message
              : "No se pudo consultar el estado de la mesa."
          );
        } finally {
          setCargandoEstado(false);
        }
      },
      [
        cargarPedidos,
        claveAtencionLocal,
        claveCuentaLocal,
        menu?.mesa.estado,
      ]
    );

  useEffect(() => {
    cargarMenu();
  }, [cargarMenu]);

  useEffect(() => {
    if (
      !menu?.mesa.id
    ) {
      return;
    }

    const cuentaGuardada =
      claveCuentaLocal
        ? window.localStorage.getItem(
            claveCuentaLocal
          )
        : null;

    setCuentaSolicitadaLocal(
      cuentaGuardada === "1"
    );

    cargarEstadoAtencion(
      menu.mesa.id
    );

    const intervalo =
      window.setInterval(
        () => {
          cargarEstadoAtencion(
            menu.mesa.id
          );
        },
        5000
      );

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [
    menu?.mesa.id,
    cargarEstadoAtencion,
    claveCuentaLocal,
  ]);

  /*
   * NUEVA SESIÓN DE CLIENTE
   *
   * Si Caja o el mozo libera la mesa desde otro equipo,
   * este celular puede conservar en localStorage la atención
   * anterior. El backend es la fuente de verdad:
   *
   * MESA LIBRE = no debe mostrarse ningún consumo anterior.
   */
  useEffect(() => {
    if (
      !menu ||
      menu.mesa.estado !==
        "LIBRE"
    ) {
      return;
    }

    setAtencion(null);
    setPedidos([]);
    setCarrito([]);

    setCuentaSolicitadaLocal(
      false
    );

    setMostrarPedidos(false);
    setMostrarCarrito(false);
    setPedidoEnviado(null);

    setMetodoPagoSeleccionado(
      null
    );

    setCantidadPersonas(1);
    setBusqueda("");
    setCategoriaSeleccionada("");

    if (
      claveAtencionLocal
    ) {
      window.localStorage.removeItem(
        claveAtencionLocal
      );
    }

    if (
      claveCuentaLocal
    ) {
      window.localStorage.removeItem(
        claveCuentaLocal
      );
    }
  }, [
    menu?.mesa.estado,
    claveAtencionLocal,
    claveCuentaLocal,
  ]);

  const productos =
    useMemo(() => {
      if (!menu) {
        return [];
      }

      return menu.categorias.flatMap(
        (categoria) =>
          categoria.productos.map(
            (producto) => ({
              ...producto,
              categoriaId:
                categoria.id,
              categoriaNombre:
                categoria.nombre,
            })
          )
      );
    }, [menu]);

  const productosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLocaleLowerCase(
            "es-PE"
          );

      return productos.filter(
        (producto) => {
          const coincideCategoria =
            !categoriaSeleccionada ||
            producto.categoriaId ===
              categoriaSeleccionada;

          const coincideBusqueda =
            !texto ||
            producto.nombre
              .toLocaleLowerCase(
                "es-PE"
              )
              .includes(texto) ||
            producto.descripcion
              ?.toLocaleLowerCase(
                "es-PE"
              )
              .includes(texto);

          return (
            coincideCategoria &&
            coincideBusqueda
          );
        }
      );
    }, [
      productos,
      categoriaSeleccionada,
      busqueda,
    ]);

  const cantidadTotal =
    carrito.reduce(
      (total, item) =>
        total + item.cantidad,
      0
    );

  const totalCarrito =
    carrito.reduce(
      (total, item) =>
        total +
        Number(
          item.producto
            .precioVenta
        ) *
          item.cantidad,
      0
    );

  const totalPedidos =
    useMemo(
      () =>
        pedidos
          .filter(
            (pedido) =>
              pedido.estado !==
              "ANULADO"
          )
          .reduce(
            (total, pedido) =>
              total +
              Number(
                pedido.subtotal ?? 0
              ),
            0
          ),
      [pedidos]
    );

  const cuentaSolicitada =
    menu?.mesa.estado !==
      "LIBRE" &&
    (cuentaSolicitadaLocal ||
      menu?.mesa.estado ===
        "SOLICITO_CUENTA");

  const puedePedir =
    Boolean(atencion) &&
    !cuentaSolicitada &&
    [
      "OCUPADA",
      "PEDIDO_PENDIENTE",
      "CONSUMIENDO",
    ].includes(
      menu?.mesa.estado ?? ""
    );

  const hayPedidosPendientes =
    pedidos.some(
      (pedido) =>
        ![
          "ENTREGADO",
          "ANULADO",
        ].includes(
          pedido.estado
        )
    );

  function agregarProducto(
    producto: ProductoMenu
  ) {
    if (!puedePedir) {
      setErrorPedido(
        "La cuenta ya fue solicitada. Ya no se pueden agregar nuevos pedidos."
      );
      return;
    }

    setCarrito(
      (actual) => {
        const existe =
          actual.find(
            (item) =>
              item.producto.id ===
              producto.id
          );

        if (existe) {
          return actual.map(
            (item) =>
              item.producto.id ===
              producto.id
                ? {
                    ...item,
                    cantidad:
                      item.cantidad +
                      1,
                  }
                : item
          );
        }

        return [
          ...actual,
          {
            producto,
            cantidad: 1,
            observacion: "",
          },
        ];
      }
    );
  }

  function cambiarCantidad(
    productoId: string,
    cantidad: number
  ) {
    if (cantidad <= 0) {
      setCarrito(
        (actual) =>
          actual.filter(
            (item) =>
              item.producto.id !==
              productoId
          )
      );

      return;
    }

    setCarrito(
      (actual) =>
        actual.map(
          (item) =>
            item.producto.id ===
            productoId
              ? {
                  ...item,
                  cantidad,
                }
              : item
        )
    );
  }

  function cambiarObservacion(
    productoId: string,
    observacion: string
  ) {
    setCarrito(
      (actual) =>
        actual.map(
          (item) =>
            item.producto.id ===
            productoId
              ? {
                  ...item,
                  observacion,
                }
              : item
        )
    );
  }

  async function ocuparMesa() {
    if (!menu) {
      return;
    }

    if (
      menu.mesa.estado !==
      "LIBRE"
    ) {
      setErrorPedido(
        "La mesa ya no se encuentra libre. Actualiza la pantalla."
      );
      return;
    }

    if (
      !metodoPagoSeleccionado
    ) {
      setErrorPedido(
        "Selecciona cómo pagarás al finalizar."
      );
      return;
    }

    try {
      setOcupandoMesa(true);
      setMensajePedido("");
      setErrorPedido("");

      const respuesta =
        await fetch(
          "/api/atenciones",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              mesaId:
                menu.mesa.id,
              sucursalId:
                menu.restaurante
                  .sucursal.id,
              cantidadPersonas:
                Math.max(
                  1,
                  Math.min(
                    menu.mesa.capacidad,
                    Number(
                      cantidadPersonas
                    ) || 1
                  )
                ),
              metodoPagoPrevisto:
                metodoPagoSeleccionado,
            }),
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<{
          creada: boolean;
          atencion: AtencionActiva;
        }>;

      if (
        !respuesta.ok ||
        !resultado.success ||
        !resultado.data
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo ocupar la mesa."
        );
      }

      setAtencion(
        resultado.data.atencion
      );

      if (
        claveAtencionLocal
      ) {
        window.localStorage.setItem(
          claveAtencionLocal,
          resultado.data.atencion.id
        );
      }

      if (
        claveCuentaLocal
      ) {
        window.localStorage.removeItem(
          claveCuentaLocal
        );
      }

      setCuentaSolicitadaLocal(
        false
      );

      setMensajePedido(
        `${menu.mesa.nombre} ocupada correctamente. Ya puedes realizar tu pedido.`
      );

      await cargarMenu();

      await cargarEstadoAtencion(
        menu.mesa.id
      );
    } catch (
      errorDesconocido
    ) {
      setErrorPedido(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "No se pudo ocupar la mesa."
      );
    } finally {
      setOcupandoMesa(false);
    }
  }

  async function liberarMesaDesdeQr() {
    if (!menu) {
      return;
    }

    if (
      menu.mesa.estado !==
      "PAGADA"
    ) {
      setErrorPedido(
        "La mesa solo puede liberarse después de completar el pago."
      );
      return;
    }

    const confirmado =
      window.confirm(
        `¿Liberar ${menu.mesa.nombre}? La atención quedará cerrada y la mesa estará disponible para un nuevo cliente.`
      );

    if (!confirmado) {
      return;
    }

    try {
      setLiberandoMesa(true);
      setMensajePedido("");
      setErrorPedido("");

      const respuesta =
        await fetch(
          `/api/mesas/${encodeURIComponent(
            menu.mesa.id
          )}/liberar`,
          {
            method: "POST",
            cache: "no-store",
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<{
          liberada: boolean;
        }>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo liberar la mesa."
        );
      }

      if (
        claveAtencionLocal
      ) {
        window.localStorage.removeItem(
          claveAtencionLocal
        );
      }

      if (
        claveCuentaLocal
      ) {
        window.localStorage.removeItem(
          claveCuentaLocal
        );
      }

      setAtencion(null);
      setPedidos([]);
      setCarrito([]);
      setMetodoPagoSeleccionado(
        null
      );
      setCuentaSolicitadaLocal(
        false
      );
      setMostrarPedidos(false);
      setMostrarCarrito(false);

      setMensajePedido(
        `${menu.mesa.nombre} liberada correctamente. Ya está disponible para un nuevo cliente.`
      );

      await cargarMenu();
    } catch (
      errorDesconocido
    ) {
      setErrorPedido(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "No se pudo liberar la mesa."
      );
    } finally {
      setLiberandoMesa(false);
    }
  }

  async function enviarPedido() {
    if (!menu) {
      return;
    }

    if (!atencion) {
      setErrorPedido(
        "Primero debes ocupar la mesa antes de enviar un pedido."
      );
      return;
    }

    if (!puedePedir) {
      setErrorPedido(
        "La mesa no está disponible para registrar nuevos pedidos."
      );
      return;
    }

    if (
      carrito.length === 0
    ) {
      setErrorPedido(
        "Agrega al menos un producto al pedido."
      );
      return;
    }

    try {
      setEnviandoPedido(true);
      setMensajePedido("");
      setErrorPedido("");
      setPedidoEnviado(null);

      const respuestaAtencion =
        await fetch(
          "/api/atenciones",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              mesaId:
                menu.mesa.id,

              sucursalId:
                menu.restaurante
                  .sucursal.id,

              cantidadPersonas: 1,

              metodoPagoPrevisto:
                atencion?.metodoPagoPrevisto ??
                metodoPagoSeleccionado,
            }),
          }
        );

      const resultadoAtencion =
        (await respuestaAtencion.json()) as ApiResponse<{
          creada: boolean;

          atencion: {
            id: string;
            codigo: string;
            estado: string;
            subtotal:
              | number
              | string;
            descuento:
              | number
              | string;
            total:
              | number
              | string;
            fechaApertura: string;
            metodoPagoPrevisto?:
              | MetodoPagoPrevisto
              | null;
          };
        }>;

      if (
        !respuestaAtencion.ok ||
        !resultadoAtencion.success ||
        !resultadoAtencion.data
      ) {
        throw new Error(
          resultadoAtencion.message ||
            "No se pudo abrir la atención de la mesa."
        );
      }

      const atencionActual =
        resultadoAtencion.data
          .atencion;

      setAtencion({
        id:
          atencionActual.id,
        codigo:
          atencionActual.codigo,
        estado:
          atencionActual.estado,
        subtotal:
          atencionActual.subtotal,
        descuento:
          atencionActual.descuento,
        total:
          atencionActual.total,
        fechaApertura:
          atencionActual.fechaApertura,
        metodoPagoPrevisto:
          atencionActual.metodoPagoPrevisto ??
          metodoPagoSeleccionado,
      });

      if (
        atencionActual.metodoPagoPrevisto
      ) {
        setMetodoPagoSeleccionado(
          atencionActual.metodoPagoPrevisto
        );
      }

      if (
        claveAtencionLocal
      ) {
        window.localStorage.setItem(
          claveAtencionLocal,
          atencionActual.id
        );
      }

      const respuestaPedido =
        await fetch(
          "/api/pedidos",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              atencionId:
                atencionActual.id,

              sucursalId:
                menu.restaurante
                  .sucursal.id,

              origen:
                "CLIENTE_QR",

              detalles:
                carrito.map(
                  (item) => ({
                    productoId:
                      item.producto.id,

                    cantidad:
                      item.cantidad,

                    observacion:
                      item.observacion.trim() ||
                      undefined,
                  })
                ),
            }),
          }
        );

      const resultadoPedido =
        (await respuestaPedido.json()) as ApiResponse<{
          id: string;
          numero: string;
          estado: string;
        }>;

      if (
        !respuestaPedido.ok ||
        !resultadoPedido.success ||
        !resultadoPedido.data
      ) {
        throw new Error(
          resultadoPedido.message ||
            "No se pudo enviar el pedido."
        );
      }

      setCarrito([]);
      setMostrarCarrito(
        false
      );

      setPedidoEnviado({
        numero:
          resultadoPedido.data.numero,
      });

      setMensajePedido(
        `Pedido ${resultadoPedido.data.numero} enviado correctamente.`
      );

      await cargarMenu();

      await cargarEstadoAtencion(
        menu.mesa.id
      );
    } catch (
      errorDesconocido
    ) {
      setErrorPedido(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "Ocurrió un error enviando el pedido."
      );
    } finally {
      setEnviandoPedido(false);
    }
  }

  async function solicitarCuenta() {
    if (
      !menu ||
      !atencion
    ) {
      setErrorPedido(
        "Todavía no existe una atención activa para solicitar la cuenta."
      );
      return;
    }

    if (
      hayPedidosPendientes
    ) {
      setErrorPedido(
        "Todavía hay pedidos pendientes. Espera a que sean entregados antes de solicitar la cuenta."
      );
      return;
    }

    const confirmar =
      window.confirm(
        `¿Solicitar la cuenta de ${menu.mesa.nombre} por S/ ${totalPedidos.toFixed(
          2
        )}?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setSolicitandoCuenta(
        true
      );

      setMensajePedido("");
      setErrorPedido("");

      const respuesta =
        await fetch(
          `/api/atenciones/${encodeURIComponent(
            atencion.id
          )}/solicitar-cuenta`,
          {
            method: "PATCH",
            cache: "no-store",
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<unknown>;

      if (
        !respuesta.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo solicitar la cuenta."
        );
      }

      setCuentaSolicitadaLocal(
        true
      );

      if (
        claveCuentaLocal
      ) {
        window.localStorage.setItem(
          claveCuentaLocal,
          "1"
        );
      }

      setCarrito([]);
      setMostrarCarrito(
        false
      );

      setMensajePedido(
        "Cuenta solicitada correctamente. Caja fue notificada."
      );

      await cargarMenu();
    } catch (
      errorDesconocido
    ) {
      setErrorPedido(
        errorDesconocido instanceof
          Error
          ? errorDesconocido.message
          : "Ocurrió un error solicitando la cuenta."
      );
    } finally {
      setSolicitandoCuenta(
        false
      );
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <LoaderCircle
            size={50}
            className="mx-auto animate-spin text-amber-500"
          />

          <p className="mt-4 font-black text-slate-700">
            Abriendo la carta...
          </p>
        </div>
      </main>
    );
  }

  if (!menu) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
          <AlertCircle
            size={55}
            className="mx-auto text-red-500"
          />

          <h1 className="mt-4 text-2xl font-black text-slate-950">
            QR no disponible
          </h1>

          <p className="mt-2 text-slate-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-32">
      <header className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-5 pb-8 pt-7 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-4">
            {menu.restaurante.logoUrl ? (
              <img
                src={
                  menu.restaurante
                    .logoUrl
                }
                alt={
                  menu.restaurante
                    .nombre
                }
                className="h-16 w-16 rounded-2xl bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-slate-950">
                <UtensilsCrossed
                  size={30}
                />
              </div>
            )}

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400">
                Bienvenido a
              </p>

              <h1 className="mt-1 text-3xl font-black">
                {
                  menu.restaurante
                    .nombre
                }
              </h1>

              <p className="mt-1 text-sm text-slate-300">
                Donde te pierdes con
                el buen sabor
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Tu mesa
              </p>

              <div className="mt-1 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-black">
                    {
                      menu.mesa.nombre
                    }
                  </p>

                  <p className="text-sm text-slate-300">
                    {
                      menu.mesa.zona
                        .nombre
                    }
                  </p>
                </div>

                <span className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-black text-emerald-950">
                  Carta digital
                </span>
              </div>
            </div>

            {menu.mesa.estado !==
              "LIBRE" &&
              pedidos.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setMostrarPedidos(
                    true
                  )
                }
                className="flex min-w-[230px] items-center justify-between gap-4 rounded-3xl bg-white px-5 py-4 text-left text-slate-950"
              >
                <div>
                  <p className="text-xs font-bold text-slate-500">
                    Mi consumo
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    S/{" "}
                    {totalPedidos.toFixed(
                      2
                    )}
                  </p>

                  <p className="text-xs text-slate-500">
                    {pedidos.length} pedido(s)
                  </p>
                </div>

                <History
                  size={28}
                />
              </button>
            )}
          </div>
        </div>
      </header>

      {(mensajePedido ||
        errorPedido) && (
        <div className="mx-auto max-w-6xl px-4 pt-4 md:px-6">
          <div
            className={`flex items-start gap-3 rounded-2xl border px-5 py-4 font-bold ${
              mensajePedido
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {mensajePedido ? (
              <CheckCircle2
                size={22}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <AlertCircle
                size={22}
                className="mt-0.5 shrink-0"
              />
            )}

            <span>
              {mensajePedido ||
                errorPedido}
            </span>
          </div>
        </div>
      )}

      {cuentaSolicitada && (
        <div className="mx-auto max-w-6xl px-4 pt-4 md:px-6">
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={25}
                className="shrink-0"
              />

              <div>
                <p className="font-black">
                  Cuenta solicitada
                </p>

                <p className="mt-1 text-sm">
                  Caja fue notificada. Ya no se pueden agregar nuevos pedidos a esta mesa.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {menu.mesa.estado ===
        "LIBRE" && (
        <div className="mx-auto max-w-6xl px-4 pt-4 md:px-6">
          <section className="overflow-hidden rounded-[30px] border border-amber-200 bg-white shadow-lg">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-slate-950 md:p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Mesa disponible
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Nueva atención · {menu.mesa.nombre}
              </h2>

              <p className="mt-1 text-sm font-semibold">
                Esta mesa está libre. Inicia una nueva atención para comenzar a pedir.
              </p>
            </div>

            <div className="space-y-5 p-5 md:p-6">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2
                  size={21}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <div>
                  <p className="font-black text-emerald-900">
                    Atención nueva
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-700">
                    No tienes consumos pendientes. Los pedidos de clientes anteriores no forman parte de esta atención.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Cantidad de personas
                </label>

                <input
                  type="number"
                  min={1}
                  max={
                    menu.mesa.capacidad
                  }
                  value={
                    cantidadPersonas
                  }
                  onChange={(evento) =>
                    setCantidadPersonas(
                      Math.max(
                        1,
                        Math.min(
                          menu.mesa
                            .capacidad,
                          Number(
                            evento.target
                              .value
                          ) || 1
                        )
                      )
                    )
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 text-lg font-black outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />
              </div>

              <div>
                <p className="text-sm font-black text-slate-700">
                  ¿Cómo pagarás al finalizar?
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Es el método previsto. El pago real se registra al final en Caja.
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    ["EFECTIVO", "💵", "Efectivo"],
                    ["YAPE", "📱", "Yape"],
                    ["PLIN", "📲", "Plin"],
                    ["TARJETA", "💳", "Tarjeta"],
                    ["MIXTO", "🔀", "Mixto"],
                  ].map(
                    ([
                      valor,
                      icono,
                      texto,
                    ]) => {
                      const metodo =
                        valor as MetodoPagoPrevisto;

                      const seleccionado =
                        metodoPagoSeleccionado ===
                        metodo;

                      return (
                        <button
                          key={
                            valor
                          }
                          type="button"
                          onClick={() => {
                            setMetodoPagoSeleccionado(
                              metodo
                            );
                            setErrorPedido(
                              ""
                            );
                          }}
                          className={`rounded-2xl border-2 p-4 text-left transition ${
                            seleccionado
                              ? "border-amber-500 bg-amber-50 ring-4 ring-amber-100"
                              : "border-slate-200 bg-white hover:border-amber-300"
                          }`}
                        >
                          <span className="text-2xl">
                            {icono}
                          </span>

                          <p className="mt-2 font-black text-slate-950">
                            {texto}
                          </p>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={
                  ocuparMesa
                }
                disabled={
                  ocupandoMesa ||
                  !metodoPagoSeleccionado
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-lg font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {ocupandoMesa ? (
                  <>
                    <LoaderCircle
                      size={21}
                      className="animate-spin"
                    />
                    Ocupando mesa...
                  </>
                ) : (
                  <>
                    <UtensilsCrossed
                      size={21}
                    />
                    Ocupar mesa e iniciar atención
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {menu.mesa.estado ===
        "PAGADA" && (
        <div className="mx-auto max-w-6xl px-4 pt-4 md:px-6">
          <section className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm md:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <CheckCircle2
                  size={26}
                />
              </div>

              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Cuenta pagada
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Esta atención ya terminó
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  Libera la mesa para cerrar la atención y dejarla lista para el siguiente cliente.
                </p>

                <button
                  type="button"
                  onClick={
                    liberarMesaDesdeQr
                  }
                  disabled={
                    liberandoMesa
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 font-black text-white transition hover:bg-violet-500 disabled:opacity-50 sm:w-auto"
                >
                  {liberandoMesa ? (
                    <>
                      <LoaderCircle
                        size={20}
                        className="animate-spin"
                      />
                      Liberando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={20}
                      />
                      Liberar mesa
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
        {menu.mesa.estado !==
          "LIBRE" &&
          pedidos.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-600">
                  Tu atención
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {atencion?.codigo ??
                    "Pedidos de tu mesa"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Total acumulado:{" "}
                  <span className="font-black text-emerald-700">
                    S/{" "}
                    {totalPedidos.toFixed(
                      2
                    )}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMostrarPedidos(
                      true
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-black text-white"
                >
                  <History
                    size={18}
                  />
                  Ver mis pedidos
                </button>

                {!cuentaSolicitada && (
                  <button
                    type="button"
                    onClick={
                      solicitarCuenta
                    }
                    disabled={
                      solicitandoCuenta ||
                      hayPedidosPendientes ||
                      !atencion
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {solicitandoCuenta ? (
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <ReceiptText
                        size={18}
                      />
                    )}

                    Solicitar cuenta
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    cargarEstadoAtencion(
                      menu.mesa.id
                    )
                  }
                  disabled={
                    cargandoEstado
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-700"
                >
                  <RefreshCcw
                    size={18}
                    className={
                      cargandoEstado
                        ? "animate-spin"
                        : ""
                    }
                  />
                  Actualizar
                </button>
              </div>
            </div>

            {!cuentaSolicitada &&
              hayPedidosPendientes && (
                <p className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                  Podrás solicitar la cuenta cuando todos tus pedidos estén entregados.
                </p>
              )}
          </section>
        )}

        <div className="sticky top-0 z-20 space-y-3 bg-slate-100 py-3">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={
                busqueda
              }
              onChange={(
                evento
              ) =>
                setBusqueda(
                  evento.target.value
                )
              }
              placeholder={
                menu.mesa.estado ===
                "LIBRE"
                  ? "Primero ocupa la mesa"
                  : cuentaSolicitada
                    ? "Cuenta solicitada"
                    : "Buscar un plato o bebida..."
              }
              disabled={
                !puedePedir
              }
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 outline-none shadow-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:bg-slate-200 disabled:text-slate-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() =>
                setCategoriaSeleccionada(
                  ""
                )
              }
              disabled={
                !puedePedir
              }
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${
                !categoriaSeleccionada
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-600"
              } disabled:opacity-40`}
            >
              Todos
            </button>

            {menu.categorias.map(
              (categoria) => (
                <button
                  key={
                    categoria.id
                  }
                  type="button"
                  disabled={
                    !puedePedir
                  }
                  onClick={() =>
                    setCategoriaSeleccionada(
                      categoria.id
                    )
                  }
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${
                    categoriaSeleccionada ===
                    categoria.id
                      ? "bg-amber-500 text-slate-950"
                      : "bg-white text-slate-600"
                  } disabled:opacity-40`}
                >
                  {
                    categoria.nombre
                  }
                </button>
              )
            )}
          </div>
        </div>

        {productosFiltrados.length ===
        0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <ShoppingBag
              size={48}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 font-black text-slate-700">
              No encontramos productos.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productosFiltrados.map(
              (producto) => (
                <article
                  key={
                    producto.id
                  }
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-48 bg-slate-100">
                    {producto.imagenUrl ? (
                      <img
                        src={
                          producto.imagenUrl
                        }
                        alt={
                          producto.nombre
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon
                          size={45}
                          className="text-slate-300"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-600">
                      {
                        producto.categoriaNombre
                      }
                    </p>

                    <h2 className="mt-1 text-xl font-black text-slate-950">
                      {
                        producto.nombre
                      }
                    </h2>

                    {producto.descripcion && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        {
                          producto.descripcion
                        }
                      </p>
                    )}

                    <div className="mt-5 flex items-center justify-between gap-4">
                      <p className="text-2xl font-black text-slate-950">
                        S/{" "}
                        {Number(
                          producto.precioVenta
                        ).toFixed(2)}
                      </p>

                      <button
                        type="button"
                        disabled={
                          !puedePedir
                        }
                        onClick={() =>
                          agregarProducto(
                            producto
                          )
                        }
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Plus
                          size={22}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </section>
        )}
      </div>

      {cantidadTotal > 0 &&
        puedePedir && (
        <button
          type="button"
          onClick={() =>
            setMostrarCarrito(
              true
            )
          }
          className="fixed bottom-4 left-4 right-4 z-30 mx-auto flex max-w-xl items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart
                size={26}
              />

              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-slate-950">
                {
                  cantidadTotal
                }
              </span>
            </div>

            <span className="font-black">
              Ver mi pedido
            </span>
          </div>

          <span className="text-xl font-black">
            S/{" "}
            {totalCarrito.toFixed(
              2
            )}
          </span>
        </button>
      )}

      {pedidoEnviado && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 text-center shadow-2xl md:p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2
                size={46}
              />
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Pedido enviado
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-950">
              ¡Tu pedido fue enviado correctamente!
            </h2>

            <p className="mt-3 text-slate-600">
              Pedido{" "}
              <span className="font-black text-slate-950">
                {pedidoEnviado.numero}
              </span>
              . Ahora está esperando la confirmación del mozo.
            </p>

            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-left">
              <p className="text-sm font-black text-orange-800">
                Estado actual
              </p>

              <div className="mt-2 flex items-center gap-2 text-orange-700">
                <Clock3
                  size={18}
                />
                <span className="font-bold">
                  Esperando confirmación
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setPedidoEnviado(
                    null
                  );
                  setMostrarPedidos(
                    true
                  );
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-slate-800"
              >
                <History
                  size={19}
                />
                Ver mis pedidos
              </button>

              <button
                type="button"
                onClick={() =>
                  setPedidoEnviado(
                    null
                  )
                }
                className="rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-400"
              >
                Seguir ordenando
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarCarrito && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/70 backdrop-blur-sm md:items-center md:justify-center md:p-5">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl md:max-w-2xl md:rounded-3xl">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-600">
                  Tu pedido
                </p>

                <h2 className="text-2xl font-black">
                  {
                    menu.mesa.nombre
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarCarrito(
                    false
                  )
                }
                className="rounded-xl bg-slate-100 p-3"
              >
                <X
                  size={21}
                />
              </button>
            </header>

            <div className="space-y-4 p-5">
              {carrito.map(
                (item) => (
                  <div
                    key={
                      item.producto.id
                    }
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950">
                          {
                            item.producto.nombre
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          S/{" "}
                          {Number(
                            item.producto.precioVenta
                          ).toFixed(2)}
                        </p>
                      </div>

                      <p className="font-black">
                        S/{" "}
                        {(
                          Number(
                            item.producto.precioVenta
                          ) *
                          item.cantidad
                        ).toFixed(
                          2
                        )}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          cambiarCantidad(
                            item.producto.id,
                            item.cantidad -
                              1
                          )
                        }
                        className="rounded-xl bg-slate-100 p-2"
                      >
                        <Minus
                          size={18}
                        />
                      </button>

                      <span className="min-w-8 text-center text-lg font-black">
                        {
                          item.cantidad
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          cambiarCantidad(
                            item.producto.id,
                            item.cantidad +
                              1
                          )
                        }
                        className="rounded-xl bg-amber-500 p-2"
                      >
                        <Plus
                          size={18}
                        />
                      </button>
                    </div>

                    <input
                      value={
                        item.observacion
                      }
                      onChange={(
                        evento
                      ) =>
                        cambiarObservacion(
                          item.producto.id,
                          evento.target.value
                        )
                      }
                      placeholder="Observación opcional..."
                      maxLength={150}
                      className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                )
              )}

              <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                <span className="text-lg font-black">
                  Total
                </span>

                <span className="text-3xl font-black text-emerald-600">
                  S/{" "}
                  {totalCarrito.toFixed(
                    2
                  )}
                </span>
              </div>

              {!atencion ? (
                <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-700">
                    Método de pago
                  </p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">
                    ¿Cómo pagarás al finalizar?
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Solo indícanos cómo piensas pagar. El pago se realiza al final en caja.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      ["EFECTIVO", "💵", "Efectivo"],
                      ["YAPE", "📱", "Yape"],
                      ["PLIN", "📲", "Plin"],
                      ["TARJETA", "💳", "Tarjeta"],
                      ["MIXTO", "🔀", "Mixto"],
                    ].map(([valor, icono, texto]) => {
                      const metodo =
                        valor as MetodoPagoPrevisto;
                      const seleccionado =
                        metodoPagoSeleccionado === metodo;

                      return (
                        <button
                          key={valor}
                          type="button"
                          onClick={() => {
                            setMetodoPagoSeleccionado(
                              metodo
                            );
                            setErrorPedido("");
                          }}
                          className={`rounded-2xl border-2 p-4 text-left transition active:scale-[0.98] ${
                            seleccionado
                              ? "border-amber-500 bg-white shadow-md ring-4 ring-amber-100"
                              : "border-slate-200 bg-white hover:border-amber-300"
                          }`}
                        >
                          <span className="text-2xl">
                            {icono}
                          </span>
                          <p className="mt-2 font-black text-slate-950">
                            {texto}
                          </p>
                          {seleccionado && (
                            <p className="mt-1 text-xs font-black text-emerald-700">
                              Seleccionado
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {!metodoPagoSeleccionado && (
                    <p className="mt-3 text-sm font-bold text-amber-800">
                      Selecciona una opción para enviar tu primer pedido.
                    </p>
                  )}
                </section>
              ) : (
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                    Pago previsto
                  </p>
                  <p className="mt-1 font-black text-slate-950">
                    {(
                      atencion.metodoPagoPrevisto ??
                      metodoPagoSeleccionado ??
                      "REGISTRADO"
                    )
                      .toString()
                      .replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Se mantiene para los siguientes pedidos de esta atención.
                  </p>
                </section>
              )}

              <button
                type="button"
                onClick={
                  enviarPedido
                }
                disabled={
                  enviandoPedido ||
                  carrito.length ===
                    0 ||
                  !puedePedir ||
                  (!atencion &&
                    !metodoPagoSeleccionado)
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviandoPedido ? (
                  <>
                    <LoaderCircle
                      size={20}
                      className="animate-spin"
                    />
                    Enviando pedido...
                  </>
                ) : (
                  <>
                    <ShoppingBag
                      size={20}
                    />
                    Enviar pedido
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarPedidos && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white">
            <header className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-600">
                  Mi atención
                </p>

                <h2 className="text-2xl font-black text-slate-950">
                  Mis pedidos
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarPedidos(
                    false
                  )
                }
                className="rounded-xl bg-slate-100 p-3"
              >
                <X
                  size={21}
                />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              {pedidos.length ===
              0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                  Todavía no tienes pedidos.
                </div>
              ) : (
                <div className="space-y-4">
                  {pedidos.map(
                    (pedido) => {
                      const visual =
                        estadoPedidoVisual(
                          pedido.estado
                        );

                      return (
                        <article
                          key={
                            pedido.id
                          }
                          className="rounded-3xl border border-slate-200 p-5"
                        >
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider text-amber-600">
                                {
                                  pedido.numero
                                }
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {formatearHora(
                                  pedido.fechaPedido
                                )}
                              </p>
                            </div>

                            <span
                              className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${visual.clases}`}
                            >
                              {
                                visual.texto
                              }
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                            {pedido.detalles.map(
                              (
                                detalle
                              ) => (
                                <div
                                  key={
                                    detalle.id
                                  }
                                  className="flex justify-between gap-4 text-sm"
                                >
                                  <span className="text-slate-600">
                                    {Number(
                                      detalle.cantidad
                                    )}{" "}
                                    ×{" "}
                                    {
                                      detalle.producto.nombre
                                    }
                                  </span>

                                  <span className="font-black">
                                    S/{" "}
                                    {Number(
                                      detalle.subtotal
                                    ).toFixed(
                                      2
                                    )}
                                  </span>
                                </div>
                              )
                            )}
                          </div>

                          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4">
                            <span className="font-bold text-slate-500">
                              Total pedido
                            </span>

                            <span className="text-lg font-black">
                              S/{" "}
                              {Number(
                                pedido.subtotal
                              ).toFixed(
                                2
                              )}
                            </span>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <footer className="border-t border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">
                  Total acumulado
                </span>

                <span className="text-3xl font-black text-emerald-600">
                  S/{" "}
                  {totalPedidos.toFixed(
                    2
                  )}
                </span>
              </div>

              {!cuentaSolicitada && (
                <button
                  type="button"
                  onClick={
                    solicitarCuenta
                  }
                  disabled={
                    solicitandoCuenta ||
                    hayPedidosPendientes ||
                    !atencion
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {solicitandoCuenta ? (
                    <LoaderCircle
                      size={20}
                      className="animate-spin"
                    />
                  ) : (
                    <ReceiptText
                      size={20}
                    />
                  )}

                  Solicitar cuenta
                </button>
              )}

              {!cuentaSolicitada &&
                hayPedidosPendientes && (
                  <p className="mt-3 text-center text-sm font-bold text-orange-700">
                    Primero deben entregarse todos los pedidos.
                  </p>
                )}
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}