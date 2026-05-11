const { VueLoaderPlugin } = require("vue-loader");

module.exports = {
  module: {
    rules: [
      // Vue Single-File Components
      {
        test: /\.vue$/,
        use: "vue-loader",
      },
      // JS transpilation via Babel
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: ["@babel/plugin-transform-runtime"],
          },
        },
      },
      // CSS — vue-style-loader handles <style> blocks inside .vue files
      {
        test: /\.css$/,
        use: ["vue-style-loader", "css-loader"],
      },
      // SCSS (PrimeFlex / PrimeVue themes)
      {
        test: /\.s[ac]ss$/,
        use: ["vue-style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
  plugins: [new VueLoaderPlugin()],
};
