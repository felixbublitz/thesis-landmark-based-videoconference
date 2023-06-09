const path = require('path');
const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const webConfig = {
    target : 'web',
   context: process.cwd(),
   resolve: {
      extensions: ['.js', '.jsx', '.json', '.less', '.css'],
      modules: [__dirname, 'node_modules']
   },

   entry: {
      library: [
          'ws',
          '@mediapipe/face_mesh',
          '@mediapipe/drawing_utils',
          'webpack/lib/logging/runtime',
      ]
   },
   plugins : [
    new NodePolyfillPlugin({
        excludeAliases : ["util"]
    }), new webpack.DllPlugin({
        name: 'web_library',
        path: path.resolve(__dirname, './dist/library/web_library.json')
     }),
   ],
   resolve : {
alias : {
            zlib: require.resolve('browserify-zlib')
},
    fallback : { 
        fs:  false,
    },
   },
   output: {
      filename: 'web_library.dll.js',
      path: path.resolve(__dirname, './dist/library'),
      library: 'web_library'
   }
}

module.exports = [webConfig];