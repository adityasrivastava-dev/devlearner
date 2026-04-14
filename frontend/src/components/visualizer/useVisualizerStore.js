import { create } from 'zustand';

const useVisualizerStore = create((set) => ({
  frames: [],
  currentFrame: 0,
  isPlaying: false,
  speed: 1.0, // delay multiplier: 0.5 = fast, 2.0 = slow

  setFrames: (frames) =>
    set({ frames, currentFrame: 0, isPlaying: false }),

  nextFrame: () =>
    set((state) => {
      const next = Math.min(state.currentFrame + 1, state.frames.length - 1);
      const atEnd = next >= state.frames.length - 1;
      return { currentFrame: next, isPlaying: atEnd ? false : state.isPlaying };
    }),

  prevFrame: () =>
    set((state) => ({
      currentFrame: Math.max(state.currentFrame - 1, 0),
      isPlaying: false,
    })),

  goToFrame: (i) => set({ currentFrame: i }),

  togglePlay: () =>
    set((state) => ({
      isPlaying:
        state.currentFrame < state.frames.length - 1 ? !state.isPlaying : false,
    })),

  setSpeed: (speed) => set({ speed }),

  reset: () => set({ currentFrame: 0, isPlaying: false }),
}));

export default useVisualizerStore;
