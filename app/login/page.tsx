"use client";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";

import {
  FormEvent,
  useState,
} from "react";



type LoginResponse = {
  success: boolean;
  message: string;

  data?: {
    redirectTo: string;

    usuario: {
      nombres: string;
      apellidos: string;
      rol: string;
    };
  };
};

export default function LoginPage() {


  const [
    identificador,
    setIdentificador,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function iniciarSesion(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    try {
      setCargando(true);
      setError("");

      const respuesta =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              identificador,
              password,
            }),
          }
        );

     const texto = await respuesta.text();

console.log("STATUS LOGIN:", respuesta.status);
console.log("CONTENT-TYPE:", respuesta.headers.get("content-type"));
console.log("RESPUESTA LOGIN:", texto);

let resultado: LoginResponse;

try {
  resultado = JSON.parse(texto) as LoginResponse;
} catch {
  throw new Error(
    `La API de login no devolvió JSON. Estado HTTP: ${respuesta.status}`
  );
}

      if (
        !respuesta.ok ||
        !resultado.success ||
        !resultado.data
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo iniciar sesión."
        );
      }

     window.location.href =
  resultado.data.redirectTo;
    } catch (
      errorDesconocido
    ) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo iniciar sesión."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="login-root">
      <div className="login-layout">
        {/* =====================================================
            PANEL IZQUIERDO
        ====================================================== */}
        <section className="side-panel left-panel">
          <img
            src="/img/chinka-gastronomia.png"
            alt="Gastronomía Restaurante Chinka Chinka"
            className="side-image"
          />

          <div className="left-overlay" />

          <div className="left-copy">
            <p className="left-title">
              Donde te pierdes
            </p>

            <p className="left-title left-title-accent">
              con el buen sabor
            </p>

            <div className="brand-dots">
              <span className="dot green" />
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot red" />
              <span className="dot green" />
            </div>

            <div className="location-pill">
              📍 La Encañada · Panam. Sur Km 146.5
            </div>
          </div>

          <div className="tricolor tricolor-right" />
        </section>

        {/* =====================================================
            PANEL CENTRAL
        ====================================================== */}
        <section className="center-panel">
          <div className="center-pattern">
            <span className="pattern-item pattern-1">
              🌶️
            </span>

            <span className="pattern-item pattern-2">
              🍃
            </span>

            <span className="pattern-item pattern-3">
              🥘
            </span>

            <span className="pattern-item pattern-4">
              🍽️
            </span>
          </div>

          <div className="center-content">
            <div className="brand-block">
              <img
                src="/img/logo-chinka.png"
                alt="Logo Restaurante Chinka Chinka"
                className="brand-logo"
              />

              <p className="brand-eyebrow">
                Restaurante
              </p>

              <h1 className="brand-name">
                Chinka Chinka
              </h1>

              <p className="brand-tagline">
                Donde te pierdes con el buen sabor
              </p>

              <div className="brand-line" />
            </div>

            <div className="login-card">
              <div className="login-heading">
                <h2>
                  Iniciar sesión
                </h2>

                <p>
                  Ingresa tus credenciales para acceder al sistema.
                </p>
              </div>

              <form
                onSubmit={iniciarSesion}
                className="login-form"
              >
                <label className="field-group">
                  <span className="field-label">
                    Correo electrónico
                  </span>

                  <div className="field-shell">
                    <UserRound
                      size={18}
                      className="field-icon"
                    />

                    <input
                      type="email"
                      autoComplete="username"
                      value={identificador}
                      onChange={(evento) =>
                        setIdentificador(
                          evento.target.value
                        )
                      }
                      placeholder="usuario@chinkachinka.pe"
                      required
                    />
                  </div>
                </label>

                <label className="field-group">
                  <span className="field-label">
                    Contraseña
                  </span>

                  <div className="field-shell">
                    <LockKeyhole
                      size={18}
                      className="field-icon"
                    />

                    <input
                      type={
                        mostrarPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={password}
                      onChange={(evento) =>
                        setPassword(
                          evento.target.value
                        )
                      }
                      placeholder="Ingresa tu contraseña"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarPassword(
                          (actual) => !actual
                        )
                      }
                      className="eye-button"
                      aria-label={
                        mostrarPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {mostrarPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </label>

                {error && (
                  <div className="error-box">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={cargando}
                  className="login-button"
                >
                  <UtensilsCrossed
                    size={19}
                  />

                  {cargando
                    ? "INGRESANDO..."
                    : "INICIAR SESIÓN"}
                </button>
              </form>

              <div className="divider">
                <span />
                <UtensilsCrossed size={15} />
                <span />
              </div>

              <div className="role-grid">
                {[
                  [
                    "MOZO",
                    "Mesas y pedidos",
                    "🧑‍🍳",
                  ],
                  [
                    "COCINA",
                    "Preparación",
                    "🍳",
                  ],
                  [
                    "CAJERO",
                    "Cobros",
                    "💳",
                  ],
                  [
                    "ADMIN",
                    "Gestión",
                    "📊",
                  ],
                ].map(
                  ([
                    titulo,
                    descripcion,
                    icono,
                  ]) => (
                    <div
                      key={titulo}
                      className="role-card"
                    >
                      <div className="role-icon">
                        {icono}
                      </div>

                      <p className="role-title">
                        {titulo}
                      </p>

                      <p className="role-description">
                        {descripcion}
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="access-box">
                <ShieldCheck
                  size={24}
                  className="access-icon"
                />

                <div>
                  <p className="access-title">
                    Acceso exclusivo
                  </p>

                  <p className="access-text">
                    Sistema de uso interno para personal autorizado.
                  </p>
                </div>
              </div>
            </div>

            <div className="signature">
              <p>
                Sistema de Gestión · Restaurante Chinka Chinka
              </p>

              <p className="signature-author">
                Desarrollado por{" "}
                <strong>
                  Marlon Barrientos Farfán
                </strong>{" "}
                · Ingeniero de Sistemas
              </p>
            </div>
          </div>

          <div className="tricolor tricolor-left" />
          <div className="tricolor tricolor-center-right" />
        </section>

        {/* =====================================================
            PANEL DERECHO
        ====================================================== */}
        <section className="side-panel right-panel">
          <img
            src="/img/chinka-cultura.png"
            alt="Cultura peruana Restaurante Chinka Chinka"
            className="side-image"
          />

          <div className="right-overlay" />

          <div className="culture-copy">
            <p>
              Nuestra cultura,
            </p>

            <p className="culture-accent">
              nuestro sabor
            </p>

            <div className="culture-line">
              <span />
              <i className="red-dot" />
              <i className="yellow-dot" />
              <i className="green-dot" />
              <span />
            </div>
          </div>

          <div className="tricolor tricolor-left-edge" />
        </section>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #160d08;
        }

        .login-root {
          width: 100%;
          height: 100dvh;
          overflow: hidden;
          background: #160d08;
        }

        .login-layout {
          display: grid;
          grid-template-columns: 31% 38% 31%;
          width: 100%;
          height: 100dvh;
          overflow: hidden;
        }

        .side-panel,
        .center-panel {
          position: relative;
          height: 100dvh;
          overflow: hidden;
        }

        .side-panel {
          display: block;
          background: #1a100a;
        }

        .side-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .left-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              to top,
              rgba(0, 0, 0, 0.90),
              rgba(0, 0, 0, 0.14) 54%,
              rgba(0, 0, 0, 0.10)
            );
        }

        .right-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.45),
              rgba(0, 0, 0, 0.02) 48%,
              rgba(0, 0, 0, 0.70)
            );
        }

        .left-copy {
          position: absolute;
          z-index: 5;
          left: clamp(28px, 3vw, 58px);
          right: 28px;
          bottom: clamp(24px, 4.5vh, 56px);
          color: white;
        }

        .left-title {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(32px, 3.15vw, 58px);
          line-height: 1.05;
          font-weight: 900;
          font-style: italic;
          text-shadow:
            0 6px 22px rgba(0,0,0,0.5);
        }

        .left-title-accent {
          margin-top: 4px;
          color: #f2b21d;
        }

        .brand-dots {
          display: flex;
          gap: 7px;
          margin-top: 18px;
        }

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
        }

        .green {
          background: #218637;
        }

        .red {
          background: #c72424;
        }

        .yellow {
          background: #f0b31c;
        }

        .location-pill {
          display: inline-flex;
          margin-top: 18px;
          padding: 9px 14px;
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 999px;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(8px);
          font-size: 12px;
          font-weight: 800;
        }

        .center-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(8px, 1.2vh, 16px)
                   clamp(18px, 2.2vw, 36px);
          background: #fbf1dc;
        }

        .center-pattern {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.03;
        }

        .pattern-item {
          position: absolute;
          font-size: 62px;
        }

        .pattern-1 {
          left: 7%;
          top: 6%;
        }

        .pattern-2 {
          right: 7%;
          top: 8%;
        }

        .pattern-3 {
          left: 8%;
          bottom: 7%;
        }

        .pattern-4 {
          right: 7%;
          bottom: 6%;
        }

        .center-content {
          position: relative;
          z-index: 3;
          width: min(100%, 590px);
          max-height: calc(100dvh - 12px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          transform: translateY(1.5vh);
        }

        .brand-block {
          text-align: center;
          flex-shrink: 0;
        }

        .brand-logo {
          display: block;
          width: 132px;
          height: 132px;
          margin: 0 auto;
          border-radius: 24px;
          object-fit: contain;
        }

        .brand-eyebrow {
          margin: 7px 0 0;
          color: #65432d;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.34em;
          text-transform: uppercase;
        }

        .brand-name {
          margin: 2px 0 0;
          color: #2c1a10;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 33px;
          line-height: 1;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.035em;
        }

        .brand-tagline {
          margin: 5px 0 0;
          color: #bb2b24;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 14px;
          line-height: 1.15;
          font-weight: 700;
          font-style: italic;
        }

        .brand-line {
          width: 76px;
          height: 3px;
          margin: 9px auto 0;
          border-radius: 99px;
          background:
            linear-gradient(
              to right,
              #278b3a,
              #e3b120,
              #c52626
            );
        }

        .login-card {
          width: 100%;
          margin-top: 13px;
          padding: 18px 20px 16px;
          border: 1px solid #dfcba6;
          border-radius: 24px;
          background: rgba(255,255,255,0.84);
          box-shadow:
            0 18px 50px rgba(66,35,15,0.16);
          backdrop-filter: blur(10px);
        }

        .login-heading h2 {
          margin: 0;
          color: #2c1a10;
          font-size: 21px;
          line-height: 1.1;
          font-weight: 900;
        }

        .login-heading p {
          margin: 4px 0 0;
          color: #7a6253;
          font-size: 11px;
          line-height: 1.3;
        }

        .login-form {
          display: grid;
          gap: 11px;
          margin-top: 13px;
        }

        .field-group {
          display: block;
        }

        .field-label {
          display: block;
          margin-bottom: 5px;
          color: #4c3527;
          font-size: 11px;
          font-weight: 900;
        }

        .field-shell {
          display: flex;
          align-items: center;
          min-height: 42px;
          padding: 0 12px;
          border: 1px solid #dac8aa;
          border-radius: 13px;
          background: white;
          transition: 0.2s ease;
        }

        .field-shell:focus-within {
          border-color: #b92a24;
          box-shadow:
            0 0 0 3px rgba(185,42,36,0.10);
        }

        .field-icon {
          flex-shrink: 0;
          color: #7d6657;
        }

        .field-shell input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          padding: 10px;
          color: #2c1a10;
          font-size: 12px;
        }

        .eye-button {
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 8px;
          background: transparent;
          padding: 4px;
          color: #6b584b;
          cursor: pointer;
        }

        .eye-button:hover {
          background: #f4ead7;
        }

        .error-box {
          padding: 8px 10px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 11px;
          font-weight: 800;
        }

        .login-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          min-height: 43px;
          border: 0;
          border-radius: 13px;
          background:
            linear-gradient(
              to right,
              #b9151b,
              #d42626
            );
          color: white;
          font-size: 13px;
          font-weight: 900;
          box-shadow:
            0 8px 18px rgba(185,21,27,0.18);
          cursor: pointer;
        }

        .login-button:hover {
          filter: brightness(1.08);
        }

        .login-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 11px 0 10px;
          color: #9d7c5c;
        }

        .divider span {
          flex: 1;
          height: 1px;
          background: #ddc9a5;
        }

        .role-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 7px;
        }

        .role-card {
          padding: 8px 4px 7px;
          border: 1px solid #e4d3b5;
          border-radius: 12px;
          background: #fff9ec;
          text-align: center;
        }

        .role-icon {
          font-size: 17px;
          line-height: 1;
        }

        .role-title {
          margin: 5px 0 0;
          color: #2f2118;
          font-size: 9px;
          font-weight: 900;
        }

        .role-description {
          margin: 3px 0 0;
          color: #78675b;
          font-size: 7px;
          line-height: 1.05;
        }

        .access-box {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          padding: 9px 12px;
          border-radius: 12px;
          background:
            linear-gradient(
              to right,
              #2d1b10,
              #3b2415
            );
          color: white;
          box-shadow:
            0 8px 20px rgba(45,27,16,0.14);
        }

        .access-icon {
          flex-shrink: 0;
          color: #f0b323;
        }

        .access-title {
          margin: 0;
          color: #f0b323;
          font-size: 10px;
          font-weight: 900;
        }

        .access-text {
          margin: 2px 0 0;
          color: rgba(255,255,255,0.8);
          font-size: 7px;
          line-height: 1.15;
        }

        .signature {
          margin-top: 10px;
          text-align: center;
          color: #776252;
          font-size: 8px;
          font-weight: 700;
          line-height: 1.25;
        }

        .signature p {
          margin: 0;
        }

        .signature-author {
          margin-top: 3px !important;
          color: #91725f;
          font-size: 7px;
          letter-spacing: 0.01em;
        }

        .signature-author strong {
          color: #6b432c;
        }

        .culture-copy {
          position: absolute;
          z-index: 5;
          top: clamp(24px, 4vh, 54px);
          left: 24px;
          right: 24px;
          text-align: center;
          color: white;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(28px, 3vw, 52px);
          line-height: 1.02;
          font-weight: 700;
          font-style: italic;
          text-shadow:
            0 5px 20px rgba(0,0,0,0.45);
        }

        .culture-copy p {
          margin: 0;
        }

        .culture-accent {
          margin-top: 4px !important;
          color: #f3b11d;
          font-weight: 900;
        }

        .culture-line {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin: 15px auto 0;
        }

        .culture-line span {
          width: 36px;
          height: 2px;
          background: #c72525;
        }

        .culture-line i {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .red-dot {
          background: #c72525;
        }

        .yellow-dot {
          background: #f0b31d;
        }

        .green-dot {
          background: #218637;
        }

        .tricolor {
          position: absolute;
          top: 0;
          z-index: 20;
          width: 16px;
          height: 100%;
          background:
            linear-gradient(
              to right,
              #278b3a 0 34%,
              #e3b120 34% 67%,
              #c52626 67% 100%
            );
        }

        .tricolor-right {
          right: 0;
        }

        .tricolor-left,
        .tricolor-left-edge {
          left: 0;
        }

        .tricolor-center-right {
          right: 0;
        }

        /* ==================================================
           TABLET / CELULAR
        =================================================== */
        @media (max-width: 1023px) {
          html,
          body {
            overflow: auto;
          }

          .login-root {
            min-height: 100dvh;
            height: auto;
            overflow: auto;
          }

          .login-layout {
            display: block;
            min-height: 100dvh;
            height: auto;
          }

          .side-panel {
            display: none;
          }

          .center-panel {
            min-height: 100dvh;
            height: auto;
            padding: 24px 18px;
            overflow: visible;
          }

          .center-content {
            width: min(100%, 560px);
            max-height: none;
            transform: none;
          }

          .brand-logo {
            width: 150px;
            height: 150px;
          }
        }

        /* ==================================================
           LAPTOP 1366 x 768 / 100% ZOOM
           La clave está aquí:
           más grande que la versión anterior,
           pero todavía entra completa.
        =================================================== */
        @media (
          min-width: 1024px
        ) and (
          max-height: 800px
        ) {
          .login-layout {
            grid-template-columns:
              31% 38% 31%;
          }

          .center-panel {
            padding:
              4px 18px
              5px;
          }

          .center-content {
            width: min(100%, 535px);
            max-height:
              calc(100dvh - 6px);
            transform:
              translateY(8px);
          }

          .brand-logo {
            width: 112px;
            height: 112px;
            border-radius: 19px;
          }

          .brand-eyebrow {
            margin-top: 4px;
            font-size: 7px;
          }

          .brand-name {
            margin-top: 1px;
            font-size: 27px;
          }

          .brand-tagline {
            margin-top: 3px;
            font-size: 11px;
          }

          .brand-line {
            width: 58px;
            height: 2px;
            margin-top: 6px;
          }

          .login-card {
            margin-top: 9px;
            padding:
              13px 15px
              12px;
            border-radius: 19px;
          }

          .login-heading h2 {
            font-size: 17px;
          }

          .login-heading p {
            margin-top: 2px;
            font-size: 8px;
          }

          .login-form {
            gap: 7px;
            margin-top: 8px;
          }

          .field-label {
            margin-bottom: 3px;
            font-size: 8px;
          }

          .field-shell {
            min-height: 35px;
            padding: 0 9px;
            border-radius: 10px;
          }

          .field-shell input {
            padding:
              7px 8px;
            font-size: 9px;
          }

          .login-button {
            min-height: 35px;
            border-radius: 10px;
            font-size: 10px;
          }

          .divider {
            margin:
              7px 0
              6px;
          }

          .role-grid {
            gap: 5px;
          }

          .role-card {
            padding:
              6px 2px
              5px;
            border-radius: 9px;
          }

          .role-icon {
            font-size: 14px;
          }

          .role-title {
            margin-top: 3px;
            font-size: 7px;
          }

          .role-description {
            font-size: 5px;
          }

          .access-box {
            gap: 7px;
            margin-top: 7px;
            padding:
              6px 9px;
            border-radius: 9px;
          }

          .access-title {
            font-size: 8px;
          }

          .access-text {
            font-size: 5px;
          }

          .signature {
            margin-top: 7px;
            font-size: 6px;
          }

          .signature-author {
            margin-top:
              2px !important;
            font-size: 5.5px;
          }

          .left-title {
            font-size:
              clamp(
                30px,
                3vw,
                44px
              );
          }

          .location-pill {
            margin-top: 12px;
            padding:
              7px 11px;
            font-size: 9px;
          }

          .culture-copy {
            top: 24px;
            font-size:
              clamp(
                26px,
                2.7vw,
                39px
              );
          }
        }

        /* ==================================================
           PANTALLAS MUY BAJAS
        =================================================== */
        @media (
          min-width: 1024px
        ) and (
          max-height: 680px
        ) {
          .center-content {
            transform:
              translateY(4px);
          }

          .brand-logo {
            width: 92px;
            height: 92px;
          }

          .brand-name {
            font-size: 23px;
          }

          .brand-tagline {
            font-size: 9px;
          }

          .login-card {
            margin-top: 7px;
            padding:
              10px 12px
              9px;
          }

          .login-heading h2 {
            font-size: 15px;
          }

          .login-form {
            gap: 5px;
            margin-top: 6px;
          }

          .field-shell {
            min-height: 31px;
          }

          .login-button {
            min-height: 31px;
          }

          .role-card {
            padding:
              4px 1px;
          }

          .access-box {
            margin-top: 5px;
            padding:
              5px 8px;
          }

          .signature {
            margin-top: 4px;
          }
        }

        /* ==================================================
           FULL HD Y MONITORES GRANDES
        =================================================== */
        @media (
          min-width: 1600px
        ) and (
          min-height: 900px
        ) {
          .center-content {
            width: min(100%, 620px);
            transform:
              translateY(1vh);
          }

          .brand-logo {
            width: 176px;
            height: 176px;
          }

          .brand-eyebrow {
            font-size: 11px;
          }

          .brand-name {
            font-size: 40px;
          }

          .brand-tagline {
            font-size: 17px;
          }

          .login-card {
            margin-top: 16px;
            padding:
              22px 24px
              20px;
          }

          .login-heading h2 {
            font-size: 24px;
          }

          .login-heading p {
            font-size: 13px;
          }

          .field-shell {
            min-height: 48px;
          }

          .field-shell input {
            font-size: 14px;
          }

          .login-button {
            min-height: 48px;
            font-size: 15px;
          }

          .role-card {
            padding:
              11px 6px
              10px;
          }

          .role-icon {
            font-size: 22px;
          }

          .role-title {
            font-size: 11px;
          }

          .role-description {
            font-size: 9px;
          }

          .access-title {
            font-size: 12px;
          }

          .access-text {
            font-size: 9px;
          }

          .signature {
            font-size: 9px;
          }

          .signature-author {
            font-size: 8px;
          }
        }
      `}</style>
    </main>
  );
}