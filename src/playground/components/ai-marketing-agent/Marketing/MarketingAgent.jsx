import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getStorage, ref, listAll, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function MarketingAgent({ onUseContent, firebaseApp }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [instructions, setInstructions] = useState("Crea un post promocional para esta imagen.");
    const [generating, setGenerating] = useState(null);
    const [generatedText, setGeneratedText] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const storage = getStorage(firebaseApp);
    const functions = getFunctions(firebaseApp);

    useEffect(() => {
        loadImages();
    }, [storage]);

    const loadImages = async () => {
        setLoading(true);
        try {
            const listRef = ref(storage, 'marketing_content_bank');
            const res = await listAll(listRef);
            const urls = await Promise.all(
                res.items.map(async (itemRef) => {
                    const url = await getDownloadURL(itemRef);
                    return { id: itemRef.name, url, ref: itemRef };
                })
            );
            setImages(urls);
        } catch (error) {
            if (error.code !== 'storage/unauthorized') {
                console.error("Error loading images:", error);
            }
        }
        setLoading(false);
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `marketing_content_bank/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            await loadImages();
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error al subir imagen.");
        }
        setUploading(false);
    };

    const handleDelete = async (image) => {
        if (!window.confirm("¿Seguro que quieres eliminar esta imagen?")) return;
        try {
            await deleteObject(image.ref);
            setImages(images.filter(img => img.id !== image.id));
            if (selectedImage?.id === image.id) {
                setSelectedImage(null);
                setGeneratedText(null);
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const handleGenerate = async (image) => {
        setGenerating(image.id);
        setSelectedImage(image);
        setGeneratedText(null);

        try {
            const generateFn = httpsCallable(functions, 'generateMarketingPost');
            const result = await generateFn({
                imageUrl: image.url,
                instructions: instructions
            });
            setGeneratedText(result.data.text);
        } catch (error) {
            console.error("Generation error:", error);
            alert("Error generando el post. Revisa la consola.");
        }
        setGenerating(null);
    };

    const handleUsePost = () => {
        if (onUseContent && selectedImage && generatedText) {
            onUseContent({
                text: generatedText,
                imageUrl: selectedImage.url,
                imageFile: null
            });
        }
    };

    return (
        <Container>
            <Header>
                <h3>🤖 Agente de Marketing IA</h3>
                <p>Gestiona tu banco de imágenes y deja que la IA redacte tus publicaciones.</p>
            </Header>

            <ConfigSection>
                <label>Instrucciones para el Agente:</label>
                <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={2}
                    placeholder="Ej: Destaca que tenemos aire acondicionado y buena música..."
                />
            </ConfigSection>

            <BankSection>
                <div className="header-row">
                    <h4>Banco de Imágenes</h4>
                    <label className="upload-btn">
                        {uploading ? "Subiendo..." : "+ Subir Imagen"}
                        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} hidden />
                    </label>
                </div>

                {loading ? <p>Cargando imágenes...</p> : (
                    <Grid>
                        {images.map(img => (
                            <Card key={img.id} $selected={selectedImage?.id === img.id}>
                                <div className="img-wrapper" onClick={() => setSelectedImage(img)}>
                                    <img src={img.url} alt="content" />
                                </div>
                                <div className="actions">
                                    <button
                                        onClick={() => handleGenerate(img)}
                                        disabled={generating === img.id}
                                        className="magic-btn"
                                    >
                                        {generating === img.id ? "✨ Pensando..." : "✨ Redactar"}
                                    </button>
                                    <button onClick={() => handleDelete(img)} className="delete-btn">🗑️</button>
                                </div>
                            </Card>
                        ))}
                    </Grid>
                )}
            </BankSection>

            {generatedText && selectedImage && (
                <ResultSection>
                    <h4>Propuesta Generada</h4>
                    <div className="preview">
                        <img src={selectedImage.url} alt="Selected" className="thumb" />
                        <textarea value={generatedText} onChange={(e) => setGeneratedText(e.target.value)} rows={6} />
                    </div>
                    <div className="actions">
                        <button onClick={handleUsePost} className="approve-btn">
                            🚀 Usar este Post
                        </button>
                    </div>
                </ResultSection>
            )}
        </Container>
    );
}

const Container = styled.div`
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
`;

const Header = styled.div`
    margin-bottom: 20px;
    h3 { margin: 0 0 5px 0; color: #2c3e50; }
    p { margin: 0; color: #7f8c8d; font-size: 0.9rem; }
`;

const ConfigSection = styled.div`
    background: white;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);

    label { display: block; font-weight: 600; margin-bottom: 5px; color: #34495e; }
    textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        resize: vertical;
    }
`;

const BankSection = styled.div`
    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .upload-btn {
        background: #3498db;
        color: white;
        padding: 8px 15px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        &:hover { background: #2980b9; }
    }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
`;

const Card = styled.div`
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: ${props => props.$selected ? '0 0 0 3px #3498db' : '0 1px 3px rgba(0,0,0,0.1)'};
    transition: transform 0.2s;
    
    &:hover { transform: translateY(-2px); }

    .img-wrapper {
        height: 120px;
        overflow: hidden;
        cursor: pointer;
        img { width: 100%; height: 100%; object-fit: cover; }
    }

    .actions {
        padding: 8px;
        display: flex;
        gap: 5px;
        
        button {
            flex: 1;
            border: none;
            padding: 5px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
        }

        .magic-btn {
            background: #e1f5fe;
            color: #0288d1;
            font-weight: bold;
            &:hover { background: #b3e5fc; }
        }

        .delete-btn {
            background: #ffebee;
            color: #c62828;
            flex: 0;
            &:hover { background: #ffcdd2; }
        }
    }
`;

const ResultSection = styled.div`
    margin-top: 30px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    border-left: 5px solid #3498db;

    h4 { margin-top: 0; }

    .preview {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
        
        .thumb {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 6px;
        }
        
        textarea {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
        }
    }

    .approve-btn {
        width: 100%;
        background: #27ae60;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1rem;
        &:hover { background: #219150; }
    }
`;
