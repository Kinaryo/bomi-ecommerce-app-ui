// global.d.ts
interface Snap {
  pay: (
    token: string,
    callbacks: {
      onSuccess?: () => void;
      onPending?: () => void;
      onError?: () => void;
      onClose?: () => void;
    }
  ) => void;
}

interface Window {
  snap?: Snap;
}
