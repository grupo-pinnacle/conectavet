import { renderHook, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

describe("useOnlineStatus Hook", () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

  it("devuelve true por defecto cuando navigator.onLine es true", () => {
    Object.defineProperty(window, "navigator", {
      configurable: true,
      value: { ...originalNavigator, onLine: true },
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("devuelve false en la inicialización si navigator.onLine es false", () => {
    Object.defineProperty(window, "navigator", {
      configurable: true,
      value: { ...originalNavigator, onLine: false },
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("devuelve true como fallback cuando navigator.onLine no es de tipo boolean", () => {
    Object.defineProperty(window, "navigator", {
      configurable: true,
      value: { ...originalNavigator, onLine: undefined },
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("actualiza el estado a false al disparar el evento 'offline'", () => {
    Object.defineProperty(window, "navigator", {
      configurable: true,
      value: { ...originalNavigator, onLine: true },
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      fireEvent(window, new Event("offline"));
    });

    expect(result.current).toBe(false);
  });

  it("actualiza el estado a true al disparar el evento 'online'", () => {
    Object.defineProperty(window, "navigator", {
      configurable: true,
      value: { ...originalNavigator, onLine: false },
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      fireEvent(window, new Event("online"));
    });

    expect(result.current).toBe(true);
  });

  it("remueve los event listeners al desmontar el hook", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });
});
