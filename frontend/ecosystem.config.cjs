module.exports = {
  apps: [
    {
      name: "abmmcn-frontend",
      script: "npx",
      args: "serve -s dist -l 5173",
      cwd: "./frontend",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
