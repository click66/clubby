const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    'sjcadmin/common': './client/sjcadmin/common.js',
    'sjcadmin/attendance': './client/sjcadmin/attendance.js',
    'sjcadmin/member': './client/sjcadmin/member.js',
    'sjcadmin/members': './client/sjcadmin/members.js',
    'sjcmembers/common': './client/sjcmembers/common.js',
  },
  module: {
    rules: [
      {
        test: /\.(scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            }
          }
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/inline",
      },
    ],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "static")
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css"
    }),
  ],
};
