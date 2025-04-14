const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
  updateFragment,
} = require('../../src/model/data'); // importing from index.js[data] for future scalability [AWS]

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

describe('updateFragment()', () => {
  const ownerId = 'user123';
  const fragmentId = 'frag1';
  const initialFragment = {
    ownerId,
    id: fragmentId,
    type: 'text/plain',
    size: 11,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
  const initialBuffer = Buffer.from('Hello World');
  const newBuffer = Buffer.from('Updated content');

  beforeEach(async () => {
    await writeFragment(initialFragment);
    await writeFragmentData(ownerId, fragmentId, initialBuffer);
  });

  afterEach(async () => {
    await deleteFragment(ownerId, fragmentId);
  });

  test('updates fragment data and metadata correctly', async () => {
    const updatedFragment = await updateFragment(ownerId, fragmentId, 'text/plain', newBuffer);

    // Check metadata was updated
    expect(updatedFragment.size).toBe(newBuffer.length);
    expect(new Date(updatedFragment.updated).getTime()).toBeGreaterThanOrEqual(
      new Date(initialFragment.updated).getTime()
    );

    // Check data was updated
    const data = await readFragmentData(ownerId, fragmentId);
    expect(data).toEqual(newBuffer);
  });

  test('throws 404 error for non-existent fragment', async () => {
    await expect(updateFragment(ownerId, 'non-existent', 'text/plain', newBuffer)).rejects.toThrow(
      /Fragment with id non-existent not found/
    );
  });

  test('throws 400 error for content-type mismatch', async () => {
    await expect(updateFragment(ownerId, fragmentId, 'text/markdown', newBuffer)).rejects.toThrow(
      /Content-Type mismatch/
    );
  });

  test('throws error when new data buffer is not provided', async () => {
    await expect(updateFragment(ownerId, fragmentId, 'text/plain', undefined)).rejects.toThrow();
  });

  test('maintains other fragment properties after update', async () => {
    const updatedFragment = await updateFragment(ownerId, fragmentId, 'text/plain', newBuffer);
    expect(updatedFragment.ownerId).toBe(initialFragment.ownerId);
    expect(updatedFragment.id).toBe(initialFragment.id);
    expect(updatedFragment.type).toBe(initialFragment.type);
    expect(updatedFragment.created).toBe(initialFragment.created);
  });
});
