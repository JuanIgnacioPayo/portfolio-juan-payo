# 🚀 Portafolio de Proyectos - Exportación Limpia

Esta carpeta (`portfolio_projects_export`) contiene los componentes y mini-aplicaciones extraídos del entorno de **Playground / Admin** de *El Patio de Salcedo*, empaquetados de forma modular y autónoma para que puedas integrarlos fácilmente en tu **Portafolio Personal**.

Cada proyecto está listo para ser copiado y pegado en tu nuevo repositorio (ej. creado con Vite, Next.js o React clásico), e incluye sus dependencias, componentes y un README individual explicativo.

---

## 📂 Índice de Proyectos Extraídos

### 1. 🧪 [API Mashup Lab & Dashboard](./api-mashup-lab/README.md)
Una herramienta avanzada de exploración de APIs corporativas y diseño arquitectónico impulsado por Inteligencia Artificial (Gemini).
* **Características:** Búsqueda automatizada de endpoints corporativos con IA, chat de diseño arquitectónico, generación en vivo de diagramas de flujo con `mermaid.js` y análisis de viabilidad con gráficos de radar (`recharts`).
* **Tecnologías:** React, Framer Motion, Styled Components, Mermaid.js, Recharts, Firebase Functions.

### 2. 📊 [AI Billing & Cloud Cost Dashboard](./ai-billing-dashboard/README.md)
Un panel de control financiero inteligente para monitorear costos de Google Cloud Platform y estimar el consumo de tokens de modelos de lenguaje (LLMs).
* **Características:** Conexión a Cloud Billing / BigQuery, cálculo predictivo de gasto en base a logs locales de tokens (Gemini 1.5 Flash/Pro), desglose por SKU y gráficos de barras de tendencia diaria.
* **Tecnologías:** React, Styled Components, Recharts, Firebase App/RTDB/Functions.

### 3. 📢 [AI Omnichannel Marketing Agent](./ai-marketing-agent/README.md)
Sistema autónomo para la creación y gestión de campañas de marketing omnicanal en redes sociales.
* **Características:** Generación de copys persuasivos con IA, paneles de control modulares para Facebook e Instagram, previsualización de publicaciones y gestión de calendario.
* **Tecnologías:** React, Styled Components, Firebase.

### 4. 🔑 [AI Key & Credential Manager](./ai-key-manager/README.md)
Módulo seguro para la administración de credenciales y claves de API de servicios de Inteligencia Artificial.
* **Características:** Enmascaramiento de seguridad, sincronización en tiempo real con Firebase RTDB, validación de estado y enlaces directos a Google AI Studio.
* **Tecnologías:** React, Styled Components, Firebase RTDB.

---

## 🛠️ Instrucciones de Traspaso a tu Portafolio

1. **Copia la carpeta** del proyecto que desees (por ejemplo, `api-mashup-lab`) dentro de la carpeta `src/components/` de tu proyecto de portafolio.
2. **Instala las dependencias** requeridas listadas en el `README.md` de cada proyecto (por ejemplo, `npm install styled-components framer-motion recharts mermaid`).
3. **Importa y renderiza** el componente principal en tus vistas o tarjetas de demostración de proyectos.
