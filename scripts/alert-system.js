#!/usr/bin/env node

/**
 * Sistema de alertas para AbmMcn
 * Envía notificaciones por email, SMS y webhook cuando se detectan problemas
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

// Configuración de alertas
const alertConfig = {
  email: {
    enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
    smtp: {
      host: process.env.ALERT_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.ALERT_SMTP_PORT) || 587,
      secure: process.env.ALERT_SMTP_SECURE === 'true',
      auth: {
        user: process.env.ALERT_SMTP_USER,
        pass: process.env.ALERT_SMTP_PASS
      }
    },
    from: process.env.ALERT_EMAIL_FROM || 'alerts@abmmcn.com',
    to: process.env.ALERT_EMAIL_TO ? process.env.ALERT_EMAIL_TO.split(',') : [],
    subject: '[AbmMcn] Alerta del Sistema'
  },
  webhook: {
    enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true',
    url: process.env.ALERT_WEBHOOK_URL,
    timeout: parseInt(process.env.ALERT_WEBHOOK_TIMEOUT) || 5000
  },
  sms: {
    enabled: process.env.ALERT_SMS_ENABLED === 'true',
    provider: process.env.ALERT_SMS_PROVIDER || 'twilio',
    apiKey: process.env.ALERT_SMS_API_KEY,
    apiSecret: process.env.ALERT_SMS_API_SECRET,
    from: process.env.ALERT_SMS_FROM,
    to: process.env.ALERT_SMS_TO ? process.env.ALERT_SMS_TO.split(',') : []
  },
  thresholds: {
    cooldown: parseInt(process.env.ALERT_COOLDOWN) || 300000, // 5 minutos
    maxAlertsPerHour: parseInt(process.env.ALERT_MAX_PER_HOUR) || 10
  }
};

// Historial de alertas
const alertHistory = {
  alerts: [],
  lastAlert: {},
  
  add(alert) {
    this.alerts.push({
      ...alert,
      timestamp: new Date().toISOString(),
      id: this.generateId()
    });
    
    // Mantener solo las últimas 100 alertas
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  },
  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  canSendAlert(component, level) {
    const now = Date.now();
    const lastAlertKey = `${component}-${level}`;
    const lastAlertTime = this.lastAlert[lastAlertKey] || 0;
    
    // Verificar cooldown
    if (now - lastAlertTime < alertConfig.thresholds.cooldown) {
      return false;
    }
    
    // Verificar límite por hora
    const oneHourAgo = now - 3600000;
    const recentAlerts = this.alerts.filter(alert => 
      alert.timestamp > new Date(oneHourAgo).toISOString()
    );
    
    if (recentAlerts.length >= alertConfig.thresholds.maxAlertsPerHour) {
      return false;
    }
    
    return true;
  },
  
  markAlertSent(component, level) {
    const lastAlertKey = `${component}-${level}`;
    this.lastAlert[lastAlertKey] = Date.now();
  }
};

// Función para crear transporter de email
function createEmailTransporter() {
  if (!alertConfig.email.enabled) {
    return null;
  }
  
  try {
    return nodemailer.createTransporter(alertConfig.email.smtp);
  } catch (error) {
    log.error(`Error creando transporter de email: ${error.message}`);
    return null;
  }
}

// Función para enviar alerta por email
async function sendEmailAlert(alert) {
  if (!alertConfig.email.enabled || alertConfig.email.to.length === 0) {
    return false;
  }
  
  try {
    const transporter = createEmailTransporter();
    if (!transporter) {
      return false;
    }
    
    const htmlContent = generateEmailHTML(alert);
    const textContent = generateEmailText(alert);
    
    const mailOptions = {
      from: alertConfig.email.from,
      to: alertConfig.email.to.join(', '),
      subject: `${alertConfig.email.subject} - ${alert.level.toUpperCase()}`,
      text: textContent,
      html: htmlContent
    };
    
    const result = await transporter.sendMail(mailOptions);
    log.success(`Alerta por email enviada: ${result.messageId}`);
    return true;
    
  } catch (error) {
    log.error(`Error enviando email: ${error.message}`);
    return false;
  }
}

// Función para enviar alerta por webhook
async function sendWebhookAlert(alert) {
  if (!alertConfig.webhook.enabled || !alertConfig.webhook.url) {
    return false;
  }
  
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      level: alert.level,
      component: alert.component,
      message: alert.message,
      details: alert.details || {},
      system: {
        hostname: require('os').hostname(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };
    
    const response = await axios.post(alertConfig.webhook.url, payload, {
      timeout: alertConfig.webhook.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AbmMcn-AlertSystem/1.0'
      }
    });
    
    log.success(`Alerta por webhook enviada: ${response.status}`);
    return true;
    
  } catch (error) {
    log.error(`Error enviando webhook: ${error.message}`);
    return false;
  }
}

// Función para enviar alerta por SMS
async function sendSMSAlert(alert) {
  if (!alertConfig.sms.enabled || alertConfig.sms.to.length === 0) {
    return false;
  }
  
  try {
    // Implementación básica para Twilio
    if (alertConfig.sms.provider === 'twilio') {
      const twilio = require('twilio');
      const client = twilio(alertConfig.sms.apiKey, alertConfig.sms.apiSecret);
      
      const message = `[AbmMcn ${alert.level.toUpperCase()}] ${alert.component}: ${alert.message}`;
      
      for (const to of alertConfig.sms.to) {
        await client.messages.create({
          body: message,
          from: alertConfig.sms.from,
          to: to
        });
      }
      
      log.success('Alerta por SMS enviada');
      return true;
    }
    
    return false;
    
  } catch (error) {
    log.error(`Error enviando SMS: ${error.message}`);
    return false;
  }
}

// Función para generar HTML del email
function generateEmailHTML(alert) {
  const levelColors = {
    critical: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };
  
  const color = levelColors[alert.level] || '#6c757d';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Alerta del Sistema AbmMcn</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .alert-level { font-size: 24px; font-weight: bold; margin: 0; }
        .alert-component { font-size: 18px; margin: 10px 0 0 0; }
        .alert-message { font-size: 16px; margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid ${color}; }
        .details { margin-top: 20px; }
        .details h3 { color: #495057; margin-bottom: 10px; }
        .details pre { background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .footer { padding: 20px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="alert-level">${alert.level.toUpperCase()}</h1>
          <p class="alert-component">${alert.component}</p>
        </div>
        <div class="content">
          <div class="alert-message">${alert.message}</div>
          ${alert.details ? `
            <div class="details">
              <h3>Detalles:</h3>
              <pre>${JSON.stringify(alert.details, null, 2)}</pre>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Sistema de Monitoreo AbmMcn</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Hostname: ${require('os').hostname()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Función para generar texto del email
function generateEmailText(alert) {
  return `
ALERTA DEL SISTEMA ABMMCN
========================

Nivel: ${alert.level.toUpperCase()}
Componente: ${alert.component}
Mensaje: ${alert.message}

${alert.details ? `Detalles:\n${JSON.stringify(alert.details, null, 2)}\n` : ''}

Timestamp: ${new Date().toISOString()}
Hostname: ${require('os').hostname()}
Sistema: ${process.platform} ${process.version}
  `.trim();
}

// Función principal para enviar alerta
async function sendAlert(alert) {
  // Verificar si se puede enviar la alerta
  if (!alertHistory.canSendAlert(alert.component, alert.level)) {
    log.info(`Alerta suprimida por cooldown: ${alert.component} - ${alert.level}`);
    return false;
  }
  
  // Agregar al historial
  alertHistory.add(alert);
  
  log.header(`🚨 ENVIANDO ALERTA: ${alert.level.toUpperCase()}`);
  log.info(`Componente: ${alert.component}`);
  log.info(`Mensaje: ${alert.message}`);
  
  const results = {
    email: false,
    webhook: false,
    sms: false
  };
  
  // Enviar por todos los canales habilitados
  try {
    results.email = await sendEmailAlert(alert);
    results.webhook = await sendWebhookAlert(alert);
    results.sms = await sendSMSAlert(alert);
    
    // Marcar como enviada
    alertHistory.markAlertSent(alert.component, alert.level);
    
    const sentChannels = Object.entries(results)
      .filter(([_, sent]) => sent)
      .map(([channel, _]) => channel);
    
    if (sentChannels.length > 0) {
      log.success(`Alerta enviada por: ${sentChannels.join(', ')}`);
      return true;
    } else {
      log.warning('Alerta no se pudo enviar por ningún canal');
      return false;
    }
    
  } catch (error) {
    log.error(`Error enviando alerta: ${error.message}`);
    return false;
  }
}

// Función para crear alertas predefinidas
function createAlert(level, component, message, details = {}) {
  return {
    level,
    component,
    message,
    details
  };
}

// Función para mostrar historial de alertas
function showAlertHistory(limit = 10) {
  log.header('📋 Historial de Alertas');
  
  const recentAlerts = alertHistory.alerts.slice(-limit);
  
  if (recentAlerts.length === 0) {
    log.info('No hay alertas en el historial');
    return;
  }
  
  recentAlerts.forEach(alert => {
    const timestamp = new Date(alert.timestamp).toLocaleString();
    const levelColor = alert.level === 'critical' ? colors.red : 
                      alert.level === 'warning' ? colors.yellow : colors.blue;
    
    console.log(`${levelColor}[${alert.level.toUpperCase()}]${colors.reset} ${timestamp} - ${alert.component}: ${alert.message}`);
  });
}

// Función para limpiar historial de alertas
function clearAlertHistory() {
  alertHistory.alerts = [];
  alertHistory.lastAlert = {};
  log.success('Historial de alertas limpiado');
}

// Función para mostrar configuración
function showConfig() {
  log.header('⚙️ Configuración de Alertas');
  
  console.log(`Email: ${alertConfig.email.enabled ? '✓' : '✗'}`);
  if (alertConfig.email.enabled) {
    console.log(`  SMTP: ${alertConfig.email.smtp.host}:${alertConfig.email.smtp.port}`);
    console.log(`  Destinatarios: ${alertConfig.email.to.join(', ')}`);
  }
  
  console.log(`Webhook: ${alertConfig.webhook.enabled ? '✓' : '✗'}`);
  if (alertConfig.webhook.enabled) {
    console.log(`  URL: ${alertConfig.webhook.url}`);
  }
  
  console.log(`SMS: ${alertConfig.sms.enabled ? '✓' : '✗'}`);
  if (alertConfig.sms.enabled) {
    console.log(`  Proveedor: ${alertConfig.sms.provider}`);
    console.log(`  Destinatarios: ${alertConfig.sms.to.join(', ')}`);
  }
  
  console.log(`Cooldown: ${alertConfig.thresholds.cooldown / 1000}s`);
  console.log(`Máximo por hora: ${alertConfig.thresholds.maxAlertsPerHour}`);
}

// Función para mostrar ayuda
function showHelp() {
  console.log(`
Uso: node alert-system.js [comando] [opciones]

Comandos:
  send <level> <component> <message>  Enviar alerta manual
  history [limit]                     Mostrar historial de alertas
  clear                              Limpiar historial
  config                             Mostrar configuración
  test                               Enviar alerta de prueba
  help                               Mostrar esta ayuda

Niveles: critical, warning, info
Componentes: PM2, System, Database, Application, Security

Ejemplos:
  node alert-system.js send critical PM2 "Aplicación no responde"
  node alert-system.js history 20
  node alert-system.js test
`);
}

// Función para enviar alerta de prueba
async function sendTestAlert() {
  const testAlert = createAlert(
    'info',
    'AlertSystem',
    'Esta es una alerta de prueba del sistema de monitoreo',
    {
      timestamp: new Date().toISOString(),
      test: true
    }
  );
  
  await sendAlert(testAlert);
}

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help') {
  showHelp();
} else if (command === 'send') {
  const [level, component, ...messageParts] = args.slice(1);
  const message = messageParts.join(' ');
  
  if (!level || !component || !message) {
    log.error('Uso: node alert-system.js send <level> <component> <message>');
    process.exit(1);
  }
  
  const alert = createAlert(level, component, message);
  sendAlert(alert).then(success => {
    process.exit(success ? 0 : 1);
  });
} else if (command === 'history') {
  const limit = parseInt(args[1]) || 10;
  showAlertHistory(limit);
} else if (command === 'clear') {
  clearAlertHistory();
} else if (command === 'config') {
  showConfig();
} else if (command === 'test') {
  sendTestAlert().then(() => {
    process.exit(0);
  });
} else {
  log.error(`Comando desconocido: ${command}`);
  showHelp();
  process.exit(1);
}

module.exports = {
  sendAlert,
  createAlert,
  showAlertHistory,
  clearAlertHistory,
  showConfig,
  alertHistory
};
