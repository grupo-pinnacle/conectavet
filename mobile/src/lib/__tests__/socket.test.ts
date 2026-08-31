import { applySocketToken, connectSocket, disconnectSocket, getSocket } from '../socket';
import { io, Socket } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mSocket = {
    connected: false,
    on: jest.fn(),
    off: jest.fn(),
    connect: jest.fn().mockReturnThis(),
    disconnect: jest.fn().mockReturnThis(),
    removeAllListeners: jest.fn(),
    emit: jest.fn(),
  };
  return {
    io: jest.fn(() => mSocket),
    Socket: jest.fn(() => mSocket)
  };
});

describe('socket', () => {
  let mockSocket: any;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();

    // Disconnect and reset socket state before testing
    disconnectSocket();

    // Get the mocked socket instance
    mockSocket = io('', {});
    mockSocket.connected = false;
  });

  afterEach(() => {
    disconnectSocket();
  });

  describe('applySocketToken', () => {
    it('should do nothing if socket is null', () => {
      // Socket is initially null after disconnectSocket()
      expect(getSocket()).toBeNull();

      applySocketToken('new_token');

      // Mocks should not be called
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(mockSocket.connect).not.toHaveBeenCalled();
    });

    it('should not disconnect and connect if socket exists but is not connected', async () => {
      mockSocket.connected = false;

      const promise = connectSocket();

      const onConnectCall = mockSocket.on.mock.calls.find((c: any) => c[0] === 'connect');
      if (onConnectCall) {
        onConnectCall[1]();
      }

      // Clear timers to resolve the open handles issue
      jest.runAllTimers();

      await promise;

      expect(getSocket()).not.toBeNull();

      jest.clearAllMocks();

      applySocketToken('new_token');

      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(mockSocket.connect).not.toHaveBeenCalled();
    });

    it('should call disconnect and connect if socket exists and is connected', async () => {
      mockSocket.connected = true;

      const promise = connectSocket();

      const onConnectCall = mockSocket.on.mock.calls.find((c: any) => c[0] === 'connect');
      if (onConnectCall) {
        onConnectCall[1]();
      }

      jest.runAllTimers();

      await promise;

      expect(getSocket()).not.toBeNull();

      jest.clearAllMocks();

      applySocketToken('new_token');

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.connect).toHaveBeenCalled();

      const disconnectOrder = mockSocket.disconnect.mock.invocationCallOrder[0];
      const connectOrder = mockSocket.connect.mock.invocationCallOrder[0];
      expect(disconnectOrder).toBeLessThan(connectOrder);
    });
  });
});
