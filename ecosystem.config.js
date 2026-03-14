module.exports = {
  apps: [
    {
      name: 'pageamphtml',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/pageamphtml',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pageamphtml/error.log',
      out_file: '/var/log/pageamphtml/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
