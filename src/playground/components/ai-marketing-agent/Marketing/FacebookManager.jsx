import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const FB_APP_ID = "3162416383943679";

export default function FacebookManager({ initialPostData, firebaseApp }) {
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [user, setUser] = useState(null);
    const [pages, setPages] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    const [postText, setPostText] = useState(initialPostData?.text || "");
    const [publishing, setPublishing] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(initialPostData?.imageUrl || null);
    const [mediaType, setMediaType] = useState(null);
    const [mediaUrl, setMediaUrl] = useState(initialPostData?.imageUrl || null);

    const [scheduledTime, setScheduledTime] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [locationResults, setLocationResults] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [searchingLocation, setSearchingLocation] = useState(false);

    const storage = getStorage(firebaseApp);

    useEffect(() => {
        const loadSdk = () => {
            if (window.FB) {
                setSdkLoaded(true);
                window.FB.init({
                    appId: FB_APP_ID,
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
                checkLoginStatus();
                return;
            }

            window.fbAsyncInit = function () {
                window.FB.init({
                    appId: FB_APP_ID,
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
                setSdkLoaded(true);
                checkLoginStatus();
            };

            (function (d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) { return; }
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/es_LA/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        };

        const checkLoginStatus = () => {
            window.FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    fetchUserData();
                }
            });
        };

        loadSdk();
    }, []);

    const fetchUserData = () => {
        window.FB.api('/me', { fields: 'name,picture' }, function (response) {
            setUser(response);
            fetchPages();
        });
    };

    const fetchPages = () => {
        window.FB.api('/me/accounts', function (response) {
            if (response && response.data) {
                setPages(response.data);
                if (response.data.length > 0) {
                    setSelectedPage(response.data[0]);
                }
            }
        });
    };

    const handleLogin = () => {
        window.FB.login(function (response) {
            if (response.authResponse) {
                fetchUserData();
            }
        }, { scope: 'pages_show_list,pages_manage_posts,pages_read_engagement' });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMediaFile(file);
            const isVideo = file.type.startsWith('video');
            setMediaType(isVideo ? 'video' : 'image');

            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
    };

    const searchPlaces = () => {
        if (!locationQuery) return;
        setSearchingLocation(true);
        window.FB.api(
            '/search',
            'GET',
            { type: 'place', q: locationQuery, fields: 'name,location' },
            function (response) {
                setSearchingLocation(false);
                if (response && response.data) {
                    setLocationResults(response.data);
                }
            }
        );
    };

    const selectLocation = (place) => {
        setSelectedLocation(place);
        setLocationResults([]);
        setLocationQuery("");
    };

    const handlePost = async () => {
        if (!selectedPage) return;
        if (!postText && !mediaFile) {
            setStatusMsg({ type: 'error', text: 'Escribe algo o sube contenido.' });
            return;
        }

        setPublishing(true);
        setStatusMsg(null);

        try {
            let payload = {
                access_token: selectedPage.access_token,
                message: postText || ""
            };

            if (selectedLocation) {
                payload.place = selectedLocation.id;
            }

            if (scheduledTime) {
                const unixTime = Math.floor(new Date(scheduledTime).getTime() / 1000);
                payload.published = false;
                payload.scheduled_publish_time = unixTime;
            }

            let apiEndpoint = `/${selectedPage.id}/feed`;

            if (mediaFile || mediaUrl) {
                let downloadURL = mediaUrl;

                if (mediaFile) {
                    const path = mediaType === 'video' ? 'facebook_videos' : 'facebook_uploads';
                    const storageRef = ref(storage, `${path}/${Date.now()}_${mediaFile.name}`);
                    const snapshot = await uploadBytes(storageRef, mediaFile);
                    downloadURL = await getDownloadURL(snapshot.ref);
                }

                if (mediaType === 'video') {
                    apiEndpoint = `/${selectedPage.id}/videos`;
                    payload.file_url = downloadURL;
                    payload.description = postText;
                } else {
                    apiEndpoint = `/${selectedPage.id}/photos`;
                    payload.url = downloadURL;
                    payload.caption = postText;
                    payload.message = postText;
                }
            }

            window.FB.api(
                apiEndpoint,
                'POST',
                payload,
                function (response) {
                    setPublishing(false);
                    if (!response || response.error) {
                        console.error("FB Error:", response);
                        setStatusMsg({ type: 'error', text: response?.error?.message || 'Error al publicar' });
                    } else {
                        const successText = scheduledTime
                            ? '¡Programado con éxito!'
                            : '¡Publicado con éxito!';
                        setStatusMsg({ type: 'success', text: successText });
                        setPostText("");
                        removeMedia();
                        setSelectedLocation(null);
                        setScheduledTime("");
                    }
                }
            );

        } catch (error) {
            setPublishing(false);
            console.error("Upload Error:", error);
            setStatusMsg({ type: 'error', text: 'Error interno: ' + error.message });
        }
    };

    if (!sdkLoaded) return <div>Cargando Facebook SDK...</div>;

    return (
        <Container>
            {!user ? (
                <LoginSection>
                    <h3>Conectar con Facebook</h3>
                    <p>Necesitamos permisos para publicar en tu página.</p>
                    <LoginButton onClick={handleLogin}>
                        Iniciar sesión con Facebook
                    </LoginButton>
                    {FB_APP_ID === "3162416383943679" && (
                        <Warning>⚠️ Falta configurar el APP ID en el código.</Warning>
                    )}
                </LoginSection>
            ) : (
                <Dashboard>
                    <UserInfo>
                        <img src={user.picture?.data?.url} alt={user.name} />
                        <div>
                            <strong>{user.name}</strong>
                            {pages.length > 0 ? (
                                <PageSelect value={selectedPage?.id} onChange={(e) => setSelectedPage(pages.find(p => p.id === e.target.value))}>
                                    {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </PageSelect>
                            ) : (
                                <span>No se encontraron páginas.</span>
                            )}
                        </div>
                    </UserInfo>

                    {selectedPage && (
                        <PostCreator>
                            <h4>Crear Publicación en {selectedPage.name}</h4>

                            <textarea
                                placeholder="¿Qué quieres contar hoy?"
                                value={postText}
                                onChange={(e) => setPostText(e.target.value)}
                                rows={4}
                            />

                            <OptionsGrid>
                                <div className="option-group">
                                    <label className="upload-btn">
                                        📷 Foto/Video
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>

                                <div className="option-group">
                                    <label>🕒 Programar:</label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>
                            </OptionsGrid>

                            <LocationSection>
                                {!selectedLocation ? (
                                    <div className="search-box">
                                        <input
                                            type="text"
                                            placeholder="📍 Agregar ubicación (ej: Buenos Aires)"
                                            value={locationQuery}
                                            onChange={(e) => setLocationQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && searchPlaces()}
                                        />
                                        <button onClick={searchPlaces} disabled={searchingLocation}>
                                            {searchingLocation ? '...' : 'Buscar'}
                                        </button>
                                    </div>
                                ) : (
                                    <SelectedLocation>
                                        <span>📍 {selectedLocation.name}</span>
                                        <button onClick={() => setSelectedLocation(null)}>✕</button>
                                    </SelectedLocation>
                                )}

                                {locationResults.length > 0 && (
                                    <ResultsList>
                                        {locationResults.map(place => (
                                            <li key={place.id} onClick={() => selectLocation(place)}>
                                                {place.name} <small>({place.location?.city})</small>
                                            </li>
                                        ))}
                                    </ResultsList>
                                )}
                            </LocationSection>

                            {mediaPreview && (
                                <PreviewContainer>
                                    {mediaType === 'video' ? (
                                        <video src={mediaPreview} controls />
                                    ) : (
                                        <img src={mediaPreview} alt="Preview" />
                                    )}
                                    <RemoveMediaButton onClick={removeMedia}>✕</RemoveMediaButton>
                                </PreviewContainer>
                            )}

                            <div className="actions">
                                <PostButton onClick={handlePost} disabled={publishing || (!postText && !mediaFile)}>
                                    {publishing ? (scheduledTime ? "Programando..." : "Publicando...") : (scheduledTime ? "Programar Publicación" : "Publicar Ahora")}
                                </PostButton>
                            </div>

                            {statusMsg && (
                                <StatusMessage $type={statusMsg.type}>
                                    {statusMsg.text}
                                </StatusMessage>
                            )}
                        </PostCreator>
                    )}
                </Dashboard>
            )}
        </Container>
    );
}

const Container = styled.div`
    padding: 20px;
    background: #f0f2f5;
    border-radius: 8px;
    min-height: 300px;
`;

const LoginSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    text-align: center;
`;

const LoginButton = styled.button`
    background-color: #1877f2;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    margin-top: 10px;
    &:hover { background-color: #166fe5; }
`;

const Warning = styled.div`
    margin-top: 20px;
    color: #856404;
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    padding: 10px;
    border-radius: 4px;
`;

const Dashboard = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const UserInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);

    img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
    }
`;

const PageSelect = styled.select`
    margin-left: 10px;
    padding: 5px;
    border-radius: 4px;
    border: 1px solid #ddd;
    display: block;
    margin-top: 5px;
`;

const PostCreator = styled.div`
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);

    h4 { margin-top: 0; color: #555; }

    textarea {
        width: 100%;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        resize: vertical;
        font-family: inherit;
        font-size: 1rem;
        margin-bottom: 15px;
        &:focus { outline: none; border-color: #1877f2; }
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-top: 20px;
    }

    .upload-btn {
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 6px;
        background: #e4e6eb;
        font-weight: 600;
        font-size: 0.9rem;
        display: inline-block;
        &:hover { background: #d8dadf; }
    }
`;

const OptionsGrid = styled.div`
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    flex-wrap: wrap;

    .option-group {
        display: flex;
        align-items: center;
        gap: 8px;
        
        input[type="datetime-local"] {
            padding: 5px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
    }
`;

const LocationSection = styled.div`
    margin-bottom: 15px;
    position: relative;

    .search-box {
        display: flex;
        gap: 10px;
        input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            padding: 8px 15px;
            border: none;
            background: #e4e6eb;
            border-radius: 4px;
            cursor: pointer;
            &:hover { background: #d8dadf; }
        }
    }
`;

const ResultsList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 5px 0 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    max-height: 150px;
    overflow-y: auto;
    position: absolute;
    width: 100%;
    background: white;
    z-index: 10;
    
    li {
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        &:last-child { border-bottom: none; }
        &:hover { background: #f0f2f5; }
        
        small {
            color: #666;
            margin-left: 5px;
        }
    }
`;

const SelectedLocation = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #e8f0fe;
    color: #1877f2;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
    
    button {
        background: none;
        border: none;
        color: #1877f2;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
    }
`;

const PostButton = styled.button`
    background-color: #1877f2;
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    opacity: ${props => props.disabled ? 0.6 : 1};
    &:not(:disabled):hover { background-color: #166fe5; }
`;

const StatusMessage = styled.div`
    margin-top: 15px;
    padding: 10px;
    border-radius: 6px;
    text-align: center;
    background-color: ${props => props.$type === 'error' ? '#fdecea' : '#e8f5e9'};
    color: ${props => props.$type === 'error' ? '#c62828' : '#2e7d32'};
`;

const PreviewContainer = styled.div`
    position: relative;
    margin-bottom: 15px;
    border-radius: 8px;
    overflow: hidden;
    background: #000;
    display: flex;
    justify-content: center;
    
    img, video {
        max-width: 100%;
        max-height: 400px;
        display: block;
    }
`;

const RemoveMediaButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
    
    &:hover { background: rgba(0,0,0,0.8); }
`;
