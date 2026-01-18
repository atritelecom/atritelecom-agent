const WebSocket = require('ws');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// ========== CONFIGURAÇÃO ==========
const CONFIG_FILE = path.join(process.env.APPDATA || '.', 'AtritelecomAgent', 'config.json');
const LOG_FILE = path.join(process.env.APPDATA || '.', 'AtritelecomAgent', 'agent.log');
const SERVER_URL = 'wss://saas-websocket.onrender.com';

let config = {
    cliente_id: '',
    server_url: SERVER_URL
};

let ws = null;
let reconnectInterval = null;
let pingInterval = null;

// ========== LOGGING ==========
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    try {
        const dir = path.dirname(LOG_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.appendFileSync(LOG_FILE, logMessage + '\n');
    } catch (e) {}
}

// ========== CONFIGURAÇÃO ==========
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            config = { ...config, ...JSON.parse(data) };
            log(`Configuração carregada: cliente_id = ${config.cliente_id}`);
        }
    } catch (e) {
        log(`Erro ao carregar config: ${e.message}`);
    }
}

function saveConfig() {
    try {
        const dir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        log('Configuração salva');
    } catch (e) {
        log(`Erro ao salvar config: ${e.message}`);
    }
}

// ========== INFORMAÇÕES DO SISTEMA ==========
function getSystemInfo() {
    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        memory_total: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
        memory_free: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
        uptime: Math.round(os.uptime() / 3600 * 100) / 100 + ' horas',
        network: getNetworkInfo(),
        timestamp: Date.now()
    };
}

function getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const result = [];
    
    for (const [name, addrs] of Object.entries(interfaces)) {
        for (const addr of addrs) {
            if (addr.family === 'IPv4' && !addr.internal) {
                result.push({
                    interface: name,
                    ip: addr.address,
                    mac: addr.mac
                });
            }
        }
    }
    
    return result;
}

// ========== WEBSOCKET ==========
function connect() {
    if (!config.cliente_id) {
        log('ERRO: cliente_id não configurado!');
        return;
    }
    
    log(`Conectando ao servidor: ${config.server_url}`);
    
    try {
        ws = new WebSocket(config.server_url);
        
        ws.on('open', () => {
            log('Conectado ao servidor!');
            
            // Autenticar
            const authMessage = {
                action: 'auth',
                cliente_id: config.cliente_id,
                info: getSystemInfo()
            };
            
            ws.send(JSON.stringify(authMessage));
            log('Autenticação enviada');
            
            // Iniciar ping periódico
            if (pingInterval) clearInterval(pingInterval);
            pingInterval = setInterval(sendStatusUpdate, 30000); // A cada 30 segundos
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                log(`Mensagem recebida: ${message.action || message.type || 'unknown'}`);
                handleMessage(message);
            } catch (e) {
                log(`Erro ao processar mensagem: ${e.message}`);
            }
        });
        
        ws.on('close', () => {
            log('Desconectado do servidor');
            scheduleReconnect();
        });
        
        ws.on('error', (error) => {
            log(`Erro WebSocket: ${error.message}`);
        });
        
    } catch (e) {
        log(`Erro ao conectar: ${e.message}`);
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    if (reconnectInterval) return;
    
    log('Reconectando em 10 segundos...');
    reconnectInterval = setTimeout(() => {
        reconnectInterval = null;
        connect();
    }, 10000);
}

function sendStatusUpdate() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            action: 'status_update',
            cliente_id: config.cliente_id,
            info: getSystemInfo()
        }));
    }
}

// ========== COMANDOS ==========
function handleMessage(message) {
    switch (message.action) {
        case 'auth_success':
            log('Autenticação bem sucedida!');
            break;
            
        case 'get_info':
            sendResponse(message.request_id, { info: getSystemInfo() });
            break;
            
        case 'get_cameras':
            getCameras(message.request_id);
            break;
            
        case 'exec':
            executeCommand(message.command, message.request_id);
            break;
            
        case 'ping':
            sendResponse(message.request_id, { pong: true, timestamp: Date.now() });
            break;
            
        default:
            log(`Ação desconhecida: ${message.action}`);
    }
}

function sendResponse(request_id, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            request_id,
            cliente_id: config.cliente_id,
            ...data
        }));
    }
}

function executeCommand(command, request_id) {
    log(`Executando comando: ${command}`);
    
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
        sendResponse(request_id, {
            action: 'exec_result',
            success: !error,
            stdout: stdout,
            stderr: stderr,
            error: error ? error.message : null
        });
    });
}

function getCameras(request_id) {
    // Tenta encontrar câmeras via ARP/rede local
    const command = process.platform === 'win32' 
        ? 'arp -a' 
        : 'arp -n';
    
    exec(command, (error, stdout, stderr) => {
        sendResponse(request_id, {
            action: 'cameras_result',
            arp_table: stdout,
            error: error ? error.message : null
        });
    });
}

// ========== INICIALIZAÇÃO ==========
function init() {
    log('========================================');
    log('Atritelecom Agent v1.0.0');
    log('========================================');
    
    // Verificar argumento de linha de comando para cliente_id
    const args = process.argv.slice(2);
    if (args[0]) {
        config.cliente_id = args[0];
        saveConfig();
        log(`Cliente ID configurado via argumento: ${config.cliente_id}`);
    } else {
        loadConfig();
    }
    
    if (!config.cliente_id) {
        log('');
        log('ERRO: Cliente ID não configurado!');
        log('');
        log('Use: agent.exe <cliente_id>');
        log('Exemplo: agent.exe atritelecom');
        log('');
        
        // No Windows, espera input
        if (process.platform === 'win32') {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            rl.question('Digite o Cliente ID: ', (answer) => {
                if (answer.trim()) {
                    config.cliente_id = answer.trim();
                    saveConfig();
                    rl.close();
                    connect();
                } else {
                    log('Cliente ID inválido. Saindo...');
                    process.exit(1);
                }
            });
        } else {
            process.exit(1);
        }
    } else {
        connect();
    }
}

// Tratar encerramento gracioso
process.on('SIGINT', () => {
    log('Encerrando...');
    if (ws) ws.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('Encerrando...');
    if (ws) ws.close();
    process.exit(0);
});

// Iniciar
init();
