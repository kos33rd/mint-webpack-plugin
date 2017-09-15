## Module-level Linter plugin for Webpack

### Usage

In your webpack configuration

```js
const MintPlugin = require('mint-webpack-plugin')

module.exports = {
  // ...
  plugins: [
    new MintPlugin({
        root: './src',
        mask: ['**/*.js*', '**/*.jsx', '**/*.css', '**/*.svg', '!**/*.spec.js*', '!node_modules/**'] // any suitable globby patterns (https://github.com/sindresorhus/globby)
    }),
  ],
  // ...
}
```


### Available checks

At the moment there is only one linting option - search for unused files in your project.


### Results

The plugin will dump report every time you build your project.


