# 🔑 AI Key & Credential Manager

Un módulo seguro, elegante y autónomo para la administración de credenciales y claves de API para servicios de Inteligencia Artificial (como Google Gemini / AI Studio).

## ✨ Características Principales

1. **Gestión en Tiempo Real:**
   * Sincronización instantánea con Firebase Realtime Database.
   * Carga y guardado con feedback visual (`react-toastify`).

2. **Enmascaramiento de Seguridad:**
   * Alterna entre modo contraseña (enmascarada) y texto plano con un solo clic para evitar filtraciones visuales en pantalla.

3. **Accesos Rápidos:**
   * Incluye enlaces directos a Google AI Studio para generar o recuperar nuevas credenciales.

---

## 🚀 Cómo integrarlo en tu Portafolio

### 1. Instalar Dependencias Requeridas
Ejecuta el siguiente comando en tu proyecto de portafolio:

```bash
npm install styled-components react-toastify firebase
```

### 2. Estructura de Archivos
Asegúrate de copiar los archivos en tu proyecto:
```text
src/
 └── components/
      └── AiKeyManager/
           └── ClavesAdmin.jsx
```

### 3. Configuración de Firebase
El componente utiliza Firebase Realtime Database para almacenar y recuperar la clave en la ruta `config/apiKeys/google_gemini`. Asegúrate de pasar tu instancia de Firebase (`firebaseApp`) como prop.

### 4. Uso en tu Aplicación
```jsx
import React from 'react';
import ClavesAdmin from './components/AiKeyManager/ClavesAdmin';

function PortfolioDemo() {
  return (
    <div style={{ padding: '40px' }}>
      <ClavesAdmin />
    </div>
  );
}

export default PortfolioDemo;
```
