import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import api, { setApiToken } from "../services/api";

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    default: {
      ...actual.default,
      create: actual.default.create,
      post: vi.fn(),
    },
  };
});

describe("api service and interceptors", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    setApiToken(null);

    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        pathname: "/dashboard",
        href: "http://localhost/dashboard",
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  describe("setApiToken and request interceptor", () => {
    it("should attach Authorization header when accessToken is set", async () => {
      setApiToken("test-access-token");

      const requestInterceptor = (api.interceptors.request as any).handlers[0]?.fulfilled;
      expect(requestInterceptor).toBeDefined();

      const dummyConfig = {
        headers: new axios.AxiosHeaders(),
      };

      const modifiedConfig = await requestInterceptor(dummyConfig);
      expect(modifiedConfig.headers.get("Authorization")).toBe("Bearer test-access-token");
    });

    it("should not attach Authorization header when accessToken is null", async () => {
      setApiToken(null);

      const requestInterceptor = (api.interceptors.request as any).handlers[0]?.fulfilled;
      const dummyConfig = {
        headers: new axios.AxiosHeaders(),
      };

      const modifiedConfig = await requestInterceptor(dummyConfig);
      expect(modifiedConfig.headers.get("Authorization")).toBeUndefined();
    });
  });

  describe("response interceptor - basic pass-through and non-refresh cases", () => {
    it("should return response directly when request is successful", async () => {
      const responseInterceptor = (api.interceptors.response as any).handlers[0]?.fulfilled;
      const mockResponse = { status: 200, data: { success: true } };

      const res = await responseInterceptor(mockResponse);
      expect(res).toBe(mockResponse);
    });

    it("should reject error directly if status is not 401", async () => {
      const errorInterceptor = (api.interceptors.response as any).handlers[0]?.rejected;
      const mockError = {
        response: { status: 500 },
        config: { url: "/api/test", headers: new axios.AxiosHeaders() },
      };

      await expect(errorInterceptor(mockError)).rejects.toBe(mockError);
    });

    it("should reject error directly if 401 occurs on /auth/ endpoint", async () => {
      const errorInterceptor = (api.interceptors.response as any).handlers[0]?.rejected;
      const mockError = {
        response: { status: 401 },
        config: { url: "/api/auth/login", headers: new axios.AxiosHeaders() },
      };

      await expect(errorInterceptor(mockError)).rejects.toBe(mockError);
    });

    it("should reject error directly if original request was already retried (_retry: true)", async () => {
      const errorInterceptor = (api.interceptors.response as any).handlers[0]?.rejected;
      const mockError = {
        response: { status: 401 },
        config: { url: "/api/data", _retry: true, headers: new axios.AxiosHeaders() },
      };

      await expect(errorInterceptor(mockError)).rejects.toBe(mockError);
    });
  });

  describe("response interceptor - token refresh flow", () => {
    it("should refresh token on 401 and retry original request", async () => {
      setApiToken("old-token");

      const mockedPost = vi.mocked(axios.post);
      mockedPost.mockResolvedValueOnce({
        data: {
          data: {
            accessToken: "new-access-token",
          },
        },
      });

      const mockAdapter = vi.fn().mockImplementation(async (config) => ({
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        data: { secret: "data" },
      }));
      api.defaults.adapter = mockAdapter;

      const errorInterceptor = (api.interceptors.response as any).handlers[0]?.rejected;

      const originalConfig = {
        url: "/api/protected-data",
        headers: new axios.AxiosHeaders(),
        _retry: undefined as boolean | undefined,
      };

      const mockError = {
        response: { status: 401 },
        config: originalConfig,
      };

      const result = await errorInterceptor(mockError);

      expect(mockedPost).toHaveBeenCalledTimes(1);
      expect(mockedPost).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/refresh"),
        {},
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      expect(originalConfig._retry).toBe(true);
      expect(originalConfig.headers.get("Authorization")).toBe("Bearer new-access-token");
      expect(mockAdapter).toHaveBeenCalledWith(expect.objectContaining({ url: "/api/protected-data" }));
      expect(result.data).toEqual({ secret: "data" });
    });

    it("should queue concurrent 401 requests while refresh is in progress and resolve them after refresh succeeds", async () => {
      setApiToken("old-token");

      let resolveRefresh: (val: any) => void = () => {};
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve;
      });

      const mockedPost = vi.mocked(axios.post);
      mockedPost.mockReturnValueOnce(refreshPromise as any);

      const mockAdapter = vi.fn().mockImplementation(async (config) => ({
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        data: `data-for-${config.url}`,
      }));
      api.defaults.adapter = mockAdapter;

      const errorInterceptor = (api.interceptors.response as any).handlers[0]?.rejected;

      const config1 = { url: "/api/res1", headers: new axios.AxiosHeaders() };
      const config2 = { url: "/api/res2", headers: new axios.AxiosHeaders() };

      // First request triggers refresh
      const promise1 = errorInterceptor({ response: { status: 401 }, config: config1 });
      // Second request comes in while refreshing and gets queued
      const promise2 = errorInterceptor({ response: { status: 401 }, config: config2 });

      // Resolve the refresh call
      resolveRefresh({
        data: {
          data: {
            accessToken: "shared-new-token",
          },
        },
      });

      const [res1, res2] = await Promise.all([promise1, promise2]);

      expect(mockedPost).toHaveBeenCalledTimes(1);
      expect(config1.headers.get("Authorization")).toBe("Bearer shared-new-token");
      expect(config2.headers.get("Authorization")).toBe("Bearer shared-new-token");
      expect(res1.data).toBe("data-for-/api/res1");
      expect(res2.data).toBe("data-for-/api/res2");
    });

    it("should handle refresh failure, reject queued requests, and redirect to /login when token existed", async () => {
      setApiToken("existing-token");

      const mockedPost = vi.mocked(axios.post);
      mockedPost.mockRejectedValueOnce(new Error("Refresh failed"));

      const errorInterceptor = (api.interceptors.response as any).handlers[0]?.rejected;

      const config1 = { url: "/api/res1", headers: new axios.AxiosHeaders() };

      const mockError = { response: { status: 401 }, config: config1 };

      await expect(errorInterceptor(mockError)).rejects.toBe(mockError);

      expect(window.location.href).toBe("/login");
    });

    it("should handle refresh failure without redirecting if user was already on /login path", async () => {
      setApiToken("existing-token");
      Object.defineProperty(window, "location", {
        value: {
          ...originalLocation,
          pathname: "/login",
          href: "http://localhost/login",
        },
        writable: true,
        configurable: true,
      });

      const mockedPost = vi.mocked(axios.post);
      mockedPost.mockRejectedValueOnce(new Error("Refresh failed"));

      const errorInterceptor = (api.interceptors.response as any).handlers[0]?.rejected;

      const mockError = {
        response: { status: 401 },
        config: { url: "/api/res1", headers: new axios.AxiosHeaders() },
      };

      await expect(errorInterceptor(mockError)).rejects.toBe(mockError);

      expect(window.location.href).toBe("http://localhost/login");
    });

    it("should handle refresh failure without redirecting if user never had a token", async () => {
      setApiToken(null);

      const mockedPost = vi.mocked(axios.post);
      mockedPost.mockRejectedValueOnce(new Error("Refresh failed"));

      const errorInterceptor = (api.interceptors.response as any).handlers[0]?.rejected;

      const mockError = {
        response: { status: 401 },
        config: { url: "/api/res1", headers: new axios.AxiosHeaders() },
      };

      await expect(errorInterceptor(mockError)).rejects.toBe(mockError);

      expect(window.location.href).toBe("http://localhost/dashboard");
    });
  });
});
