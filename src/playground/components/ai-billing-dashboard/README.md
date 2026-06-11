# 📊 AI Billing & Cloud Cost Dashboard

Este componente es un panel de control financiero en tiempo real diseñado para monitorear costos de infraestructura en Google Cloud Platform (GCP) y estimar con alta precisión el consumo de tokens y costos de modelos de lenguaje (como Gemini 1.5 Flash y Gemini 1.5 Pro) en base a telemetría local.

## ✨ Características Principales

1. **Integración con GCP & BigQuery:**
   * Se conecta a funciones de nube (`httpsCallable`) para consultar el consumo real facturado en Google Cloud Billing.
   * Desglose detallado por servicio de nube y por mes.

2. **Cálculo Predictivo de LLMs:**
   * Analiza registros locales (`usage_logs`) en Realtime Database para calcular la estimación de tokens de entrada (prompt) y salida (candidates).
   * Diferencia automáticamente los costos según el modelo utilizado (Pro vs Flash).

3. **Visualización de Tendencias Diarias:**
   * Renderiza gráficos de barras interactivos (`recharts`) mostrando la evolución del gasto día a día, destacando visualmente los días con costos elevados o estimados.

---

## 🚀 Cómo integrarlo en tu Portafolio

### 1. Instalar Dependencias Requeridas
Ejecuta el siguiente comando en tu proyecto de portafolio:

```bash
npm install styled-components recharts firebase
```

### 2. Estructura de Archivos
Asegúrate de copiar los archivos en tu proyecto:
```text
src/
 └── components/
      └── AiBillingDashboard/
           └── BillingCard.jsx
```

### 3. Configuración de Firebase / Mock
El componente espera una instancia de la aplicación de Firebase (vía `getApp()` o pasada por props) para consultar las bases de datos y cloud functions. Para mostrarlo en tu portafolio sin requerir acceso a GCP, puedes proveer datos de prueba (mocks) en el estado inicial de `costData` y `usageData`.

### 4. Uso en tu Aplicación
```jsx
import React from 'react';
import BillingCard from './components/AiBillingDashboard/BillingCard';

function PortfolioDemo() {
  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <BillingCard />
    </div>
  );
}

export default PortfolioDemo;
```
