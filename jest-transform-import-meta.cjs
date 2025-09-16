const { transform } = require('@babel/core');

module.exports = {
  process(sourceText, sourcePath, options) {
    const result = transform(sourceText, {
      filename: sourcePath,
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' }
        }],
        ['@babel/preset-typescript', {
          isTSX: sourcePath.endsWith('.tsx'),
          allExtensions: true
        }]
      ],
      plugins: [
        function() {
          return {
            visitor: {
              MetaProperty(path) {
                if (path.node.meta.name === 'import' && path.node.property.name === 'env') {
                  path.replaceWithSourceString('process.env');
                }
              }
            }
          };
        }
      ]
    });

    return {
      code: result.code
    };
  }
};
