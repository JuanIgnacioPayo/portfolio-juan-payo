import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import mermaid from 'mermaid';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDatabase, ref, push, onValue } from 'firebase/database';
// NOTA PARA EL PORTAFOLIO: Asegúrate de importar tu configuración de Firebase correctamente:
// import { app } from '../../firebase/firebase';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';

mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Outfit'
});

const MashupLab = ({ selectedCompanies, onClose, firebaseApp }) => {
  const [messages, setMessages] = useState([
    { type: 'ai', text: `¡Hola! Soy tu Arquitecto de Mashups. Veo que has seleccionado: **${selectedCompanies.map(c => c.name).join(", ")}**. ¿Qué tipo de integración te gustaría explorar hoy?` }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [visualData, setVisualData] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [savedProjects, setSavedProjects] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);

  const messagesEndRef = useRef(null);
  const db = getDatabase(firebaseApp);
  const functions = getFunctions(firebaseApp, 'us-central1');
  const generateMashupIdeas = httpsCallable(functions, 'generateMashupIdeas');

  useEffect(() => {
    const mashupsRef = ref(db, 'playground/mashups');
    const unsubscribe = onValue(mashupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, val]) => ({
          id: key,
          ...val
        })).reverse();
        setSavedProjects(list);
      }
    });
    return () => unsubscribe();
  }, [db]);

  const handleSaveProject = async () => {
    if (!visualData) return;
    try {
      const mashupsRef = ref(db, 'playground/mashups');
      await push(mashupsRef, {
        ...visualData,
        createdAt: Date.now(),
        companies: selectedCompanies.map(c => c.name)
      });
      toast.success("Proyecto guardado en el historial");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error al guardar");
    }
  };

  const handleLoadProject = (project) => {
    setVisualData(project);
    setActiveTab('chat');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = { type: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await generateMashupIdeas({
        selectedCompanies: selectedCompanies,
        userPrompt: userMsg.text
      });

      const data = response.data;

      const aiMsg = {
        type: 'ai',
        text: `He generado un plan para **"${data.title}"**. Puedes verlo en detalle en el panel derecho 👉`
      };

      setMessages(prev => [...prev, aiMsg]);
      setVisualData({
        title: data.title,
        description: data.description,
        benefits: data.key_benefits,
        mermaid: data.architecture_mermaid,
        chart: data.chart_data
      });

    } catch (error) {
      console.error("Error calling AI:", error);
      setMessages(prev => [...prev, { type: 'ai', text: "Lo siento, tuve un error al procesar tu solicitud. Por favor intenta de nuevo." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDownload = async (id) => {
    const elementId = id === 'chart' ? 'chart-container' : 'mermaid-container';
    const element = document.getElementById(elementId);

    if (!element) {
      toast.error("No se encontró el elemento para descargar");
      return;
    }

    try {
      toast.info("Generando imagen...");
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2
      });

      const link = document.createElement('a');
      link.download = `mashup-${id}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success("Imagen descargada");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Error al descargar imagen");
    }
  };

  const handleExpand = (id) => {
    setExpandedItem(id);
  };

  return (
    <LabContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Sidebar>
        <Header>
          <div style={{ display: 'flex', gap: '15px' }}>
            <TabButton $active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>💬 Chat</TabButton>
            <TabButton $active={activeTab === 'history'} onClick={() => setActiveTab('history')}>📚 Historial</TabButton>
          </div>
          <CloseBtn onClick={onClose}>Salir</CloseBtn>
        </Header>

        {activeTab === 'chat' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <ChatWindow>
              {messages.map((msg, idx) => (
                <Message key={idx} $isUser={msg.type === 'user'}>
                  <Bubble $isUser={msg.type === 'user'}>
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i} style={{ margin: '5px 0' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                    ))}
                  </Bubble>
                </Message>
              ))}
              {isTyping && <TypingIndicator>☁️ Diseñando solución...</TypingIndicator>}
              <div ref={messagesEndRef} />
            </ChatWindow>

            <InputSocket>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ej. Hazlo más enfocado a B2B..."
              />
              <SendBtn onClick={handleSendMessage} disabled={isTyping}>🚀</SendBtn>
            </InputSocket>
          </div>
        ) : (
          <HistoryList>
            {savedProjects.map(project => (
              <HistoryItem key={project.id} onClick={() => handleLoadProject(project)}>
                <h4 style={{ margin: '0 0 5px 0' }}>{project.title}</h4>
                <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </HistoryItem>
            ))}
            {savedProjects.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#cbd5e0' }}>No hay proyectos guardados.</p>}
          </HistoryList>
        )}
      </Sidebar>

      <VisualStage>
        {visualData ? (
          <StageContent key={visualData.title} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>

            <ProjectHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <ProjectTitle>{visualData.title}</ProjectTitle>
                  <ProjectDesc>{visualData.description}</ProjectDesc>
                </div>
                <SaveButton onClick={handleSaveProject} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  💾 Guardar
                </SaveButton>
              </div>
            </ProjectHeader>

            <DashboardGrid>
              <GridCard>
                <CardHeader>
                  <SectionTitle style={{ marginBottom: 0 }}>Estrategia & Beneficios</SectionTitle>
                  <ActionButtons>
                    <ActionBtn onClick={() => handleExpand('chart')}>🔍 Ver Grande</ActionBtn>
                    <ActionBtn onClick={() => handleDownload('chart')}>⬇️ Descargar</ActionBtn>
                  </ActionButtons>
                </CardHeader>

                <BenefitsList>
                  {visualData.benefits.map((benefit, i) => (
                    <BenefitItem key={i}>✅ {benefit}</BenefitItem>
                  ))}
                </BenefitsList>

                <div id="chart-container" style={{ height: '300px', width: '100%', marginTop: '30px', background: 'white', padding: '10px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={visualData.chart}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <PolarRadiusAxis />
                      <Radar name="Proyecto" dataKey="value" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GridCard>

              <GridCard style={{ flex: 1.5 }}>
                <CardHeader>
                  <SectionTitle style={{ marginBottom: 0 }}>Arquitectura Técnica</SectionTitle>
                  <ActionButtons>
                    <ActionBtn onClick={() => handleExpand('mermaid')}>🔍 Ver Grande</ActionBtn>
                    <ActionBtn onClick={() => handleDownload('mermaid')}>⬇️ Descargar</ActionBtn>
                  </ActionButtons>
                </CardHeader>
                <MermaidWrapper id="mermaid-container">
                  <MermaidDiagram chart={visualData.mermaid} />
                </MermaidWrapper>
              </GridCard>
            </DashboardGrid>

          </StageContent>
        ) : (
          <EmptyState>
            <Eyeball>🧬</Eyeball>
            <h3>Laboratorio de Integración</h3>
            <p>Selecciona APIs y pide una idea para generar el <b>BluePrint Técnico</b>.</p>
          </EmptyState>
        )}
      </VisualStage>

      <AnimatePresence>
        {expandedItem && (
          <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExpandedItem(null)}>
            <ModalContent onClick={e => e.stopPropagation()} initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <CloseModalBtn onClick={() => setExpandedItem(null)}>✕</CloseModalBtn>
              <h3>Vista Ampliada</h3>

              {expandedItem === 'chart' && (
                <div style={{ width: '100%', height: '500px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={visualData.chart}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" style={{ fontSize: '14px', fontWeight: 'bold' }} />
                      <PolarRadiusAxis />
                      <Radar name="Proyecto" dataKey="value" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {expandedItem === 'mermaid' && (
                <div style={{ overflow: 'auto', maxHeight: '70vh', padding: '20px' }}>
                  <MermaidDiagram chart={visualData.mermaid} />
                </div>
              )}
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </LabContainer>
  );
};

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const ModalContent = styled(motion.div)`
  background: white;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  border-radius: 20px;
  padding: 30px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const CloseModalBtn = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: #edf2f7;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 10;
  &:hover { background: #e2e8f0; }
`;

const MermaidDiagram = ({ chart }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && chart) {
      try {
        mermaid.contentLoaded();
        ref.current.removeAttribute('data-processed');
        mermaid.render(`mermaid-${Date.now()}`, chart).then(({ svg }) => {
          ref.current.innerHTML = svg;
        });
      } catch (e) {
        ref.current.innerHTML = "Error rendering diagram";
        console.error(e);
      }
    }
  }, [chart]);

  return <div ref={ref} style={{ overflowX: 'auto', textAlign: 'center', padding: '20px' }} />;
};

const LabContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  height: 90vh;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.1);
  margin-top: 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const Sidebar = styled.div`
  width: 100%;
  height: 35%;
  background: #f7fafc;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #e2e8f0;
`;

const Header = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  z-index: 10;
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: #718096;
  cursor: pointer;
  font-weight: 600;
  &:hover { color: #e53e3e; }
`;

const ChatWindow = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f7fafc;
`;

const Message = styled.div`
  display: flex;
  justify-content: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
`;

const Bubble = styled.div`
  background: ${props => props.$isUser ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
  color: ${props => props.$isUser ? 'white' : '#2d3748'};
  padding: 12px 18px;
  border-radius: 18px;
  border-bottom-right-radius: ${props => props.$isUser ? '4px' : '18px'};
  border-top-left-radius: ${props => props.$isUser ? '18px' : '4px'};
  max-width: 85%;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  font-size: 0.95rem;
  line-height: 1.5;
`;

const InputSocket = styled.div`
  padding: 15px 20px;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  &:focus { border-color: #667eea; }
`;

const SendBtn = styled.button`
  background: #2d3748;
  color: white;
  border: none;
  border-radius: 10px;
  width: 50px;
  cursor: pointer;
  font-size: 1.2rem;
  &:disabled { opacity: 0.5; }
`;

const VisualStage = styled.div`
  flex: 1;
  background: #f8f9fa;
  padding: 40px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const StageContent = styled(motion.div)`
  width: 100%;
  max-width: 1100px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  margin-bottom: 40px;
`;

const ProjectHeader = styled.div`
  margin-bottom: 40px;
  text-align: center;
  padding-bottom: 30px;
  border-bottom: 1px solid #edf2f7;
`;

const ProjectTitle = styled.h1`
  font-size: 3rem;
  color: #2d3748;
  margin: 0 0 15px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const ProjectDesc = styled.p`
  font-size: 1.25rem;
  color: #4a5568;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
`;

const DashboardGrid = styled.div`
  display: flex;
  gap: 30px;
  margin-top: 0;
  flex-wrap: wrap;
`;

const GridCard = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 25px;
  flex: 1;
  min-width: 350px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  position: relative;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionBtn = styled.button`
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 0.8rem;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #ebf4ff;
    color: #4299e1;
    border-color: #bee3f8;
  }
`;

const SectionTitle = styled.h3`
  color: #2d3748;
  margin-bottom: 20px;
  border-left: 4px solid #667eea;
  padding-left: 15px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #cbd5e0;
  text-align: center;
`;

const Eyeball = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
`;

const TypingIndicator = styled.div`
  color: #718096;
  font-style: italic;
  font-size: 0.9rem;
  margin-left: 10px;
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const BenefitItem = styled.li`
  padding: 8px 0;
  border-bottom: 1px solid #f7fafc;
  color: #4a5568;
  font-size: 0.95rem;
  &:last-child { border-bottom: none; }
`;

const MermaidWrapper = styled.div`
  background: white;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TabButton = styled.button`
  background: transparent;
  border: none;
  font-weight: 700;
  color: ${props => props.$active ? '#667eea' : '#cbd5e0'};
  border-bottom: 2px solid ${props => props.$active ? '#667eea' : 'transparent'};
  padding-bottom: 5px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { color: #667eea; }
`;

const HistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const HistoryItem = styled.div`
  background: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  border: 1px solid #edf2f7;
  transition: all 0.2s;
  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  }
`;

const SaveButton = styled(motion.button)`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 50px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(255, 165, 0, 0.3);
  white-space: nowrap;
`;

export default MashupLab;
