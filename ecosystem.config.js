/**
 * Configuración PM2 optimizada para AbmMcn
 * Configuración por ambiente con monitoreo y logging avanzado
 */

const path = require("path");

module.exports = {
  apps: [
    {
      // ===========================================
      // BACKEND APPLICATION
      // ===========================================
      name: "abmmcn-backend",
      script: "server.js",
      cwd: "./backend",
      
      // Configuración de instancias
      instances: process.env.PM2_BACKEND_INSTANCES || 1,
      exec_mode: process.env.PM2_EXEC_MODE || "fork",
      
      // Configuración de reinicio
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.PM2_BACKEND_MAX_MEMORY || "1G",
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
      
      // Configuración de logging
      log_type: "json",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "../logs/backend-error.log",
      out_file: "../logs/backend-out.log",
      log_file: "../logs/backend-combined.log",
      time: true,
      
      // Configuración de monitoreo
      monitoring: true,
      pmx: true,
      
      // Variables de entorno por ambiente
      env: {
        NODE_ENV: "development",
        PORT: 3001,
        PM2_SERVE_PATH: "./backend",
        PM2_SERVE_PORT: 3001,
        PM2_SERVE_SPA: false,
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
      
      env_staging: {
        NODE_ENV: "staging",
        PORT: 3001,
        PM2_SERVE_PATH: "./backend",
        PM2_SERVE_PORT: 3001,
        PM2_SERVE_SPA: false,
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
      
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        PM2_SERVE_PATH: "./backend",
        PM2_SERVE_PORT: 3001,
        PM2_SERVE_SPA: false,
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
      
      // Configuración de cluster (solo para producción)
      ...(process.env.NODE_ENV === "production" && {
        instances: process.env.PM2_BACKEND_INSTANCES || "max",
        exec_mode: "cluster",
        node_args: "--max-old-space-size=2048",
      }),
      
      // Configuración de health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Configuración de kill timeout
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Configuración de source map
      source_map_support: true,
      
      // Configuración de interceptor
      pmx: {
        http: true,
        https: true,
        ignore_routes: ["/health", "/metrics"],
      },
    },
    
    {
      // ===========================================
      // FRONTEND APPLICATION
      // ===========================================
      name: "abmmcn-frontend",
      script: "serve",
      args: "-s dist -l 5173 --host 0.0.0.0 --no-clipboard",
      cwd: "./frontend",
      
      // Configuración de instancias
      instances: 1,
      exec_mode: "fork",
      
      // Configuración de reinicio
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.PM2_FRONTEND_MAX_MEMORY || "512M",
      min_uptime: "10s",
      max_restarts: 5,
      restart_delay: 2000,
      
      // Configuración de logging
      log_type: "json",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "../logs/frontend-error.log",
      out_file: "../logs/frontend-out.log",
      log_file: "../logs/frontend-combined.log",
      time: true,
      
      // Configuración de monitoreo
      monitoring: true,
      pmx: true,
      
      // Variables de entorno por ambiente
      env: {
        NODE_ENV: "development",
        PORT: 5173,
        PM2_SERVE_PATH: "./frontend/dist",
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: true,
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
      
      env_staging: {
        NODE_ENV: "staging",
        PORT: 5173,
        PM2_SERVE_PATH: "./frontend/dist",
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: true,
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
      
      env_production: {
        NODE_ENV: "production",
        PORT: 5173,
        PM2_SERVE_PATH: "./frontend/dist",
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: true,
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
      
      // Configuración de kill timeout
      kill_timeout: 3000,
      listen_timeout: 2000,
      
      // Configuración de interceptor
      pmx: {
        http: true,
        https: true,
        ignore_routes: ["/health", "/metrics"],
      },
    },
  ],
  
  // ===========================================
  // CONFIGURACIÓN GLOBAL DE PM2
  // ===========================================
  deploy: {
    production: {
      user: process.env.DEPLOY_USER || "deploy",
      host: process.env.DEPLOY_HOST || "localhost",
      ref: "origin/main",
      repo: process.env.DEPLOY_REPO || "git@github.com:user/abmmcn.git",
      path: process.env.DEPLOY_PATH || "/var/www/abmmcn",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
    staging: {
      user: process.env.DEPLOY_USER || "deploy",
      host: process.env.DEPLOY_HOST || "localhost",
      ref: "origin/develop",
      repo: process.env.DEPLOY_REPO || "git@github.com:user/abmmcn.git",
      path: process.env.DEPLOY_PATH || "/var/www/abmmcn-staging",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env staging",
      "pre-setup": "",
    },
  },
};