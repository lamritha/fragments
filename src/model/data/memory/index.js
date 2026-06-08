const MemoryDB = require('./memory-db');

// In-memory storage: metadata DB for fragment records, data DB for raw buffers
const data = new MemoryDB();
const metadata = new MemoryDB();

function writeFragment(fragment) {
  return metadata.put(fragment.ownerId, fragment.id, JSON.stringify(fragment));
}

async function readFragment(ownerId, id) {
  const serialized = await metadata.get(ownerId, id);
  return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
}

function writeFragmentData(ownerId, id, buffer) {
  return data.put(ownerId, id, buffer);
}

function readFragmentData(ownerId, id) {
  return data.get(ownerId, id);
}

async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId);

  if (expand || !fragments) {
    return fragments.map((fragment) =>
      typeof fragment === 'string' ? JSON.parse(fragment) : fragment
    );
  }

  return fragments.map((fragment) => JSON.parse(fragment).id);
}

function deleteFragment(ownerId, id) {
  return Promise.all([metadata.del(ownerId, id), data.del(ownerId, id)]);
}

module.exports.listFragments = listFragments;
module.exports.writeFragment = writeFragment;
module.exports.readFragment = readFragment;
module.exports.writeFragmentData = writeFragmentData;
module.exports.readFragmentData = readFragmentData;
module.exports.deleteFragment = deleteFragment;
