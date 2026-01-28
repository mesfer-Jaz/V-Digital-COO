/**
 * XCircle Digital COO - PM2 Ecosystem Configuration for ~/clawdbot/
 * 
 * This configuration is optimized for production deployment on 72.60.178.47
 * 
 * Usage:
 * pm2 start ecosystem-clawdbot.config.js
 * pm2 save
 * pm2 startup
 */

module.exports = {
  apps: [
    {
      // ==================== MAIN APP ====================
      name: 'XCircle-COO',
      script: './index-upgraded.js',
      cwd: '/home/ubuntu/clawdbot',
      instances: 1,
      exec_mode: 'fork',
      
      // ==================== ENVIRONMENT ====================
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info'
      },
      
      // ==================== LOGGING ====================
      error_file: '/home/ubuntu/clawdbot/logs/error.log',
      out_file: '/home/ubuntu/clawdbot/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // ==================== RESOURCE LIMITS ====================
      max_memory_restart: '512M',
      max_restarts: 10,
      min_uptime: '10s',
      
      // ==================== GRACEFUL SHUTDOWN ====================
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      
      // ==================== RESTART POLICY ====================
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // ==================== FILE WATCHING (Development only) ====================
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git', '.wwebjs_auth'],
      
      // ==================== ADDITIONAL OPTIONS ====================
      merge_logs: false,
      combine_logs: false,
      
      // ==================== ENVIRONMENT VARIABLES ====================
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      },
      
      env_development: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'debug'
      }
    }
  ],
  
  // ==================== DEPLOYMENT CONFIGURATION ====================
  deploy: {
    production: {
      user: 'ubuntu',
      host: '72.60.178.47',
      ref: 'origin/main',
      repo: 'git@github.com:xcircle/digital-coo.git',
      path: '/home/ubuntu/clawdbot',
      'post-deploy': 'npm install && pm2 reload ecosystem-clawdbot.config.js --env production',
      'pre-deploy-local': 'echo "Deploying XCircle Digital COO to production"'
    }
  }
};

/**
 * ==================== PM2 COMMANDS ====================
 * 
 * START:
 *   pm2 start ecosystem-clawdbot.config.js
 *   pm2 start ecosystem-clawdbot.config.js --env production
 *   pm2 start ecosystem-clawdbot.config.js --env development
 * 
 * MONITOR:
 *   pm2 monit
 *   pm2 list
 *   pm2 info XCircle-COO
 *   pm2 logs XCircle-COO
 *   pm2 logs XCircle-COO --lines 100
 *   pm2 logs XCircle-COO --err
 * 
 * CONTROL:
 *   pm2 stop XCircle-COO
 *   pm2 restart XCircle-COO
 *   pm2 reload XCircle-COO
 *   pm2 delete XCircle-COO
 * 
 * PERSISTENCE:
 *   pm2 save
 *   pm2 startup
 *   pm2 resurrect
 * 
 * DEPLOYMENT:
 *   pm2 deploy ecosystem-clawdbot.config.js production setup
 *   pm2 deploy ecosystem-clawdbot.config.js production update
 *   pm2 deploy ecosystem-clawdbot.config.js production exec "npm run build"
 * 
 * ==================== QUICK REFERENCE ====================
 * 
 * Start bot:
 *   cd ~/clawdbot
 *   pm2 start ecosystem-clawdbot.config.js
 * 
 * View logs:
 *   pm2 logs XCircle-COO
 * 
 * Monitor:
 *   pm2 monit
 * 
 * Restart:
 *   pm2 restart XCircle-COO
 * 
 * Stop:
 *   pm2 stop XCircle-COO
 * 
 * ==================== TROUBLESHOOTING ====================
 * 
 * Bot not starting:
 *   1. Check logs: pm2 logs XCircle-COO --err
 *   2. Verify .env file exists: ls -la ~/clawdbot/.env
 *   3. Check Node.js: node --version
 *   4. Verify dependencies: npm list
 * 
 * High memory usage:
 *   1. Check memory: pm2 info XCircle-COO
 *   2. Restart bot: pm2 restart XCircle-COO
 *   3. Increase limit: max_memory_restart: '1G'
 * 
 * Process keeps restarting:
 *   1. Check error logs: pm2 logs XCircle-COO --err
 *   2. Verify API keys in .env
 *   3. Check network connectivity
 *   4. Review system resources
 */
