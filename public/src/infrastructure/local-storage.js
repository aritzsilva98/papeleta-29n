const KEY = 'papeleta29n';

// localStorage throws in private mode or when storage is blocked; the site then works without memory.
export const localStore = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? 'null');
    } catch {
      return null;
    }
  },
  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {}
  },
};
