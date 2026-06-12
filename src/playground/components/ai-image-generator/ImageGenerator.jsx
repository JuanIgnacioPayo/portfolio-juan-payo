import React, { useState } from 'react';
import { Download, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../firebase';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Por favor ingresa una descripción para la imagen.');
      return;
    }
    setError('');
    setLoading(true);
    setImageUrl('');
    setDownloadUrl('');
    
    try {
      const functions = getFunctions(app);
      const generateFn = httpsCallable(functions, 'generateImageProxy');
      const response = await generateFn({ prompt: prompt.trim() });
      
      const imageUrlData = response.data.imageBase64;
      setImageUrl(imageUrlData);
      setDownloadUrl(imageUrlData);
      setLoading(false);
      
    } catch (err) {
      console.error("Error al generar:", err);
      setError("Error al generar la imagen. Verifica tu conexión o intenta con otra descripción.");
      setLoading(false);
    }
  };

  const handleImageLoad = (e) => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError("Error al cargar la imagen generada.");
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* Left Column: Controls */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-800 dark:text-white">
          <Sparkles className="w-6 h-6 text-violet-500" />
          Pollinations AI
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Describe la imagen que deseas crear con el mayor detalle posible. Esta IA gratuita generará una imagen única para ti al instante.
        </p>

        <div className="flex flex-col gap-2 mt-4">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tu Prompt (Descripción)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Un perro astronauta flotando en el espacio, estilo cyberpunk, hiperrealista..."
            className="w-full min-h-[120px] p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
          />
        </div>
        
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

        <button
          onClick={generateImage}
          disabled={loading}
          className="mt-2 w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <ImageIcon className="w-5 h-5" />
              Generar Imagen
            </>
          )}
        </button>
      </div>

      {/* Right Column: Preview */}
      <div className="w-full md:w-2/3 min-h-[400px] bg-zinc-100 dark:bg-zinc-800/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center overflow-hidden relative p-4">
        
        {/* Placeholder inicial (sin imagen y sin cargar) */}
        {!imageUrl && !loading && (
          <div className="text-zinc-400 dark:text-zinc-600 flex flex-col items-center gap-3">
            <ImageIcon className="w-16 h-16 opacity-50" />
            <p>La imagen generada aparecerá aquí</p>
          </div>
        )}

        {/* Spinner de carga (se muestra siempre que loading sea true) */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
            <p className="animate-pulse font-medium">Pintando tu obra maestra...</p>
          </div>
        )}

        {/* Contenedor de la imagen (se renderiza en el DOM para que dispare onLoad, pero se esconde si está cargando o hay error) */}
        {imageUrl && (
          <div className={`relative group w-full h-full flex items-center justify-center transition-opacity duration-500 ${(loading || error) ? 'opacity-0 hidden' : 'opacity-100'}`}>
            <img 
              src={imageUrl} 
              alt={prompt} 
              crossOrigin="anonymous"
              className="max-w-full max-h-[500px] object-contain rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              <a
                href={downloadUrl || imageUrl}
                download={`generada-${Date.now()}.jpg`}
                target="_blank"
                rel="noreferrer"
                className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all transform translate-y-4 group-hover:translate-y-0"
              >
                <Download className="w-5 h-5" />
                Abrir Tamaño Completo
              </a>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="text-zinc-600 dark:text-zinc-400 flex flex-col items-center justify-center gap-4 text-center p-6">
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800">
              <p className="font-semibold mb-2">¡Ups! Hubo un error de conexión</p>
              <p className="text-sm">El servidor de Inteligencia Artificial (Hugging Face) está muy ocupado en este momento o tardó demasiado en responder.</p>
            </div>
            <button
              onClick={generateImage}
              className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-white rounded-lg font-medium transition-colors"
            >
              Reintentar / Generar Nueva
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
