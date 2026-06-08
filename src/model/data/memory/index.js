const MemoryDB = require('./memory-db');

const metadata = new MemoryDB();
const data = new MemoryDB();

async function readFragment(ownerId, id) {
  return metadata.get(ownerId, id);
}

async function writeFragment(fragment) {
  return metadata.put(fragment.ownerId, fragment.id, fragment);
}

async function readFragmentData(ownerId, id) {
  return data.get(ownerId, id);
}

async function writeFragmentData(ownerId, id, buffer) {
  return data.put(ownerId, id, buffer);
}

async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId);
  if (expand || !fragments) return fragments;
  return fragments.map((fragment) => fragment.id);
}

async function deleteFragment(ownerId, id) {
  return Promise.all([metadata.del(ownerId, id), data.del(ownerId, id)]);
}

module.exports = {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
};
