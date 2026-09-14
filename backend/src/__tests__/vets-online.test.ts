import { setupChatSocket } from "../modules/consultations/chat.gateway";
import { createServer } from "http";

jest.mock("../shared/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe("setupChatSocket — vet room joining", () => {
  test("un usuario con rol VET se une a la sala vets-online al conectarse", async () => {
    const mockHttpServer = createServer();
    const io = await setupChatSocket(mockHttpServer);

    const mockVetSocket: any = {
      data: { user: { userId: "vet-123", role: "VET" } },
      join: jest.fn(),
      on: jest.fn(),
    };

    const listener = io.listeners("connection")[0] as (socket: any) => void;
    listener(mockVetSocket);

    expect(mockVetSocket.join).toHaveBeenCalledWith("user:vet-123");
    expect(mockVetSocket.join).toHaveBeenCalledWith("vets-online");
  });

  test("un usuario con rol CLIENT NO se une a la sala vets-online", async () => {
    const mockHttpServer = createServer();
    const io = await setupChatSocket(mockHttpServer);

    const mockClientSocket: any = {
      data: { user: { userId: "client-123", role: "CLIENT" } },
      join: jest.fn(),
      on: jest.fn(),
    };

    const listener = io.listeners("connection")[0] as (socket: any) => void;
    listener(mockClientSocket);

    expect(mockClientSocket.join).toHaveBeenCalledWith("user:client-123");
    expect(mockClientSocket.join).not.toHaveBeenCalledWith("vets-online");
  });
});
