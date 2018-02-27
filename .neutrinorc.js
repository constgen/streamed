'use strict';

module.exports = {
    use: [
        'neutrino-preset-eslintrc',
        ['neutrino-preset-umd', {library: 'Streamed'}],
        '@neutrinojs/jest'
    ]
};
