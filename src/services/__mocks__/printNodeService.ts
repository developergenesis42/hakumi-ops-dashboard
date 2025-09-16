// Mock printNodeService for tests
export const printNodeService = {
  printReceipt: jest.fn(),
  getPrinters: jest.fn(),
  getPrinterStatus: jest.fn(),
  isConfigured: jest.fn(() => false),
  configure: jest.fn(),
  testConnection: jest.fn(),
};

export default printNodeService;
