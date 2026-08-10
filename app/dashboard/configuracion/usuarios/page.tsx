"use client";

import Link from "next/link";

import {
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Plus,
  Power,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type RolUsuario =
  | "SUPERADMIN"
  | "ADMINISTRADOR"
  | "GERENTE"
  | "MOZO"
  | "COCINA"
  | "BARRA"
  | "CAJERO";

type SesionActual = {
  sub: string;
  sucursalId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolUsuario;
  exp: number;
};

type UsuarioListado = {
  id: string;
  nombres: string;
  apellidos: string;
  nombreCompleto?: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
  sucursalId: string;

  sucursal: {
    id: string;
    nombre: string;
    codigo: string;
    empresa:
      | string
      | {
          nombre: string;
        };
  };

  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type FormUsuario = {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  rol: RolUsuario;
};

const FORM_INICIAL: FormUsuario = {
  nombres: "",
  apellidos: "",
  correo: "",
  password: "",
  rol: "MOZO",
};

const ROLES_BASE: Array<{
  value: RolUsuario;
  label: string;
}> = [
  {
    value:
      "ADMINISTRADOR",
    label:
      "Administrador",
  },
  {
    value:
      "GERENTE",
    label:
      "Gerente",
  },
  {
    value:
      "MOZO",
    label:
      "Mozo",
  },
  {
    value:
      "COCINA",
    label:
      "Cocina",
  },
  {
    value:
      "BARRA",
    label:
      "Barra",
  },
  {
    value:
      "CAJERO",
    label:
      "Cajero",
  },
];

function nombreCompleto(
  usuario: UsuarioListado
) {
  return (
    usuario.nombreCompleto ||
    `${usuario.nombres} ${usuario.apellidos}`
  );
}

function empresaUsuario(
  usuario: UsuarioListado
) {
  return typeof usuario.sucursal
    .empresa === "string"
    ? usuario.sucursal.empresa
    : usuario.sucursal.empresa
        .nombre;
}

function iniciales(
  usuario: UsuarioListado
) {
  return `${usuario.nombres
    .trim()
    .charAt(0)}${usuario.apellidos
    .trim()
    .charAt(0)}`.toUpperCase();
}

function rolVisual(
  rol: RolUsuario
) {
  const mapa: Record<
    RolUsuario,
    {
      texto: string;
      clase: string;
    }
  > = {
    SUPERADMIN: {
      texto:
        "Superadmin",
      clase:
        "bg-violet-100 text-violet-700",
    },

    ADMINISTRADOR: {
      texto:
        "Administrador",
      clase:
        "bg-slate-950 text-white",
    },

    GERENTE: {
      texto:
        "Gerente",
      clase:
        "bg-indigo-100 text-indigo-700",
    },

    MOZO: {
      texto:
        "Mozo",
      clase:
        "bg-amber-100 text-amber-700",
    },

    COCINA: {
      texto:
        "Cocina",
      clase:
        "bg-orange-100 text-orange-700",
    },

    BARRA: {
      texto:
        "Barra",
      clase:
        "bg-cyan-100 text-cyan-700",
    },

    CAJERO: {
      texto:
        "Cajero",
      clase:
        "bg-emerald-100 text-emerald-700",
    },
  };

  return mapa[rol];
}

export default function UsuariosPage() {
  const [
    usuarios,
    setUsuarios,
  ] =
    useState<UsuarioListado[]>(
      []
    );

  const [
    sesion,
    setSesion,
  ] =
    useState<SesionActual | null>(
      null
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    procesandoId,
    setProcesandoId,
  ] =
    useState<string | null>(
      null
    );

  const [
    busqueda,
    setBusqueda,
  ] =
    useState("");

  const [
    filtroRol,
    setFiltroRol,
  ] =
    useState("");

  const [
    mensaje,
    setMensaje,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    modalCrear,
    setModalCrear,
  ] =
    useState(false);

  const [
    modalEditar,
    setModalEditar,
  ] =
    useState<UsuarioListado | null>(
      null
    );

  const [
    modalPassword,
    setModalPassword,
  ] =
    useState<UsuarioListado | null>(
      null
    );

  const [
    formulario,
    setFormulario,
  ] =
    useState<FormUsuario>(
      FORM_INICIAL
    );

  const [
    nuevaPassword,
    setNuevaPassword,
  ] =
    useState("");

  const [
    mostrarPassword,
    setMostrarPassword,
  ] =
    useState(false);

  const cargarSesion =
    useCallback(async () => {
      const respuesta =
        await fetch(
          "/api/auth/me",
          {
            cache:
              "no-store",
          }
        );

      const resultado =
        (await respuesta.json()) as ApiResponse<SesionActual>;

      if (
        respuesta.ok &&
        resultado.success &&
        resultado.data
      ) {
        setSesion(
          resultado.data
        );
      }
    }, []);

  const cargarUsuarios =
    useCallback(async () => {
      try {
        setCargando(true);
        setError("");

        const respuesta =
          await fetch(
            "/api/configuracion/usuarios",
            {
              method:
                "GET",
              cache:
                "no-store",
            }
          );

        const resultado =
          (await respuesta.json()) as ApiResponse<
            UsuarioListado[]
          >;

        if (
          !respuesta.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron cargar los usuarios."
          );
        }

        setUsuarios(
          resultado.data ?? []
        );
      } catch (
        errorDesconocido
      ) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Error cargando usuarios."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    cargarSesion();
    cargarUsuarios();
  }, [
    cargarSesion,
    cargarUsuarios,
  ]);

  const rolesDisponibles =
    useMemo(() => {
      if (
        sesion?.rol ===
        "SUPERADMIN"
      ) {
        return [
          {
            value:
              "SUPERADMIN" as RolUsuario,
            label:
              "Superadmin",
          },
          ...ROLES_BASE,
        ];
      }

      return ROLES_BASE;
    }, [
      sesion?.rol,
    ]);

  const usuariosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return usuarios.filter(
        (usuario) => {
          const coincideBusqueda =
            !texto ||
            nombreCompleto(
              usuario
            )
              .toLowerCase()
              .includes(
                texto
              ) ||
            usuario.correo
              .toLowerCase()
              .includes(
                texto
              );

          const coincideRol =
            !filtroRol ||
            usuario.rol ===
              filtroRol;

          return (
            coincideBusqueda &&
            coincideRol
          );
        }
      );
    }, [
      usuarios,
      busqueda,
      filtroRol,
    ]);

  const activos =
    usuarios.filter(
      (usuario) =>
        usuario.activo
    ).length;

  function limpiarAvisos() {
    setMensaje("");
    setError("");
  }

  function abrirCrear() {
    limpiarAvisos();

    setFormulario({
      ...FORM_INICIAL,
    });

    setMostrarPassword(
      false
    );

    setModalCrear(true);
  }

  function abrirEditar(
    usuario: UsuarioListado
  ) {
    limpiarAvisos();

    setFormulario({
      nombres:
        usuario.nombres,
      apellidos:
        usuario.apellidos,
      correo:
        usuario.correo,
      password: "",
      rol:
        usuario.rol,
    });

    setModalEditar(
      usuario
    );
  }

  function abrirPassword(
    usuario: UsuarioListado
  ) {
    limpiarAvisos();

    setNuevaPassword("");
    setMostrarPassword(
      false
    );

    setModalPassword(
      usuario
    );
  }

  async function crearUsuario(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    try {
      setProcesandoId(
        "crear"
      );

      limpiarAvisos();

      const respuesta =
        await fetch(
          "/api/configuracion/usuarios",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                formulario
              ),
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
            "No se pudo crear el usuario."
        );
      }

      setModalCrear(
        false
      );

      setMensaje(
        resultado.message
      );

      await cargarUsuarios();
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Error creando usuario."
      );
    } finally {
      setProcesandoId(
        null
      );
    }
  }

  async function editarUsuario(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!modalEditar) {
      return;
    }

    try {
      setProcesandoId(
        modalEditar.id
      );

      limpiarAvisos();

      const respuesta =
        await fetch(
          `/api/configuracion/usuarios/${encodeURIComponent(
            modalEditar.id
          )}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                accion:
                  "EDITAR",

                nombres:
                  formulario.nombres,

                apellidos:
                  formulario.apellidos,

                correo:
                  formulario.correo,

                rol:
                  formulario.rol,
              }),
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
            "No se pudo actualizar el usuario."
        );
      }

      setModalEditar(
        null
      );

      setMensaje(
        resultado.message
      );

      await cargarUsuarios();
      await cargarSesion();
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Error actualizando usuario."
      );
    } finally {
      setProcesandoId(
        null
      );
    }
  }

  async function cambiarEstado(
    usuario: UsuarioListado
  ) {
    const accion =
      usuario.activo
        ? "desactivar"
        : "activar";

    if (
      !window.confirm(
        `¿Seguro que deseas ${accion} a ${nombreCompleto(
          usuario
        )}?`
      )
    ) {
      return;
    }

    try {
      setProcesandoId(
        usuario.id
      );

      limpiarAvisos();

      const respuesta =
        await fetch(
          `/api/configuracion/usuarios/${encodeURIComponent(
            usuario.id
          )}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                accion:
                  "CAMBIAR_ESTADO",
              }),
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
            "No se pudo cambiar el estado del usuario."
        );
      }

      setMensaje(
        resultado.message
      );

      await cargarUsuarios();
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Error actualizando estado."
      );
    } finally {
      setProcesandoId(
        null
      );
    }
  }

  async function restablecerPassword(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!modalPassword) {
      return;
    }

    try {
      setProcesandoId(
        modalPassword.id
      );

      limpiarAvisos();

      const respuesta =
        await fetch(
          `/api/configuracion/usuarios/${encodeURIComponent(
            modalPassword.id
          )}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                accion:
                  "RESTABLECER_PASSWORD",

                password:
                  nuevaPassword,
              }),
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
            "No se pudo restablecer la contraseña."
        );
      }

      setModalPassword(
        null
      );

      setNuevaPassword("");

      setMensaje(
        resultado.message
      );
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Error restableciendo contraseña."
      );
    } finally {
      setProcesandoId(
        null
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-7">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">
                Restaurante Chinka Chinka
              </p>

              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <Users
                  size={38}
                />
                Usuarios y roles
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Administra al personal,
                sus accesos y roles.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/configuracion"
                className="rounded-2xl bg-white/10 px-5 py-3 font-black transition hover:bg-white/20"
              >
                ← Configuración
              </Link>

              <button
                type="button"
                onClick={
                  cargarUsuarios
                }
                disabled={
                  cargando
                }
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 disabled:opacity-50"
              >
                <RefreshCcw
                  size={18}
                  className={
                    cargando
                      ? "animate-spin"
                      : ""
                  }
                />
                Actualizar
              </button>

              <button
                type="button"
                onClick={
                  abrirCrear
                }
                className="flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-black text-slate-950 transition hover:bg-amber-400"
              >
                <Plus
                  size={19}
                />
                Crear usuario
              </button>
            </div>
          </div>
        </header>

        {(mensaje ||
          error) && (
          <section
            className={`flex items-start justify-between gap-4 rounded-2xl border px-5 py-4 ${
              mensaje
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <p className="font-bold">
              {mensaje ||
                error}
            </p>

            <button
              type="button"
              onClick={
                limpiarAvisos
              }
            >
              <X size={18} />
            </button>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Total
            </p>

            <p className="mt-2 text-3xl font-black">
              {usuarios.length}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-bold text-emerald-700">
              Activos
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-600">
              {activos}
            </p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-bold text-red-700">
              Inactivos
            </p>

            <p className="mt-2 text-3xl font-black text-red-600">
              {usuarios.length -
                activos}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_260px]">
            <div className="relative">
              <Search
                size={19}
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
                placeholder="Buscar nombre o correo..."
                className="w-full rounded-2xl border border-slate-200 py-4 pl-12 pr-4 outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={
                filtroRol
              }
              onChange={(
                evento
              ) =>
                setFiltroRol(
                  evento.target.value
                )
              }
              className="rounded-2xl border border-slate-200 px-4 py-4 font-bold outline-none"
            >
              <option value="">
                Todos los roles
              </option>

              {rolesDisponibles.map(
                (rol) => (
                  <option
                    key={
                      rol.value
                    }
                    value={
                      rol.value
                    }
                  >
                    {
                      rol.label
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div className="mt-5 overflow-x-auto">
            {cargando ? (
              <div className="flex min-h-72 items-center justify-center">
                <LoaderCircle
                  size={42}
                  className="animate-spin text-amber-500"
                />
              </div>
            ) : (
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-4">
                      Usuario
                    </th>
                    <th className="px-4 py-4">
                      Correo
                    </th>
                    <th className="px-4 py-4">
                      Rol
                    </th>
                    <th className="px-4 py-4">
                      Sucursal
                    </th>
                    <th className="px-4 py-4">
                      Estado
                    </th>
                    <th className="px-4 py-4 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map(
                    (usuario) => {
                      const visual =
                        rolVisual(
                          usuario.rol
                        );

                      const bloqueado =
                        procesandoId ===
                        usuario.id;

                      return (
                        <tr
                          key={
                            usuario.id
                          }
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 font-black text-white">
                                {iniciales(
                                  usuario
                                )}
                              </div>

                              <div>
                                <p className="font-black text-slate-950">
                                  {nombreCompleto(
                                    usuario
                                  )}
                                </p>

                                {sesion?.sub ===
                                  usuario.id && (
                                  <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">
                                    Tú
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-700">
                            {
                              usuario.correo
                            }
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${visual.clase}`}
                            >
                              {
                                visual.texto
                              }
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-bold">
                              {
                                usuario
                                  .sucursal
                                  .nombre
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              {empresaUsuario(
                                usuario
                              )}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            {usuario.activo ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
                                <CheckCircle2
                                  size={14}
                                />
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-red-100 px-3 py-1.5 text-xs font-black text-red-700">
                                Inactivo
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  abrirEditar(
                                    usuario
                                  )
                                }
                                disabled={
                                  bloqueado
                                }
                                className="rounded-xl bg-slate-100 p-2.5 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                                title="Editar usuario"
                              >
                                <Edit3
                                  size={17}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  abrirPassword(
                                    usuario
                                  )
                                }
                                disabled={
                                  bloqueado
                                }
                                className="rounded-xl bg-amber-100 p-2.5 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
                                title="Restablecer contraseña"
                              >
                                <KeyRound
                                  size={17}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(
                                    usuario
                                  )
                                }
                                disabled={
                                  bloqueado ||
                                  (sesion?.sub ===
                                    usuario.id &&
                                    usuario.activo)
                                }
                                className={`rounded-xl p-2.5 disabled:opacity-40 ${
                                  usuario.activo
                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                }`}
                                title={
                                  usuario.activo
                                    ? "Desactivar"
                                    : "Activar"
                                }
                              >
                                {bloqueado ? (
                                  <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Power
                                    size={17}
                                  />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* =====================================================
          MODAL CREAR
      ====================================================== */}
      {modalCrear && (
        <ModalBase
          titulo="Crear usuario"
          subtitulo="Registra un nuevo acceso al sistema."
          onCerrar={() =>
            !procesandoId &&
            setModalCrear(
              false
            )
          }
        >
          <FormularioUsuario
            formulario={
              formulario
            }
            setFormulario={
              setFormulario
            }
            roles={
              rolesDisponibles
            }
            mostrarPassword={
              mostrarPassword
            }
            setMostrarPassword={
              setMostrarPassword
            }
            incluirPassword
            procesando={
              procesandoId ===
              "crear"
            }
            textoBoton="Crear usuario"
            onSubmit={
              crearUsuario
            }
          />
        </ModalBase>
      )}

      {/* =====================================================
          MODAL EDITAR
      ====================================================== */}
      {modalEditar && (
        <ModalBase
          titulo="Editar usuario"
          subtitulo={
            nombreCompleto(
              modalEditar
            )
          }
          onCerrar={() =>
            !procesandoId &&
            setModalEditar(
              null
            )
          }
        >
          <FormularioUsuario
            formulario={
              formulario
            }
            setFormulario={
              setFormulario
            }
            roles={
              rolesDisponibles
            }
            mostrarPassword={
              false
            }
            setMostrarPassword={() => {}}
            incluirPassword={
              false
            }
            procesando={
              procesandoId ===
              modalEditar.id
            }
            textoBoton="Guardar cambios"
            onSubmit={
              editarUsuario
            }
          />
        </ModalBase>
      )}

      {/* =====================================================
          MODAL PASSWORD
      ====================================================== */}
      {modalPassword && (
        <ModalBase
          titulo="Restablecer contraseña"
          subtitulo={
            nombreCompleto(
              modalPassword
            )
          }
          onCerrar={() =>
            !procesandoId &&
            setModalPassword(
              null
            )
          }
        >
          <form
            onSubmit={
              restablecerPassword
            }
            className="space-y-5"
          >
            <div className="rounded-2xl bg-amber-50 p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  size={23}
                  className="shrink-0 text-amber-700"
                />

                <p className="text-sm text-amber-900">
                  La contraseña anterior dejará de funcionar inmediatamente.
                </p>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-black">
                Nueva contraseña
              </span>

              <div className="flex items-center rounded-2xl border border-slate-300 bg-white pr-3 focus-within:border-amber-500">
                <input
                  type={
                    mostrarPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    nuevaPassword
                  }
                  onChange={(
                    evento
                  ) =>
                    setNuevaPassword(
                      evento.target.value
                    )
                  }
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-2xl px-4 py-3.5 outline-none"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword(
                      (actual) =>
                        !actual
                    )
                  }
                  className="p-2 text-slate-500"
                >
                  {mostrarPassword ? (
                    <EyeOff
                      size={19}
                    />
                  ) : (
                    <Eye
                      size={19}
                    />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={
                procesandoId ===
                modalPassword.id
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 disabled:opacity-50"
            >
              {procesandoId ===
              modalPassword.id ? (
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />
              ) : (
                <KeyRound
                  size={19}
                />
              )}

              Restablecer contraseña
            </button>
          </form>
        </ModalBase>
      )}
    </main>
  );
}

function ModalBase({
  titulo,
  subtitulo,
  onCerrar,
  children,
}: {
  titulo: string;
  subtitulo: string;
  onCerrar: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5 md:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
              Administración
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {titulo}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {subtitulo}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onCerrar
            }
            className="rounded-xl bg-slate-100 p-3 text-slate-600"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-5 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function FormularioUsuario({
  formulario,
  setFormulario,
  roles,
  mostrarPassword,
  setMostrarPassword,
  incluirPassword,
  procesando,
  textoBoton,
  onSubmit,
}: {
  formulario:
    FormUsuario;

  setFormulario:
    React.Dispatch<
      React.SetStateAction<FormUsuario>
    >;

  roles:
    Array<{
      value:
        RolUsuario;
      label:
        string;
    }>;

  mostrarPassword:
    boolean;

  setMostrarPassword:
    React.Dispatch<
      React.SetStateAction<boolean>
    >;

  incluirPassword:
    boolean;

  procesando:
    boolean;

  textoBoton:
    string;

  onSubmit:
    (
      evento:
        FormEvent<HTMLFormElement>
    ) => void;
}) {
  return (
    <form
      onSubmit={
        onSubmit
      }
      className="space-y-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-black">
            Nombres
          </span>

          <input
            value={
              formulario.nombres
            }
            onChange={(
              evento
            ) =>
              setFormulario(
                (actual) => ({
                  ...actual,
                  nombres:
                    evento.target.value,
                })
              )
            }
            className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none focus:border-amber-500"
            required
          />
        </label>

        <label>
          <span className="mb-2 block text-sm font-black">
            Apellidos
          </span>

          <input
            value={
              formulario.apellidos
            }
            onChange={(
              evento
            ) =>
              setFormulario(
                (actual) => ({
                  ...actual,
                  apellidos:
                    evento.target.value,
                })
              )
            }
            className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none focus:border-amber-500"
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-black">
          Correo electrónico
        </span>

        <input
          type="email"
          value={
            formulario.correo
          }
          onChange={(
            evento
          ) =>
            setFormulario(
              (actual) => ({
                ...actual,
                correo:
                  evento.target.value,
              })
            )
          }
          className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none focus:border-amber-500"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-black">
          Rol
        </span>

        <select
          value={
            formulario.rol
          }
          onChange={(
            evento
          ) =>
            setFormulario(
              (actual) => ({
                ...actual,
                rol:
                  evento.target.value as RolUsuario,
              })
            )
          }
          className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none focus:border-amber-500"
        >
          {roles.map(
            (rol) => (
              <option
                key={
                  rol.value
                }
                value={
                  rol.value
                }
              >
                {rol.label}
              </option>
            )
          )}
        </select>
      </label>

      {incluirPassword && (
        <label className="block">
          <span className="mb-2 block text-sm font-black">
            Contraseña inicial
          </span>

          <div className="flex items-center rounded-2xl border border-slate-300 bg-white pr-3 focus-within:border-amber-500">
            <input
              type={
                mostrarPassword
                  ? "text"
                  : "password"
              }
              value={
                formulario.password
              }
              onChange={(
                evento
              ) =>
                setFormulario(
                  (actual) => ({
                    ...actual,
                    password:
                      evento.target.value,
                  })
                )
              }
              minLength={8}
              className="w-full rounded-2xl px-4 py-3.5 outline-none"
              placeholder="Mínimo 8 caracteres"
              required
            />

            <button
              type="button"
              onClick={() =>
                setMostrarPassword(
                  (actual) =>
                    !actual
                )
              }
              className="p-2 text-slate-500"
            >
              {mostrarPassword ? (
                <EyeOff
                  size={19}
                />
              ) : (
                <Eye
                  size={19}
                />
              )}
            </button>
          </div>
        </label>
      )}

      <button
        type="submit"
        disabled={
          procesando
        }
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
      >
        {procesando ? (
          <LoaderCircle
            size={19}
            className="animate-spin"
          />
        ) : (
          <UserCog
            size={19}
          />
        )}

        {procesando
          ? "Procesando..."
          : textoBoton}
      </button>
    </form>
  );
}