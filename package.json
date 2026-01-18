const WebSocket = require('ws');
const os = require('os');
const axios = require('axios');

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const CLIENTE_ID = '1'; // MUDE AQUI PARA O ID DO SEU CLIENTE
const SERVER_URL = 'wss://seu-servidor.onrender.com'; // MUDE AQUI PARA A URL DO SEU RENDER

// ==========================================
// INFORMAÇÕES DO SISTEMA
// ==========================================

function getSystemInfo() {
    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        total_memory: Math.round(os.totalmem() / 1024 / 1024),
        free_memory: Math.round(os.freemem() / 1024 / 1024),
        uptime: Math.round(os.uptime() / 3600), // em horas
        version: '2.0.0'
    };
}

// ==========================================
// CONEXÃO WEBSOCKET
// ==========================================

let ws;
let reconnectTimeout;

function connect() {
    console.log('🔌 Conectando ao servidor...');
    
    ws = new WebSocket(SERVER_URL);

    ws.on('open', () => {
        console.log('✅ Conectado ao servidor!');
        
        // Autentica
        ws.send(JSON.stringify({
            action: 'auth',
            cliente_id: CLIENTE_ID,
            info: getSystemInfo()
        }));
        
        // Limpa timeout de reconexão
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
        }
    });

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('📨 Comando recebido:', data.action);
            
            // Resposta de autenticação
            if (data.action === 'auth_success') {
                console.log('✅ Autenticado:', data.message);
            }

            // Comando: Capturar snapshot XMEye
            if (data.action === 'xmeye_snapshot') {
                await handleXMEyeSnapshot(data);
            }

            // Comando: Adicionar câmera
            if (data.action === 'add_camera') {
                console.log('📸 Câmera adicionada:', data.camera);
                ws.send(JSON.stringify({
                    action: 'camera_added',
                    cliente_id: CLIENTE_ID,
                    camera: data.camera,
                    request_id: data.request_id
                }));
            }

            // Comando: Remover câmera
            if (data.action === 'remove_camera') {
                console.log('🗑️  Câmera removida:', data.camera_id);
                ws.send(JSON.stringify({
                    action: 'camera_removed',
                    cliente_id: CLIENTE_ID,
                    camera_id: data.camera_id,
                    request_id: data.request_id
                }));
            }

            // Comando: Adicionar dispositivo
            if (data.action === 'add_dispositivo') {
                console.log('🔌 Dispositivo adicionado:', data.dispositivo);
                ws.send(JSON.stringify({
                    action: 'dispositivo_added',
                    cliente_id: CLIENTE_ID,
                    dispositivo: data.dispositivo,
                    request_id: data.request_id
                }));
            }

            // Comando: Controlar dispositivo (ligar/desligar)
            if (data.action === 'control_dispositivo') {
                console.log(`💡 Controle dispositivo ${data.dispositivo_id}: ${data.comando}`);
                // Aqui você implementaria a lógica real de controle (Sonoff, Shelly, etc)
                ws.send(JSON.stringify({
                    action: 'dispositivo_controlled',
                    cliente_id: CLIENTE_ID,
                    dispositivo_id: data.dispositivo_id,
                    comando: data.comando,
                    success: true,
                    request_id: data.request_id
                }));
            }

        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
        }
    });

    ws.on('error', (error) => {
        console.error('❌ Erro no WebSocket:', error.message);
    });

    ws.on('close', () => {
        console.log('🔴 Desconectado do servidor');
        console.log('🔄 Reconectando em 5 segundos...');
        
        // Reconecta após 5 segundos
        reconnectTimeout = setTimeout(() => {
            connect();
        }, 5000);
    });

    ws.on('ping', () => {
        // Responde ao ping do servidor
        ws.send(JSON.stringify({
            action: 'pong',
            cliente_id: CLIENTE_ID,
            info: getSystemInfo()
        }));
    });
}

// ==========================================
// CAPTURA DE SNAPSHOT XMEYE
// ==========================================

