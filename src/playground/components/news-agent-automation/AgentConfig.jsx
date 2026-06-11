import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, update, onValue, set } from "firebase/database";
import { getFunctions, httpsCallable } from "firebase/functions";

const Section = styled.section`
  padding: 0;
  width: 100%;
`;

const Container = styled.div`
  max-width: 1000px;
  position: relative;
  background-color: #f4f4f4;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  padding: 2rem;
  font-family: sans-serif;
  padding-bottom: 2rem;
`;

const Title = styled.h2`
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 50px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: bold;
  color: #555;
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  width: 100%;
`;

const Button = styled.button`
  padding: 12px 25px;
  background-color: ${props => props.disabled ? '#ccc' : '#1565c0'};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);

  &:hover {
    background-color: ${props => props.disabled ? '#ccc' : '#0d47a1'};
  }
`;

export default function AgentConfig({ agentId, agentName, collapseSignal, firebaseApp }) {
    const [config, setConfig] = useState({
        updateInterval: 24,
        description: '',
        personality: '',
        summaryLength: 200
    });
    const [agentSources, setAgentSources] = useState([]);
    const [newAgentSource, setNewAgentSource] = useState({ name: '', value: '', type: 'channel' });
    const [suggestedChannels, setSuggestedChannels] = useState([]);
    const [isSearchingChannels, setIsSearchingChannels] = useState(false);
    const [status, setStatus] = useState({ message: '', error: false });

    const db = getDatabase(firebaseApp);
    const functions = getFunctions(firebaseApp);
    const userInteracted = useRef(false);

    useEffect(() => {
        const agentConfigRef = ref(db, `config/agents/${agentId}/settings`);
        const unsubscribeAgentConfig = onValue(agentConfigRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setConfig(prev => ({
                    ...prev,
                    updateInterval: data.updateInterval ?? 24,
                    description: data.description || '',
                    personality: data.personality || '',
                    summaryLength: data.summaryLength || 200
                }));

                if (data.sources) {
                    setAgentSources(data.sources);
                }
            } else {
                setAgentSources([]);
            }
        });

        return () => unsubscribeAgentConfig();
    }, [db, agentId]);

    const saveAgentSettings = async (updates) => {
        try {
            await update(ref(db, `config/agents/${agentId}/settings`), updates);
            setStatus({ message: 'Configuración guardada.', error: false });
            setTimeout(() => setStatus({ message: '', error: false }), 2000);
        } catch (e) {
            console.error("Agent Persistence Error:", e);
            setStatus({ message: 'Error al guardar configuración.', error: true });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        userInteracted.current = true;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (!userInteracted.current) return;
        const timeoutId = setTimeout(() => {
            saveAgentSettings({
                updateInterval: parseInt(config.updateInterval),
                description: config.description,
                personality: config.personality,
                summaryLength: parseInt(config.summaryLength)
            });
            userInteracted.current = false;
        }, 1500);
        return () => clearTimeout(timeoutId);
    }, [config.updateInterval, config.description, config.personality, config.summaryLength]);

    const handleRemoveSource = (index) => {
        const updatedSources = agentSources.filter((_, i) => i !== index);
        setAgentSources(updatedSources);
        saveAgentSettings({ sources: updatedSources });
    };

    const handleAiChannelSearch = async () => {
        if (!newAgentSource.name.trim()) return;

        setIsSearchingChannels(true);
        setSuggestedChannels([]);
        setStatus({ message: "Buscando canales con IA...", error: false });

        try {
            const prompt = `encontrar canales de youtube para ${newAgentSource.name}`;
            const askAiFn = httpsCallable(functions, 'askAI');
            const result = await askAiFn({ prompt: prompt });

            let aiResponseChannels = [];
            try {
                let cleanResponse = result.data.response;
                const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
                if (jsonMatch) cleanResponse = jsonMatch[0];
                aiResponseChannels = JSON.parse(cleanResponse);
            } catch (e) {
                console.error("Error parsing JSON from AI:", e);
                setStatus({ message: "La IA no devolvió un formato válido.", error: true });
            }

            if (Array.isArray(aiResponseChannels)) {
                setSuggestedChannels(aiResponseChannels);
                setStatus({ message: `Se encontraron ${aiResponseChannels.length} canales sugeridos.`, error: false });
            }
        } catch (error) {
            console.error("AI Channel Search Error:", error);
            setStatus({ message: "Error al buscar canales.", error: true });
        } finally {
            setIsSearchingChannels(false);
        }
    };

    return (
        <Section>
            <Container>
                <Title>Configuración: {agentName}</Title>

                <Content>
                    <FormGroup>
                        <Label>Intervalo de Actualización (Horas):</Label>
                        <Input
                            type="number"
                            name="updateInterval"
                            value={config.updateInterval}
                            onChange={handleChange}
                            min="0"
                            max="72"
                        />
                        {parseInt(config.updateInterval) === 0 && (
                            <span style={{ color: '#d32f2f', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                ⚠️ Agente Desactivado (No generará costos)
                            </span>
                        )}
                    </FormGroup>

                    <FormGroup>
                        <Label>Personalidad del Agente:</Label>
                        <textarea
                            name="personality"
                            value={config.personality}
                            onChange={handleChange}
                            placeholder="Ej: Eres un analista financiero serio y conciso..."
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                                fontSize: '0.95rem',
                                minHeight: '100px',
                                width: '100%',
                                resize: 'vertical'
                            }}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Largo del Resumen (Palabras aprox):</Label>
                        <Input
                            type="number"
                            name="summaryLength"
                            value={config.summaryLength}
                            onChange={handleChange}
                            step="50"
                        />
                    </FormGroup>

                    <div style={{ marginTop: '20px', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                        <h3>Fuentes del Agente ({agentSources.length})</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {agentSources.map((source, index) => (
                                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                                    <span><strong>{source.name}</strong> ({source.type})</span>
                                    <button onClick={() => handleRemoveSource(index)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✕ Borrar</button>
                                </li>
                            ))}
                        </ul>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <Input
                                value={newAgentSource.name}
                                onChange={e => setNewAgentSource({ ...newAgentSource, name: e.target.value })}
                                placeholder="Nombre de canal o tema a buscar..."
                            />
                            <Button onClick={handleAiChannelSearch} disabled={isSearchingChannels || !newAgentSource.name}>
                                {isSearchingChannels ? 'Buscando...' : '🔍 Buscar con IA'}
                            </Button>
                        </div>

                        {suggestedChannels.length > 0 && (
                            <div style={{ marginTop: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '6px' }}>
                                <h4>Canales Sugeridos:</h4>
                                {suggestedChannels.map((c, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>
                                        <span>{c.name}</span>
                                        <button onClick={() => {
                                            const updated = [...agentSources, { name: c.name, value: c.channelId || c.name, type: 'channel' }];
                                            setAgentSources(updated);
                                            saveAgentSettings({ sources: updated });
                                            setSuggestedChannels(suggestedChannels.filter(item => item.name !== c.name));
                                        }}>+ Agregar</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {status.message && (
                        <div style={{ padding: '10px', textAlign: 'center', background: status.error ? '#ffebee' : '#e8f5e9', color: status.error ? '#c62828' : '#2e7d32', borderRadius: '6px' }}>
                            {status.message}
                        </div>
                    )}
                </Content>
            </Container>
        </Section>
    );
}
