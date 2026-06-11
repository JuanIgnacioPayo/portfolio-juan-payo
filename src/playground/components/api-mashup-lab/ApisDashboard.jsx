import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDatabase, ref, onValue, set, push, remove } from 'firebase/database';
// NOTA PARA EL PORTAFOLIO: Asegúrate de importar tu configuración de Firebase correctamente:
// import { app } from '../../firebase/firebase';
import { toast } from 'react-toastify';
import MashupLab from './MashupLab';

const ApisDashboard = ({ firebaseApp }) => {
  const [companies, setCompanies] = useState([]);
  const [loadingMap, setLoadingMap] = useState({});

  // Inicializar DB usando la app de Firebase pasada por props o el default
  const db = getDatabase(firebaseApp);

  useEffect(() => {
    const companiesRef = ref(db, 'playground/apis');

    const unsubscribe = onValue(companiesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedCompanies = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setCompanies(loadedCompanies.reverse());
      } else {
        setCompanies([]);
      }
    }, (error) => {
      console.error("Firebase Read Error:", error);
      toast.error("Error al leer datos: " + error.message);
    });

    return () => unsubscribe();
  }, [db]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', description: '', apis: [] });
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAutoFill = async () => {
    if (!newCompany.name) {
      toast.error("Por favor ingresa un nombre de empresa primero.");
      return;
    }
    setIsAiLoading(true);
    try {
      const functions = getFunctions(firebaseApp);
      const researchCompanyApis = httpsCallable(functions, 'researchCompanyApis');
      const result = await researchCompanyApis({
        companyName: newCompany.name,
        excludedApis: []
      });

      const { description, apis } = result.data;

      const companiesRef = ref(db, 'playground/apis');
      const newCompanyRef = push(companiesRef);

      await set(newCompanyRef, {
        name: newCompany.name,
        description: description || "Sin descripción",
        apis: apis || [],
        createdAt: new Date().toISOString()
      });

      toast.success("¡Empresa investigada y guardada!");
      setNewCompany({ name: '', description: '', apis: [] });
      setIsModalOpen(false);

    } catch (error) {
      console.error("Error fetching AI data:", error);
      toast.error("Error al consultar la IA. Intenta de nuevo.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleLoadMore = async (company) => {
    const companyId = company.id;
    setLoadingMap(prev => ({ ...prev, [companyId]: true }));

    try {
      const functions = getFunctions(firebaseApp);
      const researchCompanyApis = httpsCallable(functions, 'researchCompanyApis');

      const currentApiNames = company.apis ? company.apis.map(a => a.name) : [];

      const result = await researchCompanyApis({
        companyName: company.name,
        excludedApis: currentApiNames
      });

      const newApis = result.data.apis || [];

      if (newApis.length === 0) {
        toast.info("No se encontraron nuevas APIs para esta empresa.");
      } else {
        const updatedApis = [...(company.apis || []), ...newApis];
        const companyApisRef = ref(db, `playground/apis/${companyId}/apis`);
        await set(companyApisRef, updatedApis);
        toast.success(`Se agregaron ${newApis.length} nuevas APIs.`);
      }

    } catch (error) {
      console.error("Error loading more APIs:", error);
      toast.error("Error al cargar más utilidades.");
    } finally {
      setLoadingMap(prev => ({ ...prev, [companyId]: false }));
    }
  };

  const handleDeleteCompany = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar esta empresa?")) {
      try {
        const companyRef = ref(db, `playground/apis/${id}`);
        await remove(companyRef);
        toast.success("Empresa eliminada");
      } catch (error) {
        console.error("Error deleting company:", error);
        toast.error("Error al eliminar");
      }
    }
  };

  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [showLab, setShowLab] = useState(false);

  const handleToggleSelect = (company) => {
    setSelectedCompanies(prev => {
      const isSelected = prev.some(c => c.id === company.id);
      if (isSelected) {
        return prev.filter(c => c.id !== company.id);
      } else {
        return [...prev, company];
      }
    });
  };

  if (showLab) {
    return (
      <Container>
        <MashupLab
          selectedCompanies={selectedCompanies}
          onClose={() => setShowLab(false)}
          firebaseApp={firebaseApp}
        />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Explorador de APIs Corporativas</Title>
        <AddButton onClick={() => setIsModalOpen(true)}>
          + Nueva Empresa
        </AddButton>
      </Header>

      <Grid>
        <AnimatePresence>
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              db={db}
              onDelete={handleDeleteCompany}
              onLoadMore={handleLoadMore}
              isLoading={loadingMap[company.id]}
              isSelected={selectedCompanies.some(c => c.id === company.id)}
              onToggleSelect={() => handleToggleSelect(company)}
            />
          ))}
        </AnimatePresence>
      </Grid>

      {selectedCompanies.length > 0 && (
        <FloatingLabButton
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={() => setShowLab(true)}
        >
          🧪 Ir al Laboratorio ({selectedCompanies.length})
        </FloatingLabButton>
      )}

      {isModalOpen && (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Agregar Nueva Empresa</ModalTitle>

            <InputGroup>
              <Label>Nombre de la Empresa</Label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Input
                  value={newCompany.name}
                  onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleAutoFill()}
                  placeholder="Ej. Spotify"
                  autoFocus
                />
                <AiButton
                  onClick={handleAutoFill}
                  disabled={isAiLoading || !newCompany.name}
                >
                  {isAiLoading ? '✨ Pensando...' : '🔍 Buscar y Guardar'}
                </AiButton>
              </div>
            </InputGroup>

            <p style={{ color: '#718096', fontSize: '0.9rem', marginTop: '-10px', marginBottom: '20px' }}>
              La IA investigará automáticamente las APIs y guardará la empresa.
            </p>

            <ActionButtons>
              <CancelBtn onClick={() => setIsModalOpen(false)}>Cancelar</CancelBtn>
            </ActionButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

// Sub-component for Collapsible API Items
const CollapsibleApiItem = ({ api }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
      style={{
        cursor: 'pointer',
        background: '#f7fafc',
        padding: '12px',
        borderRadius: '12px',
        borderLeft: '4px solid #764ba2',
        marginBottom: '10px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ApiName>{api.name}</ApiName>
        <span style={{ color: '#764ba2', fontWeight: 'bold', fontSize: '1.2rem' }}>{isOpen ? '−' : '+'}</span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ApiUtility style={{ marginTop: '10px' }}>{api.utility}</ApiUtility>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-component for Company Card
const CompanyCard = ({ company, db, onDelete, onLoadMore, isLoading, isSelected, onToggleSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(company.name);

  const handleUpdateName = async () => {
    if (editedName.trim() === company.name) {
      setIsEditing(false);
      return;
    }
    try {
      const companyNameRef = ref(db, `playground/apis/${company.id}/name`);
      await set(companyNameRef, editedName);
      toast.success("Nombre actualizado");
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Error al actualizar nombre");
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleUpdateName();
    if (e.key === 'Escape') {
      setEditedName(company.name);
      setIsEditing(false);
    }
  };

  return (
    <Card
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      style={{ cursor: isEditing ? 'default' : 'pointer' }}
    >
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <SelectCheckbox
            type="checkbox"
            checked={!!isSelected}
            onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
            onClick={(e) => e.stopPropagation()}
          />
          {isEditing ? (
            <EditInput
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleUpdateName}
              onKeyDown={handleKeyDown}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <CompanyName onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
              {company.name} <span style={{ fontSize: '1rem', color: '#a0aec0', fontWeight: 'normal' }}>({company.apis ? company.apis.length : 0})</span>
            </CompanyName>
          )}
        </div>
        <DeleteBtn onClick={(e) => { e.stopPropagation(); onDelete(company.id); }}>×</DeleteBtn>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '10px 0' }}>
              <CompanyDesc style={{ background: 'transparent' }}>{company.description}</CompanyDesc>

              <ApiList>
                {company.apis && company.apis.map((api, index) => (
                  <CollapsibleApiItem key={index} api={api} />
                ))}
              </ApiList>

              <LoadMoreButton
                onClick={() => onLoadMore(company)}
                disabled={isLoading}
              >
                {isLoading ? 'Buscando...' : 'Cargar más utilidades'}
              </LoadMoreButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isExpanded && (
        <p style={{ color: '#cbd5e0', fontSize: '0.8rem', margin: 0, textAlign: 'center' }}>
          Click para ver detalles
        </p>
      )}
    </Card>
  );
};

// Styled Components
const Container = styled.div`
  padding: 20px;
  background-color: var(--bg-color, #f8f9fa);
  min-height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: 2rem;
  color: #333;
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(118, 75, 162, 0.4);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const AiButton = styled.button`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
  border: none;
  padding: 0 20px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(255, 165, 0, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    filter: grayscale(0.5);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 15px;
`;

const CompanyName = styled.h3`
  margin: 0;
  font-size: 1.5rem;
  color: #2d3748;
`;

const DeleteBtn = styled.button`
  background: transparent;
  border: none;
  color: #cbd5e0;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  &:hover { color: #e53e3e; }
`;

const CompanyDesc = styled.p`
  color: #718096;
  font-size: 0.95rem;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const ApiList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ApiName = styled.div`
  font-weight: 700;
  color: #4a5568;
  font-size: 0.9rem;
  margin-bottom: 4px;
`;

const ApiUtility = styled.div`
  color: #718096;
  font-size: 0.85rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 25px;
  font-size: 1.6rem;
  color: #2d3748;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #4a5568;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s;
  &:focus { border-color: #667eea; outline: none; }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
`;

const CancelBtn = styled.button`
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: #718096;
  font-weight: 600;
  cursor: pointer;
  &:hover { color: #4a5568; }
`;

const EditInput = styled(Input)`
  padding: 5px;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2d3748;
  margin: -5px;
  width: auto;
  display: inline-block;
`;

const LoadMoreButton = styled.button`
  width: 100%;
  padding: 10px;
  margin-top: 15px;
  background: transparent;
  border: 2px dashed #cbd5e0;
  color: #718096;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: #667eea;
    color: #667eea;
    background: #f7fafc;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SelectCheckbox = styled.input`
  width: 20px;
  height: 20px;
  margin-right: 15px;
  accent-color: #764ba2;
  cursor: pointer;
`;

const FloatingLabButton = styled(motion.button)`
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, #FF6B6B 0%, #a766ea 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(255, 107, 107, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    transform: scale(1.05);
  }
`;

export default ApisDashboard;
