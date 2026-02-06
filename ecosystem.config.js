module.exports = {
  apps: [
    {
      name: 'documenton',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',

      // 环境变量配置
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // 从 .env.local 加载环境变量
      env_file: '.env.local',

      // 日志配置
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,

      // 自动重启配置
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // 监听文件变化（生产环境建议关闭）
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        '.next',
        '.git',
        'venv',
        '__pycache__'
      ],

      // 内存限制
      max_memory_restart: '1G',

      // 合并日志
      merge_logs: true,

      // 启动延迟
      listen_timeout: 10000,
      kill_timeout: 5000,
    }
  ]
};
