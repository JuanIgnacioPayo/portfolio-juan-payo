import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, onValue, set, get, child } from "firebase/database";
import AgentConfig from './AgentConfig';

const ManagerContainer = styled.div`
  padding: 0 1rem 1rem 1rem;
  max-width: 1000px;
  margin: 0 auto;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SelectGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
  
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  min-width: 200px;
  max-width: 100%;
  flex: 1;
`;

const CreateButton = styled.button`
  background-color: var(--primaryColor, #1565c0);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    background-color: var(--primaryText, #0d47a1);
  }
`;

const NewAgentForm = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export default function AgentsManager({ isAgentOpen, setIsAgentOpen, collapseSignal, firebaseApp }) {
    const [agents, setAgents] = useState({});
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newAgentName, setNewAgentName] = useState('');

    const db = getDatabase(firebaseApp);

    useEffect(() => {
        const agentsRef = ref(db, 'config/agents');

        const unsubscribe = onValue(agentsRef, async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setAgents(data);

                if (selectedAgentId && !data[selectedAgentId]) {
                    setSelectedAgentId('');
                }
            } else {
                setAgents({});
                setSelectedAgentId('');
                await attemptMorenoMigration();
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, selectedAgentId]);

    const [agentStatus, setAgentStatus] = useState(null);

    useEffect(() => {
        if (!selectedAgentId) {
            setAgentStatus(null);
            return;
        }
        const statusRef = ref(db, `agentStatus/${selectedAgentId}/global`);
        const unsub = onValue(statusRef, (snapshot) => {
            if (snapshot.exists()) {
                setAgentStatus(snapshot.val());
            } else {
                setAgentStatus(null);
            }
        });
        return () => unsub();
    }, [db, selectedAgentId]);

    const getAgentStatusColor = () => {
        if (!agentStatus || !agentStatus.nextScheduled) return 'gray';
        const now = Date.now();
        if (now > agentStatus.nextScheduled + (15 * 60 * 1000)) return 'red';
        return 'green';
    };

    const formatDate = (ts) => {
        if (!ts) return "---";
        return new Date(ts).toLocaleString('es-AR', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
        });
    };

    const attemptMorenoMigration = async () => {
        try {
            const dbRef = ref(db);
            const morenoSettingsSnapshot = await get(child(dbRef, 'config/morenoSettings'));

            if (morenoSettingsSnapshot.exists()) {
                const morenoData = morenoSettingsSnapshot.val();

                const newAgentData = {
                    name: "Guillermo Moreno",
                    settings: {
                        ...morenoData,
                        description: "Economista y político argentino."
                    }
                };

                await set(ref(db, 'config/agents/guillermo_moreno'), newAgentData);
            }
        } catch (e) {
            console.error("Migration failed:", e);
        }
    };

    const handleCreateAgent = async () => {
        if (!newAgentName.trim()) return;

        const id = newAgentName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        if (agents[id]) {
            alert("Ya existe un agente con ese ID. Intenta otro nombre.");
            return;
        }

        try {
            await set(ref(db, `config/agents/${id}`), {
                name: newAgentName,
                settings: {
                    updateInterval: 24,
                    sources: []
                }
            });
            setNewAgentName('');
            setIsCreating(false);
            setSelectedAgentId(id);
        } catch (e) {
            console.error("Error creating agent:", e);
            alert("Error al crear agente.");
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando agentes...</div>;

    return (
        <ManagerContainer>
            <ControlsContainer>
                <SelectGroup>
                    <label style={{ fontWeight: 'bold' }}>Agente Activo:</label>
                    <Select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        disabled={Object.keys(agents).length === 0}
                    >
                        <option value="">-- Seleccionar Agente --</option>
                        {Object.keys(agents).map(key => (
                            <option key={key} value={key}>{agents[key].name} ({key})</option>
                        ))}
                    </Select>
                </SelectGroup>

                {!isCreating ? (
                    <CreateButton onClick={() => setIsCreating(true)}>+ Nuevo Agente</CreateButton>
                ) : (
                    <NewAgentForm>
                        <Input
                            type="text"
                            placeholder="Nombre del Agente"
                            value={newAgentName}
                            onChange={(e) => setNewAgentName(e.target.value)}
                            autoFocus
                        />
                        <CreateButton onClick={handleCreateAgent}>Crear</CreateButton>
                        <button
                            onClick={() => setIsCreating(false)}
                            style={{ padding: '0.5rem', border: '1px solid #ccc', background: 'white', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                    </NewAgentForm>
                )}
            </ControlsContainer>

            {selectedAgentId && agentStatus && (
                <StatusBanner
                    color={getAgentStatusColor()}
                    onClick={() => setIsAgentOpen(!isAgentOpen)}
                    style={{ cursor: 'pointer' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <div>
                            <strong>Estado de Agente:</strong>
                            <StatusDot color={getAgentStatusColor()} />
                            {getAgentStatusColor() === 'green' ? 'Operativo' : 'Manual'}
                            <span style={{ fontSize: '0.8rem', marginLeft: '10px', color: '#666' }}>
                                {isAgentOpen ? ' (Click para contraer)' : ' (Click para ver detalles)'}
                            </span>
                        </div>
                    </div>
                    {isAgentOpen && (
                        <div style={{ width: '100%', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9rem' }}>
                            Última: {formatDate(agentStatus.lastSuccess)} | Próxima: {formatDate(agentStatus.nextScheduled)}
                        </div>
                    )}
                </StatusBanner>
            )}

            {selectedAgentId && agents[selectedAgentId] ? (
                <AgentConfig
                    key={selectedAgentId}
                    agentId={selectedAgentId}
                    agentName={agents[selectedAgentId].name}
                    collapseSignal={collapseSignal}
                    firebaseApp={firebaseApp}
                />
            ) : (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
                    Selecciona o crea un agente para comenzar.
                </div>
            )}
        </ManagerContainer>
    );
}

const StatusBanner = styled.div`
    background: #f5f5f5;
    padding: 10px 15px;
    margin-bottom: 20px;
    border-radius: 8px;
    border-left: 5px solid ${props => props.color};
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
`;

const StatusDot = styled.span`
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${props => props.color};
    margin: 0 8px;
`;
