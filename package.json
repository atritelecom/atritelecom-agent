{
  "name": "atritelecom-agent",
  "version": "2.0.0",
  "description": "Agente de monitoramento com suporte a câmeras XMEye, Intelbras e IoT",
  "main": "agent.js",
  "scripts": {
    "start": "node agent.js",
    "build": "pkg agent.js --targets node18-win-x64 --output dist/AtritelecomAgent.exe"
  },
  "dependencies": {
    "ws": "^8.14.2",
    "axios": "^1.6.0",
    "node-xmeye": "^1.0.0"
  },
  "devDependencies": {
    "pkg": "^5.8.1"
  },
  "pkg": {
    "scripts": "agent.js",
    "targets": ["node18-win-x64"],
    "outputPath": "dist"
  }
}
