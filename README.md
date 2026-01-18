# Atritelecom Agent

Agente para monitoramento remoto de clientes.

## 📦 Compilar o Agente (.exe)

### Pré-requisitos
- Node.js 18+ instalado
- NPM

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Instalar pkg globalmente
npm install -g pkg

# 3. Compilar para Windows
npm run build
```

O executável será gerado em `dist/AtritelecomAgent.exe`

## 🚀 Instalação no Cliente

### Opção 1: Instalador Automático
1. Copie `AtritelecomAgent.exe` e `instalar.bat` para a máquina do cliente
2. Execute `instalar.bat` como Administrador
3. Digite o Cliente ID quando solicitado
4. Pronto! O agente será configurado para iniciar automaticamente

### Opção 2: Manual
```cmd
AtritelecomAgent.exe <cliente_id>
```

Exemplo:
```cmd
AtritelecomAgent.exe atritelecom
```

## 📁 Arquivos de Configuração

- **Config:** `%APPDATA%\AtritelecomAgent\config.json`
- **Log:** `%APPDATA%\AtritelecomAgent\agent.log`

## 🔧 Configuração

O arquivo `config.json`:
```json
{
  "cliente_id": "atritelecom",
  "server_url": "wss://saas-websocket.onrender.com"
}
```

## 📡 Comandos Suportados

O servidor pode enviar os seguintes comandos para o agente:

| Ação | Descrição |
|------|-----------|
| `get_info` | Retorna informações do sistema |
| `get_cameras` | Busca dispositivos na rede (ARP) |
| `exec` | Executa um comando no sistema |
| `ping` | Teste de conectividade |

## 🔒 Segurança

- O agente só aceita conexões do servidor configurado
- Comandos são logados localmente
- Execução de comandos pode ser desabilitada editando o código

## 📊 Informações Coletadas

- Hostname
- Sistema operacional
- Arquitetura (x64/x86)
- CPUs
- Memória total/livre
- Uptime
- Interfaces de rede (IP, MAC)

## 🐛 Troubleshooting

### Agente não conecta
1. Verifique se o servidor está online
2. Verifique firewall/antivírus
3. Confira o arquivo de log em `%APPDATA%\AtritelecomAgent\agent.log`

### Erro de SSL
O servidor usa HTTPS/WSS. Certifique-se de que a máquina tem os certificados atualizados.

## 📝 Logs

Para ver os logs em tempo real:
```cmd
type %APPDATA%\AtritelecomAgent\agent.log
```

Ou abra o arquivo:
```
%APPDATA%\AtritelecomAgent\agent.log
```
