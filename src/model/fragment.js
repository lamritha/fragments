const { randomUUID } = require('crypto');
const contentType = require('content-type');

const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

// Core domain model — metadata and blob data are stored separately
class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId) throw new Error('ownerId is required');
    if (!type) throw new Error('type is required');
    if (!Fragment.isSupportedType(type)) throw new Error(`type ${type} is not supported`);
    if (typeof size !== 'number') throw new Error('size must be a number');
    if (size < 0) throw new Error('size must be non-negative');
    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;
  }

  // List all fragment ids (or full objects) for a user
  static async byUser(ownerId, expand = false) {
    return listFragments(ownerId, expand);
  }

  // Load a single fragment's metadata by id
  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);
    if (!fragment) throw new Error(`fragment ${id} not found`);
    return new Fragment(fragment);
  }

  static delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  save() {
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  async setData(data) {
    if (!Buffer.isBuffer(data)) throw new Error('data must be a Buffer');
    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragment(this);
    return writeFragmentData(this.ownerId, this.id, data);
  }

  // Mime type without charset or other parameters
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  get isText() {
    return this.mimeType.startsWith('text/');
  }

  // Mime types this fragment can be converted to (used by future conversion routes)
  get formats() {
    const conversions = {
      'text/plain': ['text/plain'],
      'text/markdown': ['text/markdown', 'text/html', 'text/plain'],
      'text/html': ['text/html', 'text/plain'],
      'text/csv': ['text/csv', 'text/plain', 'application/json'],
      'application/json': ['application/json', 'application/yaml', 'text/plain'],
      'application/yaml': ['application/yaml', 'text/plain'],
      'image/png': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/jpeg': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/webp': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/avif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
      'image/gif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    };
    return conversions[this.mimeType] || [];
  }

  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      return [
        'text/plain', 'text/markdown', 'text/html', 'text/csv',
        'application/json', 'application/yaml',
        'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif',
      ].includes(type);
    } catch {
      return false;
    }
  }
}

module.exports.Fragment = Fragment;
