/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  workspaceRoot: "../",
  optimize: {
    bundle: true,
    minify: true,
    target: "es2020",
  },
  mount: {
    src: "/_dist_",
    public: "/",
  },
  plugins: ["@snowpack/plugin-react-refresh", "@snowpack/plugin-dotenv"],
  exclude: ["**/*.@(test|stories).@(ts|tsx)"],
  packageOptions: {
    polyfillNode: true,
  },
  devOptions: {
    hmrErrorOverlay: false,
    open: "none",
  },
  buildOptions: {
    baseUrl: "",
    clean: true,
    out: "../../fiftyone/server/static",
  },
};