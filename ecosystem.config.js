module.exports = {
  apps: [
    {
      name: 'portfolio-api',
      script: './api/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        LOCAL_REBUILD: 'true',
      },
    },
  ],
};

