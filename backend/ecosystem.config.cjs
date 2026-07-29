module.exports = {
  apps: [{
    name: "rajcivic-backend-prod",
    script: "./server.js",
    instances: "max",
    exec_mode: "cluster",
    env_production: {
      NODE_ENV: "production",
      PORT: 5000
    }
  }]
};
