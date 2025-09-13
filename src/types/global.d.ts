declare global {
  interface Window {
    snap?: {
      pay: (
        token: string | undefined,
        callbacks: {
          onSuccess?: () => void;
          onPending?: () => void;
          onError?: () => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}
