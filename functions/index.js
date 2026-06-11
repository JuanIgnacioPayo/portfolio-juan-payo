const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

exports.askAI = onCall({ cors: true }, async (request) => {
  const { prompt } = request.data || {};
  try {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt || "Hola");
    const text = result.response.text();
    return { response: text };
  } catch (error) {
    console.error("Error en askAI:", error);
    throw new HttpsError('internal', 'Error al procesar la solicitud de IA.');
  }
});

exports.generateMashupIdeas = onCall({ cors: true }, async (request) => {
  const { selectedCompanies, userPrompt } = request.data || {};
  try {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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

exports.researchCompanyApis = onCall({ cors: true }, async (request) => {
  const { companyName, excludedApis } = request.data || {};
  try {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

exports.generateMarketingPost = onCall({ cors: true }, async (request) => {
  const { imageUrl, instructions } = request.data || {};
  try {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

exports.getBillingAmount = onCall({ cors: true }, async (request) => {
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
      { sku: "Gemini 1.5 Flash Input", amount: "3.20", usage: "42.6", unit: "M tokens" },
      { sku: "Gemini 1.5 Flash Output", amount: "6.30", usage: "21.0", unit: "M tokens" }
    ]
  };
});
