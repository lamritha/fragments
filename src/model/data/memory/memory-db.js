// Simple key/value store: primaryKey (e.g. ownerId) -> secondaryKey (e.g. fragmentId) -> value
const validateKey = (key) => typeof key === 'string';

class MemoryDB {
  constructor() {
    /** @type {Record<string, any>} */
    this.db = {};
  }

  get(primaryKey, secondaryKey) {
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      throw new Error(
        `primaryKey and secondaryKey strings are required, got primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`
      );
    }

    const db = this.db;
    const value = db[primaryKey] && db[primaryKey][secondaryKey];
    return Promise.resolve(value);
  }

  put(primaryKey, secondaryKey, value) {
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      throw new Error(
        `primaryKey and secondaryKey strings are required, got primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`
      );
    }

    const db = this.db;
    db[primaryKey] = db[primaryKey] || {};
    db[primaryKey][secondaryKey] = value;
    return Promise.resolve();
  }

  // Returns all values under a primaryKey (empty array if none)
  query(primaryKey) {
    if (!validateKey(primaryKey)) {
      throw new Error(`primaryKey string is required, got primaryKey=${primaryKey}`);
    }

    const db = this.db;
    const values = db[primaryKey] ? Object.values(db[primaryKey]) : [];
    return Promise.resolve(values);
  }

  async del(primaryKey, secondaryKey) {
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      throw new Error(
        `primaryKey and secondaryKey strings are required, got primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`
      );
    }

    if (!(await this.get(primaryKey, secondaryKey))) {
      throw new Error(
        `missing entry for primaryKey=${primaryKey} and secondaryKey=${secondaryKey}`
      );
    }

    const db = this.db;
    delete db[primaryKey][secondaryKey];
    return Promise.resolve();
  }
}

module.exports = MemoryDB;
