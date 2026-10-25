const KEY = 'papeleta29n';

// En modo privado o con el almacenamiento bloqueado localStorage lanza excepciones.
// Entonces la web sigue funcionando, solo que sin recordar nada.
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
