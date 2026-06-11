import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getDatabase, ref, onValue, set } from "firebase/database";
import AgentsManager from "./AgentsManager";

export default function NoticiasAdmin({ firebaseApp }) {
    const [toggleState, setToggleState] = useState(1);
    const [status, setStatus] = useState(null);
    const [collapseSignal, setCollapseSignal] = useState(0);
    const [isNewsOpen, setIsNewsOpen] = useState(false);
    const [isAgentOpen, setIsAgentOpen] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [saveStatus, setSaveStatus] = useState("");

    const db = getDatabase(firebaseApp);

    const toggleTab = (index) => {
        setToggleState(index);
    };

    const triggerCollapseAll = () => {
        setIsNewsOpen(false);
        setIsAgentOpen(false);
        setCollapseSignal(prev => prev + 1);
    };

    useEffect(() => {
        const statusRef = ref(db, 'newsStatus/global');
        const unsub = onValue(statusRef, (snapshot) => {
            if (snapshot.exists()) {
                setStatus(snapshot.val());
            }
        });
        return () => unsub();
    }, [db]);

    useEffect(() => {
        const apiKeyRef = ref(db, 'config/apiKeys/gemini');
        const unsub = onValue(apiKeyRef, (snapshot) => {
            if (snapshot.exists() && snapshot.val()) {
                setApiKey(snapshot.val());
            } else {
                setApiKey("");
            }
        });
        return () => unsub();
    }, [db]);

    const handleSaveApiKey = async () => {
        try {
            await set(ref(db, 'config/apiKeys/gemini'), apiKey);
            setSaveStatus("¡Clave guardada exitosamente en la base de datos!");
            setTimeout(() => setSaveStatus(""), 3000);
        } catch (e) {
            console.error("Error saving API key:", e);
            setSaveStatus("Error al guardar la clave.");
        }
    };

    const handleCopyApiKey = () => {
        navigator.clipboard.writeText(apiKey);
        setSaveStatus("¡Clave copiada al portapapeles!");
        setTimeout(() => setSaveStatus(""), 2000);
    };

    const getStatusColor = () => {
        if (!status || !status.nextScheduled) return 'gray';
        const now = Date.now();
        if (now > status.nextScheduled + (15 * 60 * 1000)) return 'red';
        return 'green';
    };

    const formatDate = (ts) => {
        if (!ts) return "---";
        return new Date(ts).toLocaleString('es-AR', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
        });
    };

    return (
        <Section>
            <FloatingCollapseBtn onClick={triggerCollapseAll} title="Colapsar todo">
                ➖
            </FloatingCollapseBtn>

            <div className="container">
                <div className="bloc-tabs">
                    <ul className="header">
                        <li className={toggleState === 1 ? "tabs active-tabs" : "tabs"} onClick={() => toggleTab(1)}>
                            Gestión de noticias
                        </li>
                        <li className={toggleState === 2 ? "tabs active-tabs" : "tabs"} onClick={() => toggleTab(2)}>
                            Gestión de Agentes
                        </li>
                        <li className={toggleState === 3 ? "tabs active-tabs" : "tabs"} onClick={() => toggleTab(3)}>
                            🔑 Configuración IA
                        </li>
                    </ul>
                </div>

                <div className="content-tabs">
                    <div className={toggleState === 1 ? "content active-content" : "content"}>
                        {status && (
                            <StatusBanner color={getStatusColor()} onClick={() => setIsNewsOpen(!isNewsOpen)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <div>
                                        <strong>Estado de Actualización:</strong>
                                        <StatusDot color={getStatusColor()} />
                                        {getStatusColor() === 'green' ? 'Operativo' : 'Manual'}
                                        <span style={{ fontSize: '0.8rem', marginLeft: '10px', color: '#666' }}>
                                            {isNewsOpen ? ' (Click para contraer)' : ' (Click para ver detalles)'}
                                        </span>
                                    </div>
                                </div>

                                {isNewsOpen && (
                                    <div style={{ width: '100%', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9rem' }}>
                                        Última: {formatDate(status.lastSuccess)} | Próxima: {formatDate(status.nextScheduled)}
                                    </div>
                                )}
                            </StatusBanner>
                        )}
                        <div style={{ padding: '20px', background: 'white', borderRadius: '8px', border: '1px solid #eee' }}>
                            <h3>Configuración Global de Noticias</h3>
                            <p style={{ color: '#666' }}>Monitoreo de fuentes globales y feeds de la plataforma.</p>
                        </div>
                    </div>
                    <div className={toggleState === 2 ? "content active-content" : "content"}>
                        <AgentsManager
                            isAgentOpen={isAgentOpen}
                            setIsAgentOpen={setIsAgentOpen}
                            collapseSignal={collapseSignal}
                            firebaseApp={firebaseApp}
                        />
                    </div>
                    <div className={toggleState === 3 ? "content active-content" : "content"}>
                        <div style={{ padding: '25px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginTop: 0, color: '#1a365d', borderBottom: '2px solid #edf2f7', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>🔑</span> Configuración de Clave API (Google Gemini)
                            </h3>
                            <p style={{ color: '#4a5568', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '20px' }}>
                                Aquí puedes visualizar la clave API de Google Gemini actualmente activa en este entorno, copiarla para usarla en otros lugares, o modificarla de forma dinámica.
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px' }}>
                                <label style={{ fontWeight: '600', color: '#2d3748', fontSize: '0.9rem' }}>
                                    Clave API en uso:
                                </label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <input 
                                        type="text" 
                                        value={apiKey} 
                                        onChange={(e) => setApiKey(e.target.value)} 
                                        placeholder="AIzaSy..." 
                                        style={{ 
                                            flex: 1, 
                                            minWidth: '250px',
                                            padding: '12px', 
                                            border: '2px solid #cbd5e0', 
                                            borderRadius: '8px', 
                                            fontSize: '1rem', 
                                            fontFamily: 'monospace',
                                            color: '#2d3748',
                                            background: '#f7fafc',
                                            outline: 'none'
                                        }} 
                                    />
                                    <button 
                                        onClick={handleCopyApiKey} 
                                        title="Copiar Clave"
                                        style={{ 
                                            background: '#edf2f7', 
                                            border: '1px solid #cbd5e0', 
                                            borderRadius: '8px', 
                                            padding: '10px 15px', 
                                            cursor: 'pointer', 
                                            fontWeight: '600', 
                                            color: '#4a5568',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        📋 Copiar
                                    </button>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
                                    <button 
                                        onClick={handleSaveApiKey} 
                                        style={{ 
                                            background: '#1565c0', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '8px', 
                                            padding: '12px 25px', 
                                            cursor: 'pointer', 
                                            fontWeight: 'bold', 
                                            fontSize: '1rem',
                                            boxShadow: '0 4px 6px rgba(21, 101, 192, 0.2)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        💾 Guardar y Aplicar Clave
                                    </button>
                                </div>

                                {saveStatus && (
                                    <div style={{ 
                                        marginTop: '15px', 
                                        padding: '12px', 
                                        borderRadius: '8px', 
                                        background: saveStatus.includes('Error') ? '#fed7d7' : '#c6f6d5', 
                                        color: saveStatus.includes('Error') ? '#9b2c2c' : '#22543d', 
                                        fontWeight: '600', 
                                        textAlign: 'center' 
                                    }}>
                                        {saveStatus}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
}

const FloatingCollapseBtn = styled.button`
    position: fixed;
    top: 120px;
    right: 25px;
    width: 50px;
    background-color: var(--app-primary-text-color, #1565c0);
    color: white;
    padding: 0;
    width: 3.3rem;
    height: 3.3rem;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.2s ease-in-out;
    z-index: 9999;
    pointer-events: auto;
    box-shadow: 0px 1px 10px rgba(0,0,0,0.3);
    border: none;
    cursor: pointer;

    &:hover {
        transform: scale(1.1);
        background-color: #333;
    }
`;

const StatusBanner = styled.div`
    background: #f5f5f5;
    padding: 10px 15px;
    margin-bottom: 1rem;
    border-radius: 8px;
    border-left: 5px solid ${props => props.color};
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    cursor: pointer;
`;

const StatusDot = styled.span`
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${props => props.color};
    margin: 0 8px;
`;

const Section = styled.section`
  .container {
    padding-top: 60px;
    width: 100%;
    ul.header {
      display: flex;
      list-style: none;
      padding: 0;
      margin: 0;
      width: 100%;
      background: white;
      border-bottom: 1px solid #ccc;

      li {
        padding: 15px 25px;
        font-weight: bold;
        cursor: pointer;
        color: #555;

        &:hover, &.active-tabs {
          background: #f0f2f5;
          color: #1565c0;
          border-bottom: 3px solid #1565c0;
        }
      }
    }
  }

  .bloc-tabs {
    position: relative;
    z-index: 10;
  }

  .content-tabs {
    padding: 20px;
  }

  .content {
    display: none;
  }

  .active-content {
    display: block;
  }
`;
