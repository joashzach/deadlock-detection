/**
 * The jsdom environment used by these tests does not expose `window.localStorage`,
 * so persistence tests install a stand-in. This keeps the storage API honest
 * (including failure modes) instead of mocking the persistence module itself.
 */

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
}

function install(storage: Storage): Storage {
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
  return storage;
}

/** Installs a working in-memory Storage on `window`. */
export function installMemoryStorage(): Storage {
  return install(new MemoryStorage());
}

/** Installs a Storage whose every operation fails, as in private mode or when full. */
export function installFailingStorage(): Storage {
  const fail = () => {
    throw new Error('storage unavailable');
  };
  return install({
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  } as unknown as Storage);
}

/** Removes the storage, as when the API is missing entirely. */
export function removeStorage(): void {
  Object.defineProperty(window, 'localStorage', {
    value: undefined,
    configurable: true,
    writable: true,
  });
}
