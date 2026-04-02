import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, AlertCircle } from 'lucide-react';

const EditableImage = ({ 
  src, 
  alt, 
  onUploadSuccess, 
  isAdmin, 
  className = "", 
  storagePath = "uploads" 
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Debug log to console when isAdmin changes
  useEffect(() => {
    if (isAdmin) {
      console.log(`[EditableImage] Admin mode ACTIVE for: ${alt}`);
    }
  }, [isAdmin, alt]);

  const handleTriggerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploading) return;
    
    console.log("[EditableImage] Attempting to open file picker for:", alt);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("[EditableImage] fileInputRef is null!");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("[EditableImage] File selected:", file.name);
    setUploading(true);
    setError(null);
    
    try {
      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing in .env");
      }

      console.log("[EditableImage] Starting upload to Cloudinary...");
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', storagePath);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error al subir a Cloudinary');
      }

      const data = await response.json();
      console.log("[EditableImage] Success! New URL:", data.secure_url);
      onUploadSuccess(data.secure_url);
    } catch (error) {
      console.error("[EditableImage] Upload error details:", error);
      setError(error.message);
      alert("Error al subir la imagen: " + error.message);
    } finally {
      setUploading(false);
      // Reset input to allow selecting the same file again if needed
      if (e.target) e.target.value = '';
    }
  };

  // If NOT admin, just return the image with its styles
  if (!isAdmin) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <div 
      className={`group relative cursor-pointer overflow-hidden ring-offset-2 hover:ring-2 hover:ring-violet-500 transition-all ${className}`} 
      onClick={handleTriggerClick}
      title="Hacer clic para cambiar imagen"
    >
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className={`w-full h-full object-cover transition-all duration-500 ${uploading ? 'opacity-30 scale-95 blur-sm' : 'group-hover:scale-105 group-hover:opacity-80'}`} 
        />
      ) : (
        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-[inherit]">
           <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Sin Imagen</span>
        </div>
      )}
      
      <div className="absolute inset-0 flex items-center justify-center z-20">
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="text-violet-600 animate-spin w-10 h-10" />
            <span className="text-[10px] font-bold text-violet-600 uppercase tracking-tighter bg-white/80 px-2 py-1 rounded shadow-sm">Subiendo...</span>
          </div>
        ) : error ? (
          <div className="bg-rose-500 p-2 rounded-full shadow-lg">
            <AlertCircle className="text-white w-6 h-6" />
          </div>
        ) : (
          <div className="bg-white/90 dark:bg-zinc-900/90 p-4 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 border border-zinc-200 dark:border-zinc-700">
            <Camera className="text-zinc-900 dark:text-white w-6 h-6" />
          </div>
        )}
      </div>

      {/* Persistent admin indicator badge */}
      {!uploading && (
        <div className="absolute top-3 right-3 z-30 bg-violet-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md shadow-lg transform translate-y-[-20%] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
          Cambiar
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
        onClick={(e) => e.stopPropagation()} // Prevent double trigger
      />
    </div>
  );
};

export default EditableImage;
