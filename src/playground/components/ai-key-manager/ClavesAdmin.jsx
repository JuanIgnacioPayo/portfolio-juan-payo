import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { toast } from 'react-toastify';

const ClavesAdmin = ({ firebaseApp }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const db = getDatabase(firebaseApp);

  useEffect(() => {
    const keyRef = ref(db, 'config/apiKeys/google_gemini');
    const unsubscribe = onValue(keyRef, (snapshot) => {
      if (snapshot.exists()) {
        setApiKey(snapshot.val());
      } else {
        setApiKey('');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error reading API key:", error);
      toast.error("Error al leer la clave API.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.warn("Por favor ingrese una clave válida.");
      return;
    }

    setSaving(true);
    try {
      const keyRef = ref(db, 'config/apiKeys/google_gemini');
      await set(keyRef, apiKey);
      toast.success("¡Clave API guardada correctamente!");
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error("Error al guardar la clave API: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Container>Cargando configuración...</Container>;

  return (
    <Container>
      <Header>
        <Title>Gestión de Claves API</Title>
        <SubTitle>Administra las credenciales para los servicios de IA de Gemini.</SubTitle>
      </Header>

      <Card>
        <Label>Google Gemini API Key</Label>
        <InputGroup>
          <Input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Ingresa tu clave API de Gemini aquí..."
          />
          <ToggleButton onClick={() => setShowKey(!showKey)}>
            {showKey ? "Ocultar" : "Mostrar"}
          </ToggleButton>
        </InputGroup>

        <HelperText>
          Esta clave habilita las funcionalidades de inteligencia artificial en el sistema,
          como el chatbot y el análisis de noticias.
          <br />
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
            Obtener una clave API de Google AI Studio
          </a>
        </HelperText>

        <SaveButton onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Clave'}
        </SaveButton>
      </Card>
    </Container>
  );
};

export default ClavesAdmin;

// Styled Components
const Container = styled.div`
  padding: 20px;
  background-color: var(--bg-color, #f8f9fa);
  min-height: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 30px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 2rem;
  color: #333;
  margin: 0 0 10px 0;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const SubTitle = styled.p`
  color: #718096;
  font-size: 1rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.05);
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 15px;
  font-size: 1.1rem;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const Input = styled.input`
  flex: 1;
  padding: 15px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s;
  font-family: monospace;
  
  &:focus { 
    border-color: #667eea; 
    outline: none; 
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const ToggleButton = styled.button`
  background: #edf2f7;
  color: #4a5568;
  border: none;
  padding: 0 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    background: #e2e8f0;
    color: #2d3748;
  }
`;

const HelperText = styled.div`
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 30px;
  line-height: 1.6;

  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const SaveButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(118, 75, 162, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(118, 75, 162, 0.5);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
