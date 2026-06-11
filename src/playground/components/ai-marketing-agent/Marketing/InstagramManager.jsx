import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const FB_APP_ID = "3162416383943679";

export default function InstagramManager({ firebaseApp }) {
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [user, setUser] = useState(null);
    const [igAccounts, setIgAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [captionText, setCaptionText] = useState("");
    const [publishing, setPublishing] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    const [mediaUrl, setMediaUrl] = useState(null);

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
        window.FB.api('/me', { fields: 'name,picture,accounts{name,picture,instagram_business_account}' }, function (response) {
            if (response && !response.error) {
                setUser({ name: response.name, picture: response.picture });

                if (response.accounts && response.accounts.data) {
                    const connectedAccounts = response.accounts.data
                        .filter(page => page.instagram_business_account)
                        .map(page => ({
                            pageName: page.name,
                            pageId: page.id,
                            accessToken: page.access_token,
                            id: page.instagram_business_account.id,
                            username: page.name + " (IG)"
                        }));

                    setIgAccounts(connectedAccounts);
                    if (connectedAccounts.length > 0) {
                        setSelectedAccount(connectedAccounts[0]);
                    }
                }
            } else {
                console.error("IG User Fetch Error:", response);
            }
        });
    };

    const handleLogin = () => {
        window.FB.login(function (response) {
            if (response.authResponse) {
                fetchUserData();
            }
        }, { scope: 'pages_show_list,instagram_basic,instagram_content_publish,pages_read_engagement' });
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
        if (!selectedAccount) return;
        if (!mediaFile && !mediaUrl) {
            setStatusMsg({ type: 'error', text: 'Instagram requiere una foto o video.' });
            return;
        }

        setPublishing(true);
        setStatusMsg(null);

        try {
            let downloadURL = mediaUrl;

            if (mediaFile) {
                const path = mediaType === 'video' ? 'instagram_videos' : 'instagram_uploads';
                const storageRef = ref(storage, `${path}/${Date.now()}_${mediaFile.name}`);
                const snapshot = await uploadBytes(storageRef, mediaFile);
                downloadURL = await getDownloadURL(snapshot.ref);
            }

            const containerParams = {
                caption: captionText,
                access_token: selectedAccount.accessToken
            };

            if (mediaType === 'video') {
                containerParams.media_type = 'REELS';
                containerParams.video_url = downloadURL;
            } else {
                containerParams.image_url = downloadURL;
            }

            if (selectedLocation) {
                containerParams.location_id = selectedLocation.id;
            }

            if (scheduledTime) {
                // containerParams.scheduled_publish_time = Math.floor(new Date(scheduledTime).getTime() / 1000);
            }

            window.FB.api(
                `/${selectedAccount.id}/media`,
                'POST',
                containerParams,
                function (response) {
                    if (!response || response.error) {
                        setPublishing(false);
                        console.error("IG Container Error:", response);
                        setStatusMsg({ type: 'error', text: 'Error creando contenedor: ' + (response?.error?.message || 'Desconocido') });
                        return;
                    }

                    const creationId = response.id;

                    const publishMedia = () => {
                        window.FB.api(
                            `/${selectedAccount.id}/media_publish`,
                            'POST',
                            { creation_id: creationId, access_token: selectedAccount.accessToken },
                            function (pubResponse) {
                                setPublishing(false);
                                if (!pubResponse || pubResponse.error) {
                                    console.error("IG Publish Error:", pubResponse);
                                    setStatusMsg({ type: 'error', text: 'Error publicando: ' + (pubResponse?.error?.message || 'Check logs') });
                                } else {
                                    setStatusMsg({ type: 'success', text: '¡Instagram publicado con éxito!' });
                                    setCaptionText("");
                                    removeMedia();
                                    setSelectedLocation(null);
                                }
                            }
                        );
                    };

                    if (mediaType === 'video') {
                        setStatusMsg({ type: 'info', text: 'Procesando video... (esperando 5s)' });
                        setTimeout(publishMedia, 5000);
                    } else {
                        publishMedia();
                    }
                }
            );

        } catch (error) {
            setPublishing(false);
            setStatusMsg({ type: 'error', text: 'Error en proceso: ' + error.message });
        }
    };

    if (!sdkLoaded) return <div>Cargando...</div>;

    return (
        <Container>
            {!user ? (
                <LoginSection>
                    <h3>Conectar con Instagram Business</h3>
                    <p>Necesitas tener tu cuenta de Instagram vinculada a tu página de Facebook.</p>
                    <LoginButton onClick={handleLogin}>
                        Conectar Instagram
                    </LoginButton>
                </LoginSection>
            ) : (
                <Dashboard>
                    <UserInfo>
                        <img src={user.picture?.data?.url} alt={user.name} />
                        <div>
                            <strong>{user.name}</strong>
                            {igAccounts.length > 0 ? (
                                <PageSelect value={selectedAccount?.id} onChange={(e) => setSelectedAccount(igAccounts.find(p => p.id === e.target.value))}>
                                    {igAccounts.map(p => <option key={p.id} value={p.id}>{p.pageName} (IG)</option>)}
                                </PageSelect>
                            ) : (
                                <div style={{ color: 'orange', fontSize: '0.9rem' }}>
                                    No tienes cuentas de Instagram Business vinculadas.
                                    <br />
                                    <small>Ve a Configuración de tu Página de FB -&gt; Cuentas vinculadas -&gt; Instagram.</small>
                                </div>
                            )}
                        </div>
                    </UserInfo>

                    {selectedAccount && (
                        <PostCreator>
                            <h4>Crear Post en Instagram</h4>

                            <textarea
                                placeholder="Escribe tu pie de foto..."
                                value={captionText}
                                onChange={(e) => setCaptionText(e.target.value)}
                                rows={4}
                            />

                            <OptionsGrid>
                                <div className="option-group">
                                    <label className="upload-btn">
                                        📷 Seleccionar Foto/Video (Requerido)
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                            </OptionsGrid>

                            <LocationSection>
                                {!selectedLocation ? (
                                    <div className="search-box">
                                        <input
                                            type="text"
                                            placeholder="📍 Ubicación (Instagram Place)"
                                            value={locationQuery}
                                            onChange={(e) => setLocationQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && searchPlaces()}
                                        />
                                        <button onClick={searchPlaces} disabled={searchingLocation}>
                                            🔍
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
                                <PostButton onClick={handlePost} disabled={publishing || !mediaFile}>
                                    {publishing ? "Publicando en IG..." : "Publicar en Instagram"}
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
    background: #fff;
    border: 1px solid #eee;
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
    
    h3 { 
        background: -webkit-linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
`;

const LoginButton = styled.button`
    background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    margin-top: 10px;
    transition: opacity 0.3s;
    &:hover { opacity: 0.9; }
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
    background: #fafafa;
    padding: 15px;
    border-radius: 8px;
    
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
    padding: 10px;
    h4 { margin-top: 0; color: #333; }
    
    textarea {
        width: 100%;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        resize: vertical;
        font-family: inherit;
        font-size: 1rem;
        margin-bottom: 15px;
        &:focus { outline: none; border-color: #bc1888; }
    }
`;

const OptionsGrid = styled.div`
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
`;

const PostButton = styled.button`
    background: ${props => props.disabled ? '#ccc' : 'linear-gradient(45deg, #405de6 0%, #5851db 100%)'};
    color: white;
    border: none;
    padding: 10px 30px;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
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
            background: #eee;
            border-radius: 4px;
            cursor: pointer;
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
        small { color: #666; margin-left: 5px; }
    }
`;

const SelectedLocation = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #fce4ec;
    color: #c2185b;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
    
    button {
        background: none;
        border: none;
        color: #c2185b;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
    }
`;
