type Listener = () => void;

const listeners = new Set<Listener>();

/** Avisa a las secciones que deben refrescar sus listas (eventos de socket). */
export function notifyDataChanged() {
  listeners.forEach((l) => l());
}

/** Suscribe un callback a los cambios de datos. Devuelve unsubscribe. */
export function onDataChanged(cb: Listener) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
