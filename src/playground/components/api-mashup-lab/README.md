# 🧪 API Mashup Lab & Corporate Explorer

Este proyecto es una plataforma interactiva y avanzada de exploración de APIs corporativas y diseño de software asistido por Inteligencia Artificial (Google Gemini).

## ✨ Características Principales

1. **Explorador de APIs Corporativas (`ApisDashboard.jsx`):**
   * Permite ingresar el nombre de cualquier empresa (ej. Spotify, Uber, Slack).
   * La Inteligencia Artificial investiga y extrae automáticamente los endpoints públicos disponibles, su utilidad y estructura.
   * Gestión en tiempo real de tarjetas corporativas con capacidad de cargar más utilidades bajo demanda.

2. **Laboratorio de Mashups IA (`MashupLab.jsx`):**
   * Permite seleccionar múltiples empresas de la lista y abrir el entorno de laboratorio.
   * Asistente conversacional (Chat IA) para idear integraciones innovadoras (Mashups) entre las APIs seleccionadas.
   * **Generación en vivo de Diagramas de Arquitectura:** Utiliza `mermaid.js` para renderizar el diagrama de flujo y arquitectura técnica de la solución propuesta.
   * **Análisis de Viabilidad:** Genera gráficos de radar (`recharts`) evaluando el impacto, costo, innovación y escalabilidad del proyecto.
   * Descarga de planos y diagramas en PNG de alta resolución.

---

## 🚀 Cómo integrarlo en tu Portafolio

### 1. Instalar Dependencias Requeridas
Ejecuta el siguiente comando en tu proyecto de portafolio:

```bash
npm install styled-components framer-motion recharts mermaid react-toastify firebase
```

### 2. Estructura de Archivos
Asegúrate de copiar los archivos en tu proyecto:
```text
src/
 └── components/
      └── ApiMashupLab/
           ├── ApisDashboard.jsx
           └── MashupLab.jsx
```

### 3. Configuración de Firebase / IA
El componente utiliza funciones de nube de Firebase (`httpsCallable`) para comunicarse con Gemini AI y Firebase Realtime Database para almacenar el historial. Asegúrate de pasar o configurar tu instancia de Firebase (`app`) en tu proyecto. Si deseas ejecutarlo en modo maqueta (mock) para tu portafolio sin backend, puedes sustituir las llamadas a `httpsCallable` por datos de prueba estáticos.

### 4. Uso en tu Aplicación
```jsx
import React from 'react';
import ApisDashboard from './components/ApiMashupLab/ApisDashboard';

function PortfolioDemo() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <ApisDashboard />
    </div>
  );
}

export default PortfolioDemo;
```
