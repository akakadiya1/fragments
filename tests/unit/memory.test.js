const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
} = require('../../src/model/data/memory');

describe('Memory Fragment Database', () => {
  const ownerId = 'user123';
  const fragmentId = 'frag1';

  test('writeFragment() stores metadata correctly', async () => {
    const fragment = { ownerId, id: fragmentId, type: 'text/plain' };
    await writeFragment(fragment);
    const result = await readFragment(ownerId, fragmentId);
    expect(result).toEqual(fragment);
  });

  test('writeFragment() resolves with undefined for invalid fragment', async () => {
    await expect(writeFragment({ ownerId: '', id: '', type: '' })).resolves.toBeUndefined();
  });

  test('readFragment() and readFragmentData() return undefined for non-existent fragment', async () => {
    expect(await readFragment(ownerId, 'non-existent')).toBeUndefined();
    expect(await readFragmentData(ownerId, 'non-existent')).toBeUndefined();
  });

  test('readFragment() and deleteFragment() expect valid string keys', async () => {
    await expect(readFragment()).rejects.toThrow();
    await expect(readFragment(1, 2)).rejects.toThrow();
    await expect(deleteFragment()).rejects.toThrow();
    await expect(deleteFragment(1, 2)).rejects.toThrow();
  });

  test('writeFragmentData() stores and retrieves buffer correctly', async () => {
    const buffer = Buffer.from('Hello World');
    await writeFragmentData(ownerId, fragmentId, buffer);
    expect(await readFragmentData(ownerId, fragmentId)).toEqual(buffer);
  });

  test('listFragments() returns correct results', async () => {
    const fragment = { ownerId, id: fragmentId, type: 'text/plain' };
    await writeFragment(fragment);
    expect(await listFragments(ownerId)).toEqual([fragmentId]);
    expect(await listFragments(ownerId, true)).toEqual([fragment]);
    expect(await listFragments('other-user')).toEqual([]);
  });

  test('deleteFragment() removes metadata and data and throws error when re-deleting', async () => {
    const fragment = { ownerId, id: fragmentId, type: 'text/plain' };
    const buffer = Buffer.from('Hello World');
    await writeFragment(fragment);
    await writeFragmentData(ownerId, fragmentId, buffer);
    await deleteFragment(ownerId, fragmentId);

    expect(await readFragment(ownerId, fragmentId)).toBeUndefined();
    expect(await readFragmentData(ownerId, fragmentId)).toBeUndefined();
    await expect(deleteFragment(ownerId, fragmentId)).rejects.toThrow();
  });
});
