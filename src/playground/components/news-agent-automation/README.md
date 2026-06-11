# 📰 AI News & Agents Automation

Un potente orquestador autónomo diseñado para la recopilación de noticias, procesamiento documental (PDFs) y administración de agentes de Inteligencia Artificial especializados (ej. Analistas Financieros, Monitores de Mercado).

## ✨ Características Principales

1. **Gestión de Noticias Globales (`NoticiasAdmin.jsx`):**
   * Panel de control general con monitoreo de estado operativo en tiempo real.
   * Sistema de banners con indicadores de color (verde/rojo) según la salud de las tareas programadas.

2. **Administrador de Agentes IA (`AgentsManager.jsx`):**
   * Creación y configuración dinámica de agentes autónomos.
   * Asignación de fuentes de datos multiplataforma (Canales de YouTube, PDFs locales/cloud, feeds de noticias).
   * Monitoreo de ejecución detallado con desglose de procesos exitosos y fallidos.

3. **Configuración de Agentes Individuales (`AgentConfig.jsx`):**
   * Ajuste de personalidad, longitud de resumen e intervalo de actualización.
   * Búsqueda inteligente de canales recomendados asistida por IA (Gemini).
   * Subida de archivos PDF y enlace de recursos web para alimentar el contexto del agente.

---

## 🚀 Cómo integrarlo en tu Portafolio

### 1. Instalar Dependencias Requeridas
Ejecuta el siguiente comando en tu proyecto de portafolio:

```bash
npm install styled-components firebase
```

### 2. Estructura de Archivos
Asegúrate de copiar los archivos en tu proyecto:
```text
src/
 └── components/
      └── AiNewsAgents/
           ├── NoticiasAdmin.jsx
           ├── AgentsManager.jsx
           ├── AgentConfig.jsx
           ├── NewsConfig.jsx
           └── BillingCard.jsx
```

### 3. Configuración de Firebase
El componente interactúa intensamente con Firebase Realtime Database para almacenar el estado de los agentes en rutas como `config/agents` y `agentStatus`. Asegúrate de proveer o importar tu aplicación de Firebase (`app`).

### 4. Uso en tu Aplicación
```jsx
import React from 'react';
import NoticiasAdmin from './components/AiNewsAgents/NoticiasAdmin';

function PortfolioDemo() {
  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      <NoticiasAdmin />
    </div>
  );
}

export default PortfolioDemo;
```
