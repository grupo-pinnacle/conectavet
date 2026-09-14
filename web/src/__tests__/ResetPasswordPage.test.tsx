import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import api from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockedApiPost = vi.mocked(api.post);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ResetPasswordPage — Restablecimiento de Contraseña", () => {
  it("muestra advertencia si no hay token en la URL y el botón está deshabilitado", () => {
    render(
      <MemoryRouter initialEntries={["/reset-password"]}>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText("Enlace de restablecimiento inválido. Por favor solicitá uno nuevo.")
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Restablecer Contraseña/i });
    expect(submitBtn).toBeDisabled();
  });

  it("muestra error si la contraseña tiene menos de 8 caracteres", async () => {
    render(
      <MemoryRouter initialEntries={["/reset-password?token=valid-token-123"]}>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText("Nueva Contraseña");
    const confirmInput = screen.getByLabelText("Confirmar Nueva Contraseña");
    const submitBtn = screen.getByRole("button", { name: /Restablecer Contraseña/i });

    fireEvent.change(passwordInput, { target: { value: "short" } });
    fireEvent.change(confirmInput, { target: { value: "short" } });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText("La contraseña debe tener al menos 8 caracteres.")
    ).toBeInTheDocument();
    expect(mockedApiPost).not.toHaveBeenCalled();
  });

  it("muestra error si las contraseñas no coinciden", async () => {
    render(
      <MemoryRouter initialEntries={["/reset-password?token=valid-token-123"]}>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText("Nueva Contraseña");
    const confirmInput = screen.getByLabelText("Confirmar Nueva Contraseña");
    const submitBtn = screen.getByRole("button", { name: /Restablecer Contraseña/i });

    fireEvent.change(passwordInput, { target: { value: "Password123!" } });
    fireEvent.change(confirmInput, { target: { value: "Password999!" } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(mockedApiPost).not.toHaveBeenCalled();
  });

  it("error path: muestra el mensaje de error personalizado devuelto por la API cuando la petición falla", async () => {
    const customErrorMsg = "El token de restablecimiento ha expirado o ya fue utilizado.";
    mockedApiPost.mockRejectedValueOnce({
      response: {
        data: {
          message: customErrorMsg,
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/reset-password?token=expired-token"]}>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText("Nueva Contraseña");
    const confirmInput = screen.getByLabelText("Confirmar Nueva Contraseña");
    const submitBtn = screen.getByRole("button", { name: /Restablecer Contraseña/i });

    fireEvent.change(passwordInput, { target: { value: "NewSecurePassword123!" } });
    fireEvent.change(confirmInput, { target: { value: "NewSecurePassword123!" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith("/api/auth/reset-password", {
        token: "expired-token",
        password: "NewSecurePassword123!",
      });
    });

    expect(await screen.findByText(customErrorMsg)).toBeInTheDocument();
  });

  it("error path: muestra mensaje genérico de fallback cuando la API falla sin un mensaje en la respuesta", async () => {
    mockedApiPost.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter initialEntries={["/reset-password?token=any-token"]}>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText("Nueva Contraseña");
    const confirmInput = screen.getByLabelText("Confirmar Nueva Contraseña");
    const submitBtn = screen.getByRole("button", { name: /Restablecer Contraseña/i });

    fireEvent.change(passwordInput, { target: { value: "NewSecurePassword123!" } });
    fireEvent.change(confirmInput, { target: { value: "NewSecurePassword123!" } });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(
        "Error al restablecer la contraseña. El enlace puede haber expirado."
      )
    ).toBeInTheDocument();
  });

  it("caso feliz: actualiza la contraseña exitosamente y muestra mensaje de éxito", async () => {
    mockedApiPost.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter initialEntries={["/reset-password?token=valid-token"]}>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText("Nueva Contraseña");
    const confirmInput = screen.getByLabelText("Confirmar Nueva Contraseña");
    const submitBtn = screen.getByRole("button", { name: /Restablecer Contraseña/i });

    fireEvent.change(passwordInput, { target: { value: "NewSecurePassword123!" } });
    fireEvent.change(confirmInput, { target: { value: "NewSecurePassword123!" } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText("¡Contraseña actualizada!")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tu contraseña fue cambiada con éxito. Serás redirigido al inicio de sesión en unos segundos..."
      )
    ).toBeInTheDocument();
  });
});
