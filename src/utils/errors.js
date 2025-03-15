class FragmentNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FragmentNotFoundError';
  }
}

module.exports = {
  FragmentNotFoundError,
};
