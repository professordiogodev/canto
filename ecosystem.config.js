module.exports = {
  apps: [
    {
      name: "canto",
      script: "server/index.js",
      node_args: "--experimental-sqlite",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
