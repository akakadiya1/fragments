const yaml = require('js-yaml');

const conversionMap = {
  'text/plain': {
    json: (data) => JSON.stringify({ content: data }), // Convert plain text to JSON
    txt: (data) => data, // No conversion needed
  },
  'text/markdown': {
    html: (data) => `<h1>${data.replace('# ', '')}</h1>`, // Convert markdown to HTML
    txt: (data) => data, // No conversion needed
  },
  'text/html': {
    txt: (data) => data.replace(/<[^>]+>/g, ''), // Strip HTML tags to convert to plain text
  },
  'application/json': {
    yaml: (data) => yaml.dump(JSON.parse(data)), // Convert JSON to YAML
    txt: (data) => JSON.stringify(JSON.parse(data), null, 2), // Pretty-print JSON as text
  },
};

async function convertFragment(fragment, extension) {
  const converter = conversionMap[fragment.mimeType]?.[extension];
  if (!converter) return null;

  try {
    const convertedData = converter(fragment.data.toString()); // Ensure data is a string
    const mimeType = getMimeTypeForExtension(extension); // Get the correct MIME type for the extension

    return {
      mimeType,
      data: convertedData,
    };
  } catch (err) {
    console.error(`Error during conversion: ${err.message}`);
    return null;
  }
}

function getMimeTypeForExtension(extension) {
  switch (extension) {
    case 'json':
      return 'application/json';
    case 'yaml':
      return 'application/yaml';
    case 'html':
      return 'text/html';
    case 'txt':
      return 'text/plain';
    default:
      throw new Error(`Unsupported extension: ${extension}`);
  }
}

module.exports = { convertFragment };
