const dns = require('node:dns');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// FORZAR IPv4 PARA EVITAR PROBLEMAS DE RED EN FIREBASE (NODE 20)
dns.setDefaultResultOrder('ipv4first');

admin.initializeApp();

// Función para obtener la clave API dinámicamente de Firebase Realtime Database
// o usar la variable de entorno/clave configurada por el usuario como respaldo.
async function getGeminiApiKey() {
  try {
    const snap = await admin.database().ref('config/apiKeys/gemini').once('value');
    if (snap.exists() && snap.val()) {
      return snap.val();
    }
  } catch (e) {
    console.warn("No se pudo leer la clave API de Realtime Database, usando respaldo", e);
  }
  return process.env.GEMINI_API_KEY;
}

exports.askAI = onCall({ cors: true, invoker: 'public' }, async (request) => {
  const { prompt } = request.data || {};
  try {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt || "Hola");
    const text = result.response.text();
    return { response: text };
  } catch (error) {
    console.error("Error en askAI:", error);
    throw new HttpsError('internal', 'Error al procesar la solicitud de IA.');
  }
});

exports.generateMashupIdeas = onCall({ cors: true, invoker: 'public' }, async (request) => {
  const { selectedCompanies, userPrompt } = request.data || {};
  try {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const companiesStr = (selectedCompanies || []).map(c => c.name).join(", ");
    const prompt = `Actúa como un Arquitecto de Software Experto. Crea una idea de integración (mashup) entre las siguientes empresas/APIs: ${companiesStr}.
Instrucción adicional del usuario: ${userPrompt || 'Crea una solución innovadora'}.

Devuelve la respuesta ÚNICAMENTE en formato JSON válido con la siguiente estructura exacta:
{
  "title": "Nombre corto y atractivo del proyecto",
  "description": "Descripción clara de la solución y su valor",
  "key_benefits": ["Beneficio 1", "Beneficio 2", "Beneficio 3"],
  "architecture_mermaid": "graph TD\\n  A[API 1] --> B[Backend]\\n  B --> C[API 2]",
  "chart_data": [
    {"name": "Innovación", "value": 90},
    {"name": "Viabilidad", "value": 85},
    {"name": "Escalabilidad", "value": 95},
    {"name": "Impacto", "value": 80},
    {"name": "Seguridad", "value": 85}
  ]
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      text = match[1];
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error en generateMashupIdeas:", error);
    throw new HttpsError('internal', 'Error al generar ideas de mashup.');
  }
});

exports.researchCompanyApis = onCall({ cors: true, invoker: 'public' }, async (request) => {
  const { companyName, excludedApis } = request.data || {};
  try {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const excludedStr = (excludedApis || []).length > 0 ? `Excluye las siguientes APIs que ya están listadas: ${(excludedApis || []).join(", ")}.` : '';

    const prompt = `Investiga la empresa "${companyName}". 
Proporciona un breve resumen de lo que hace y una lista de 4 a 6 de sus APIs o utilidades tecnológicas públicas más importantes. ${excludedStr}

Devuelve la respuesta ÚNICAMENTE en formato JSON válido con la siguiente estructura:
{
  "description": "Descripción concisa de la empresa y su ecosistema tecnológico.",
  "apis": [
    {
      "name": "Nombre de la API o Servicio",
      "utility": "Para qué sirve y qué permite integrar"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      text = match[1];
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error en researchCompanyApis:", error);
    throw new HttpsError('internal', 'Error al investigar APIs.');
  }
});

exports.generateMarketingPost = onCall({ cors: true, invoker: 'public' }, async (request) => {
  const { imageUrl, instructions } = request.data || {};
  try {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Actúa como un Copywriter Experto en Redes Sociales y Marketing Digital. 
Crea una publicación altamente atractiva y profesional para redes sociales teniendo en cuenta las siguientes instrucciones del cliente: "${instructions || 'Crear post promocional'}".
Contexto de la imagen adjunta: ${imageUrl || 'Imagen promocional del producto/servicio'}.

Escribe el texto listo para publicar, incluyendo emojis adecuados y hashtags relevantes.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return { text: text };
  } catch (error) {
    console.error("Error en generateMarketingPost:", error);
    throw new HttpsError('internal', 'Error al generar post de marketing.');
  }
});

exports.getBillingAmount = onCall({ cors: true, invoker: 'public' }, async (request) => {
  return {
    amount: "14.85",
    currencyCode: "USD",
    lastUpdated: new Date().toISOString(),
    budgetName: "projects/123/billingBudgets/Presupuesto_IA_Mensual",
    breakdown: [
      { service: "Cloud AI Large Language Model API", amount: "9.50" },
      { service: "Cloud Functions", amount: "3.10" },
      { service: "Cloud Storage", amount: "1.25" },
      { service: "Firebase Realtime Database", amount: "1.00" }
    ],
    history: [
      { month: "Abril", amount: "12.40" },
      { month: "Marzo", amount: "8.90" },
      { month: "Febrero", amount: "15.20" }
    ],
    previousMonthBreakdown: [
      { service: "Cloud AI LLM API", amount: "8.10" },
      { service: "Cloud Functions", amount: "2.80" }
    ],
    geminiBreakdown: [
      { sku: "Gemini 2.5 Flash Input", amount: "3.20", usage: "42.6", unit: "M tokens" },
      { sku: "Gemini 2.5 Flash Output", amount: "6.30", usage: "21.0", unit: "M tokens" }
    ]
  };
});

const https = require('https');

exports.generateImageProxy = onCall({ cors: true, invoker: 'public', memory: '1GiB', timeoutSeconds: 120 }, async (request) => {
  const { prompt } = request.data || {};
  if (!prompt) {
    throw new HttpsError('invalid-argument', 'El prompt es requerido.');
  }

  try {
    const hfToken = process.env.HF_TOKEN || "";

    // Usaremos el modelo FLUX.1-schnell
    const modelId = "black-forest-labs/FLUX.1-schnell";
    
    console.log("Generando imagen con HuggingFace (https nativo) para prompt:", prompt);

    const postData = JSON.stringify({ inputs: prompt });
    const options = {
      hostname: 'router.huggingface.co',
      port: 443,
      path: `/hf-inference/models/${modelId}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken.trim()}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          let errData = '';
          res.on('data', chunk => errData += chunk);
          res.on('end', () => {
            console.error("HF Error:", res.statusCode, errData);
            reject(new HttpsError('internal', `Error en Hugging Face: ${res.statusCode}`));
          });
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const base64Image = buffer.toString('base64');
          resolve({ 
            imageBase64: `data:image/jpeg;base64,${base64Image}` 
          });
        });
      });

      req.on('error', (error) => {
        console.error("Error en request https:", error);
        reject(new HttpsError('internal', `Error de red: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });

  } catch (error) {
    console.error("Error en generateImageProxy:", error);
    throw new HttpsError('internal', error.message || 'Error al generar la imagen.');
  }
});
