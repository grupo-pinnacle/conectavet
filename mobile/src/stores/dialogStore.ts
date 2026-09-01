import { create } from 'zustand';

export interface DialogConfig {
  title: string;
  message: string;
  type?: 'error' | 'success' | 'info';
  confirmText?: string;
  onConfirm?: () => void;
}

interface DialogState {
  isVisible: boolean;
  config: DialogConfig | null;
  show: (config: DialogConfig) => void;
  hide: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  isVisible: false,
  config: null,
  show: (config) => set({ isVisible: true, config }),
  hide: () => set({ isVisible: false }),
}));
