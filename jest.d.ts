declare global {
  var __TEST_ROUTER__: {
    replace: jest.Mock;
    push: jest.Mock;
    back: jest.Mock;
  };
}

export {};
