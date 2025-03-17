// src/utils/conversionService.js
const yaml = require('js-yaml');

const conversionMap = {
  'text/plain': {
    txt: (data) => data, // No conversion needed
    json: (data) => JSON.stringify({ content: data }), // Convert to JSON
  },
  'text/markdown': {
    md: (data) => data, // No conversion needed
    html: (data) => `<h1>${data.replace('# ', '')}</h1>`, // Convert to HTML
    txt: (data) => data, // Convert to plain text
  },
  'text/html': {
    html: (data) => data, // No conversion needed
    txt: (data) => data.replace(/<[^>]+>/g, ''), // Strip HTML tags
  },
  'application/json': {
    json: (data) => data, // No conversion needed
    yaml: (data) => yaml.dump(JSON.parse(data)), // Convert to YAML
    txt: (data) => JSON.stringify(JSON.parse(data), null, 2), // Pretty-print JSON
  },
  // Add more types and conversions as needed
};

async function convertFragment(fragment, extension) {
  const converter = conversionMap[fragment.mimeType]?.[extension];
  if (!converter) return null;

  try {
    const convertedData = converter(fragment.data.toString()); // Ensure data is a string
    const mimeType = getMimeTypeForExtension(extension); // Get the correct MIME type

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
    case 'txt':
      return 'text/plain';
    case 'json':
      return 'application/json';
    case 'html':
      return 'text/html';
    case 'yaml':
      return 'application/yaml';
    case 'md':
      return 'text/markdown';
    default:
      throw new Error(`Unsupported extension: ${extension}`);
  }
}

module.exports = { convertFragment };
