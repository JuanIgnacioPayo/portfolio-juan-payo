# 📢 AI Omnichannel Marketing Agent

Un ecosistema modular y completo para la automatización de marketing digital con Inteligencia Artificial, integrando redacción publicitaria inteligente y publicación/programación en redes sociales (Facebook e Instagram).

## ✨ Características Principales

1. **Agente IA de Marketing (`MarketingAgent.jsx`):**
   * Banco de imágenes conectado a Firebase Storage.
   * Redacción automática de publicaciones y copys publicitarios usando Inteligencia Artificial (Gemini) basada en instrucciones personalizadas.
   * Flujo de un solo clic para transferir el contenido generado a las redes sociales.

2. **Panel de Facebook (`FacebookManager.jsx`):**
   * Conexión con Facebook SDK (Graph API).
   * Selector de Páginas de Facebook administradas por el usuario.
   * Publicación de fotos y videos con soporte para etiquetas de ubicación (Graph Search) y programación en el tiempo.

3. **Panel de Instagram (`InstagramManager.jsx`):**
   * Integración con Instagram Graph API para cuentas Business vinculadas.
   * Publicación directa de imágenes y Reels con soporte de geolocalización.

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
      └── AiMarketingAgent/
           ├── MarketingAdmin.jsx
           └── Marketing/
                ├── FacebookManager.jsx
                ├── InstagramManager.jsx
                └── MarketingAgent.jsx
```

### 3. Configuración de Facebook / Instagram SDK
Asegúrate de reemplazar la constante `FB_APP_ID` en `FacebookManager.jsx` e `InstagramManager.jsx` con el ID de tu aplicación de Facebook Developers.

### 4. Uso en tu Aplicación
```jsx
import React from 'react';
import MarketingAdmin from './components/AiMarketingAgent/MarketingAdmin';

function PortfolioDemo() {
  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      <MarketingAdmin />
    </div>
  );
}

export default PortfolioDemo;
```
