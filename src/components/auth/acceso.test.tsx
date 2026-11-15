import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/errores";
import { errorDeAcceso } from "../../routes/Acceso";
import { FormularioAcceso } from "./FormularioAcceso";
import { HuellasPqc } from "./HuellasPqc";
import { SesionIniciada } from "./SesionIniciada";

const montar = (ui: JSX.Element) => render(<MemoryRouter>{ui}</MemoryRouter>);
const almacenado = () => JSON.stringify([{ ...localStorage }, { ...sessionStorage }]);

describe("formulario de Acceso", () => {
  it("usa autocomplete de usuario y contraseña actual, con etiquetas reales", () => {
    montar(<FormularioAcceso entrar={vi.fn()} entrando={false} error={null} />);
    expect(screen.getByLabelText("Correo")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password");
  });
  it("mostrar la contraseña es un botón con aria-pressed, y al enviar vuelve a ocultarse", async () => {
    const entrar = vi.fn(() => Promise.reject(new ApiError(401, "")));
    montar(<FormularioAcceso entrar={entrar} entrando={false} error={null} />);
    const ojo = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(ojo).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(ojo);
    expect(ojo).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "text");
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: " persona@ejemplo.test " } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "una-clave-de-prueba" } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(entrar).toHaveBeenCalledWith({ email: "persona@ejemplo.test", password: "una-clave-de-prueba" });
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password");
    // Tras el fallo: contraseña vacía y foco en ella para reintentar
    await waitFor(() => expect(screen.getByLabelText("Contraseña")).toHaveFocus());
    expect(screen.getByLabelText("Contraseña")).toHaveValue("");
  });
  it("avisa de Bloq Mayús mientras se escribe la contraseña y no guarda nada", () => {
    const antes = almacenado();
    montar(<FormularioAcceso entrar={vi.fn()} entrando={false} error={null} />);
    const campo = screen.getByLabelText("Contraseña");
    expect(screen.queryByText("Bloq Mayús está activado.")).not.toBeInTheDocument();
    fireEvent.keyDown(campo, { key: "A", modifierCapsLock: true });
    expect(screen.getByText("Bloq Mayús está activado.")).toBeInTheDocument();
    expect(campo.getAttribute("aria-describedby")).toContain(screen.getByText("Bloq Mayús está activado.").id);
    fireEvent.blur(campo);
    expect(screen.queryByText("Bloq Mayús está activado.")).not.toBeInTheDocument();
    expect(almacenado()).toBe(antes);
  });
  it("con campos vacíos lleva el foco al primero que falta", () => {
    const entrar = vi.fn();
    montar(<FormularioAcceso entrar={entrar} entrando={false} error={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(screen.getByLabelText("Correo")).toHaveFocus();
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "persona@ejemplo.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(screen.getByLabelText("Contraseña")).toHaveFocus();
    expect(entrar).not.toHaveBeenCalled();
  });
  it("mientras envía, el botón sigue enfocable, dice «Entrando…» y no reenvía", () => {
    const entrar = vi.fn();
    montar(<FormularioAcceso entrar={entrar} entrando error={null} />);
    const boton = screen.getByRole("button", { name: "Entrando…" });
    expect(boton).toHaveAttribute("aria-disabled", "true");
    expect(boton).not.toBeDisabled();
    fireEvent.click(boton);
    expect(entrar).not.toHaveBeenCalled();
  });
  it("un 429 dice cuánto esperar y un 401 no revela si el correo existe", () => {
    const limite = new ApiError(429, "");
    Object.assign(limite, { esperaS: 900 });
    expect(errorDeAcceso(limite, "es").sugerencia).toMatch(/15 min/);
    Object.assign(limite, { esperaS: 30 });
    expect(errorDeAcceso(limite, "es").sugerencia).toMatch(/30 s/);
    montar(<FormularioAcceso entrar={vi.fn()} entrando={false} error={errorDeAcceso(new ApiError(401, ""), "es")} />);
    expect(screen.getByRole("alert")).toHaveTextContent("El correo o la contraseña no son correctos.");
  });
});

describe("sesión iniciada", () => {
  const usuario = { id: "u-1", nombre: "Persona de Prueba", rol: "admin" as const, huellas: [{ algoritmo: "ML-KEM-1024", huella: "0123456789abcdef0123456789abcdef" }] };
  it("muestra el rol y la huella abreviada (la completa, en el título); al entrar, el foco va al nombre", () => {
    montar(<SesionIniciada usuario={usuario} recien rebotado={false} salir={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Persona de Prueba" })).toHaveFocus();
    expect(screen.getByText("Administración")).toBeInTheDocument();
    expect(screen.getByText("0123456789ab…")).toHaveAttribute("title", usuario.huellas[0].huella);
    expect(screen.getByRole("link", { name: "Gestor de claves" })).toBeInTheDocument();
  });
  it("sin claves emitidas lo dice en vez de dejar un hueco", () => {
    montar(<SesionIniciada usuario={{ ...usuario, rol: "revisor", huellas: [] }} recien={false} rebotado={false} salir={vi.fn()} />);
    expect(screen.getByText("Tu cuenta aún no tiene claves post-cuánticas emitidas.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Gestor de claves" })).not.toBeInTheDocument();
  });
  it("las huellas son una lista de chips", () => {
    render(<HuellasPqc huellas={[{ algoritmo: "ML-DSA-65", huella: "bb22" }]} />);
    expect(screen.getByRole("listitem")).toHaveTextContent("ML-DSA-65");
    expect(screen.getByText("bb22")).toBeInTheDocument();
  });
});