async function handleXMEyeSnapshot(data) {
    const { serial, user, pass, channel, request_id } = data;
    
    console.log(`📸 Capturando snapshot XMEye: Serial ${serial} | Canal ${channel}`);
    
    try {
        // MÉTODO 1: Tenta via protocolo XMEye nativo (porta 34567)
        let snapshot = await captureXMEyeNative(serial, user, pass, channel);
        
        if (!snapshot) {
            // MÉTODO 2: Tenta via HTTP direto (se estiver na mesma rede)
            snapshot = await captureXMEyeHTTP(user, pass, channel);
        }
        
        if (snapshot) {
            // Converte pra base64
            const base64 = snapshot.toString('base64');
            
            // Envia pro servidor
            ws.send(JSON.stringify({
                action: 'xmeye_snapshot_response',
                request_id: request_id,
                success: true,
                snapshot: base64
            }));
            
            console.log('✅ Snapshot capturado e enviado!');
        } else {
            throw new Error('Não foi possível capturar snapshot');
        }
        
    } catch (error) {
        console.error('❌ Erro ao capturar XMEye:', error);
        
        ws.send(JSON.stringify({
            action: 'xmeye_snapshot_response',
            request_id: request_id,
            success: false,
            error: error.message,
            details: 'Verifique se o DVR está acessível na rede local'
        }));
    }
}

// Captura via protocolo XMEye nativo (P2P ou local)
async function captureXMEyeNative(serial, user, pass, channel) {
    try {
        // Aqui você usaria uma biblioteca XMEye nativa
        // Como não existe uma lib Node.js oficial, tentamos HTTP primeiro
        console.log('⚠️  Protocolo XMEye P2P nativo ainda não implementado');
        console.log('💡 Tentando captura via HTTP local...');
        return null;
        
    } catch (error) {
        console.error('Erro XMEye nativo:', error);
        return null;
    }
}

// Captura via HTTP direto (só funciona na mesma rede local)
async function captureXMEyeHTTP(user, pass, channel) {
    try {
        // Tenta descobrir IP do DVR na rede local
        // Por simplicidade, você pode configurar o IP manualmente
        const DVR_IP = '192.168.0.200'; // MUDE AQUI PRO IP DO SEU DVR
        const DVR_PORT = '34567';
        
        console.log(`🔍 Tentando captura via HTTP: ${DVR_IP}:${DVR_PORT}`);
        
        // URLs comuns de snapshot XMEye
        const urls = [
            `http://${DVR_IP}:${DVR_PORT}/cgi-bin/snapshot.cgi?chn=${channel}&u=${user}&p=${pass}`,
            `http://${DVR_IP}:${DVR_PORT}/snapshot.jpg?user=${user}&pwd=${pass}&chn=${channel}`,
            `http://${DVR_IP}:${DVR_PORT}/web/cgi-bin/hi3510/snap.cgi?&-getpic`,
            `http://${DVR_IP}/cgi-bin/snapshot.cgi?chn=${channel}`,
        ];
        
        for (const url of urls) {
            try {
                const response = await axios.get(url, {
                    responseType: 'arraybuffer',
                    timeout: 5000,
                    auth: user ? { username: user, password: pass } : undefined
                });
                
                if (response.data && response.data.length > 1000) {
                    console.log(`✅ Snapshot capturado via: ${url.substring(0, 50)}...`);
                    return Buffer.from(response.data);
                }
            } catch (err) {
                console.log(`⚠️  Falhou: ${url.substring(0, 50)}...`);
                continue;
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Erro HTTP:', error);
        return null;
    }
}

// ==========================================
// STATUS PERIÓDICO
// ==========================================

setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            action: 'status_update',
            cliente_id: CLIENTE_ID,
            info: getSystemInfo()
        }));
    }
}, 30000); // A cada 30 segundos

// ==========================================
// INICIAR AGENTE
// ==========================================

console.log('='.repeat(60));
console.log('🚀 ATRITELECOM AGENT v2.0.0');
console.log('='.repeat(60));
console.log(`Cliente ID: ${CLIENTE_ID}`);
console.log(`Servidor: ${SERVER_URL}`);
console.log('='.repeat(60));

connect();

// Mantém o processo rodando
process.on('SIGINT', () => {
    console.log('\n👋 Encerrando agente...');
    if (ws) ws.close();
    process.exit(0);
});
