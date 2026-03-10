type IdleTaskHandle = {
  cancel: () => void;
};

type IdleCallback = () => void;

export const runWhenIdle = (callback: IdleCallback): IdleTaskHandle => {
  if (typeof globalThis.requestIdleCallback === "function") {
    const id = globalThis.requestIdleCallback(() => {
      callback();
    });

    return {
      cancel: () => {
        if (typeof globalThis.cancelIdleCallback === "function") {
          globalThis.cancelIdleCallback(id);
        }
      },
    };
  }

  const timeoutId = setTimeout(callback, 0);
  return {
    cancel: () => clearTimeout(timeoutId),
  };
};
