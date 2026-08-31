jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: '192.168.1.1:8081',
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
