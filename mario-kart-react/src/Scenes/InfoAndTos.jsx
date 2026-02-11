import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio, AUDIO_SFX } from '../audio/AudioManager.jsx'; 

export const InfoAndTos = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('tos'); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { playSfx } = useAudio();

  useEffect(() => {
    fetch('/api/info')
      .then((res) => {
        if (!res.ok) throw new Error('Network response');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const styles = {
    container: {
      width: '100vw', 
      height: '100vh', 
      position: 'absolute', 
      top: 0, 
      left: 0,
      background: `repeating-linear-gradient(0deg, #050505, #050505 2px, #111 2px, #111 4px)`,
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      fontFamily: 'sans-serif',
      color: 'white',
      userSelect: 'none'
    },
    header: {
      height: '8vh', 
      background: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      paddingLeft: '4vw',
      borderBottom: '0.6vh solid #aaddff', 
      borderBottomRightRadius: '50px', 
      width: '55%',
      fontSize: '4vh', 
      fontWeight: 'bold', 
      color: '#666', 
      fontStyle: 'italic', 
      zIndex: 10,
      boxShadow: '0 5px 10px rgba(0,0,0,0.5)',
      flexShrink: 0
    },
    content: {
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2vh 4vh',
      overflow: 'hidden' 
    },
    tabsContainer: {
        display: 'flex',
        gap: '20px',
        marginBottom: '2vh',
        width: '80%',
        maxWidth: '800px',
        justifyContent: 'center',
        flexShrink: 0
    },
    tabButton: (isActive, color) => ({
        flex: 1,
        padding: '1vh 1vw',
        fontSize: '2.5vh',
        fontWeight: 'bold',
        borderRadius: '50px',
        border: isActive ? `0.4vh solid ${color}` : '0.3vh solid #555',
        background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)',
        color: isActive ? color : '#888',
        cursor: 'pointer',
        textTransform: 'uppercase',
        boxShadow: isActive ? `0 0 15px ${color}` : 'none',
        transition: 'all 0.2s',
        textAlign: 'center'
    }),
    textBoxWrapper: {
        flex: 1, 
        width: '80%',
        maxWidth: '1000px',
        background: 'rgba(255,255,255,0.05)',
        border: '0.2vh solid #444',
        borderRadius: '1vh',
        padding: '3vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
    },
    titleBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderBottom: '1px solid #555',
        paddingBottom: '1vh',
        marginBottom: '1vh',
        flexShrink: 0
    },
    scrollableText: {
        flex: 1,
        overflowY: 'auto', 
        paddingRight: '10px',
        fontSize: '2.2vh',
        lineHeight: '1.6',
        color: '#ddd',
        whiteSpace: 'pre-line',
        textAlign: 'left'
    },
    footer: {
      height: '10vh', 
      display: 'flex', 
      justifyContent: 'center', // CENTERED
      alignItems: 'center',
      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
      flexShrink: 0,
      width: '100%'
    },
    backButton: {
      padding: '1vh 6vw', // Wider button
      fontSize: '2.5vh', 
      fontWeight: 'bold', 
      borderRadius: '50px',
      border: '0.3vh solid white', 
      cursor: 'pointer', 
      textTransform: 'uppercase',
      background: '#ccc', 
      color: '#333',
      boxShadow: '0 4px 5px rgba(0,0,0,0.5)',
      transition: 'transform 0.1s'
    }
  };

  if (loading) return (
    <div style={styles.container}>
        <div style={{...styles.header, width: '100%'}}>LOADING...</div>
    </div>
  );

  if (!data) return (
    <div style={styles.container}>
         <div style={{...styles.header, width: '100%', color: 'red'}}>ERROR CONNECTION</div>
    </div>
  );

  const currentContent = activeTab === 'tos' ? data.tos : data.privacy;
  const activeColor = activeTab === 'tos' ? '#22c55e' : '#00aeff'; 

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        Information Board
      </div>

      <div style={styles.content}>
        
        {/* Tabs */}
        <div style={styles.tabsContainer}>
            <button 
                style={styles.tabButton(activeTab === 'tos', '#22c55e')}
                onClick={() => {
                    setActiveTab('tos');
                    playSfx(AUDIO_SFX.MOVE_IN_MENU, 10);
                }}
            >
                🏁 Rules & TOS
            </button>
            <button 
                style={styles.tabButton(activeTab === 'privacy', '#00aeff')}
                onClick={() => {
                    setActiveTab('privacy');
                    playSfx(AUDIO_SFX.MOVE_IN_MENU, 10);
                }}
            >
                🛡️ Privacy
            </button>
        </div>

        {/* Text Content */}
        <div style={styles.textBoxWrapper}>
            <div style={styles.titleBar}>
                <span style={{fontSize: '3vh', color: '#ffe600', fontWeight: 'bold'}}>
                    {currentContent.title}
                </span>
                <span style={{fontSize: '1.5vh', color: '#888', fontFamily: 'monospace'}}>
                    Updated: {currentContent.lastUpdated}
                </span>
            </div>
            
            <div className="custom-scrollbar" style={styles.scrollableText}>
                {currentContent.content}
            </div>
        </div>
      </div>

      <div style={styles.footer}>
        <button 
            style={styles.backButton}
            onClick={() => {
                playSfx(AUDIO_SFX.BACK, 10);
                navigate(-1);
            }} 
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
            Back
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.3);
            border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${activeColor};
            border-radius: 5px;
            border: 2px solid rgba(0,0,0,0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: white;
        }
      `}</style>
    </div>
  );
};

export default InfoAndTos;