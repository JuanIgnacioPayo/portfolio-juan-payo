import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const EditableImage = ({ 
  src, 
  alt, 
  onUploadSuccess, 
  isAdmin, 
  className = "", 
  storagePath = "uploads" 
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileRef = storageRef(storage, `${storagePath}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      onUploadSuccess(downloadURL);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error al subir la imagen: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isAdmin) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <div className={`group relative cursor-pointer ${className}`} onClick={() => !uploading && fileInputRef.current?.click()}>
      <img src={src} alt={alt} className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-30' : 'group-hover:opacity-75'}`} />
      
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-[inherit]">
        {uploading ? (
          <Loader2 className="text-white animate-spin w-10 h-10" />
        ) : (
          <div className="bg-white/90 p-3 rounded-full shadow-lg">
            <Camera className="text-zinc-900 w-6 h-6" />
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
    </div>
  );
};

export default EditableImage;
