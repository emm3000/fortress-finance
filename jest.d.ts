declare global {
  var __TEST_ROUTER__: {
    replace: jest.Mock;
    push: jest.Mock;
    back: jest.Mock;
  };
  var __TEST_LOCAL_SEARCH_PARAMS__: jest.Mock;
}

export {};
