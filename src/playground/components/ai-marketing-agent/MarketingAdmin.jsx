import React, { useState } from "react";
import styled from "styled-components";
import FacebookManager from "./Marketing/FacebookManager";
import InstagramManager from "./Marketing/InstagramManager";
import MarketingAgent from "./Marketing/MarketingAgent";

const PlatformContent = ({ platformName, platformId, initialPostData, onUseContent, firebaseApp }) => {
    if (platformId === 'facebook') {
        return <FacebookManager initialPostData={initialPostData} firebaseApp={firebaseApp} />;
    }
    if (platformId === 'instagram') {
        return <InstagramManager initialPostData={initialPostData} firebaseApp={firebaseApp} />;
    }
    if (platformId === 'agent') {
        return <MarketingAgent onUseContent={onUseContent} firebaseApp={firebaseApp} />;
    }

    return (
        <PlatformContainer>
            <PlatformHeader $platformId={platformId}>
                <h3>{platformName}</h3>
                <span>Panel de Control</span>
            </PlatformHeader>
            <div className="platform-body">
                <p>Herramientas para {platformName} próximamente...</p>
            </div>
        </PlatformContainer>
    );
};

export default function MarketingAdmin({ firebaseApp }) {
    const [toggleState, setToggleState] = useState(1);
    const [selectedPlatform, setSelectedPlatform] = useState('agent');
    const [generatedContent, setGeneratedContent] = useState(null);

    const toggleTab = (index) => {
        setToggleState(index);
    };

    const platforms = [
        { id: 'agent', name: '🤖 Agente IA' },
        { id: 'facebook', name: 'Facebook' },
        { id: 'instagram', name: 'Instagram' },
        { id: 'tiktok', name: 'Tik Tok' },
        { id: 'google_ads', name: 'Google Ads' }
    ];

    const handleUseContent = (content) => {
        setGeneratedContent(content);
        setSelectedPlatform('facebook');
        alert("¡Texto copiado! Redirigiendo a Facebook para publicar.");
    };

    return (
        <Section>
            <div className="container">
                <div className="content-tabs">
                    <div className={toggleState === 1 ? "content active-content" : "content"}>
                        <ControlsContainer>
                            <label>Seleccionar Plataforma:</label>
                            <StyledSelect
                                value={selectedPlatform}
                                onChange={(e) => {
                                    setSelectedPlatform(e.target.value);
                                    if (e.target.value === 'agent') setGeneratedContent(null);
                                }}
                            >
                                {platforms.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </StyledSelect>
                        </ControlsContainer>

                        <ContentArea>
                            <PlatformContent
                                platformName={platforms.find(p => p.id === selectedPlatform)?.name}
                                platformId={selectedPlatform}
                                initialPostData={generatedContent}
                                onUseContent={handleUseContent}
                                firebaseApp={firebaseApp}
                            />
                        </ContentArea>
                    </div>
                </div>
            </div>
        </Section>
    );
}

const ControlsContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);

    label {
        font-weight: 600;
        color: #555;
    }
`;

const StyledSelect = styled.select`
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #ddd;
    font-size: 1rem;
    background-color: white;
    min-width: 200px;
    cursor: pointer;
    
    &:focus {
        outline: none;
        border-color: var(--primary-color, #1565c0);
        box-shadow: 0 0 0 2px rgba(21, 101, 192, 0.1);
    }
`;

const ContentArea = styled.div`
    animation: fadeIn 0.3s ease-in;
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

const PlatformContainer = styled.div`
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    border: 1px solid #eee;

    .platform-body {
        padding: 2rem;
        min-height: 200px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #999;
        font-style: italic;
    }
`;

const PlatformHeader = styled.div`
    padding: 1.5rem;
    background: ${props => {
        switch (props.$platformId) {
            case 'facebook': return 'linear-gradient(135deg, #1877F2 0%, #166fe5 100%)';
            case 'instagram': return 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCAF45 100%)';
            case 'tiktok': return 'linear-gradient(135deg, #000000 0%, #25F4EE 100%)';
            case 'google_ads': return 'linear-gradient(135deg, #4285F4 0%, #34A853 33%, #FBBC05 66%, #EA4335 100%)';
            default: return '#eee';
        }
    }};
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    span {
        background: rgba(255,255,255,0.2);
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 0.8rem;
        backdrop-filter: blur(5px);
    }
`;

const Section = styled.section`
  .container {
    width: 100%;
  }

  .content {
    display: none;
  }

  .active-content {
    display: block;
  }
`;
