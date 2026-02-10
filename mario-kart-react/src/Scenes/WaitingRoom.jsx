import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const mkwiiFontStyle = `
  @font-face {
    font-family: 'MKWii';
    src: url('/font/mkwiiFont.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const WaitingRoom = ({ roomCode, isHost, socket, selectedTrack, setSelectedTrack }) => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [trackInfo, setTrackInfo] = useState(selectedTrack);

  useEffect(() => {
    if (!socket || !roomCode) {
      navigate('/');
      return;
    }

    // Ascolta aggiornamenti dello stato della room
    const handleRoomState = (data) => {
      if (data.roomCode === roomCode) {
        setPlayers(data.players || []);
        
        // Se il tracciato cambia, aggiorna
        if (data.selectedTrack) {
          //console.log('[WaitingRoom] Track updated:', data.selectedTrack.name);
          const trackData = {
            ...data.selectedTrack,
            start_pos: data.selectedTrack.startPos || data.selectedTrack.start_pos || [0, 2, 0]
          };
          setTrackInfo(trackData);
          setSelectedTrack(trackData);
        }
      }
    };

    // Ascolta quando l'host preme Start Game
    const handleGameStarted = (data) => {
      if (data.roomCode === roomCode) {
        //console.log('[WaitingRoom] Game started! Going to game...');
        navigate('/game');
      }
    };

    // Ascolta quando l'host cambia tracciato
    const handleTrackSelected = (data) => {
      if (data.roomCode === roomCode) {
        //console.log('[WaitingRoom] Track changed by host:', data.track.name);
        const trackData = {
          ...data.track,
          start_pos: data.track.startPos || data.track.start_pos || [0, 2, 0]
        };
        setTrackInfo(trackData);
        setSelectedTrack(trackData);
      }
    };

    socket.on('room_state', handleRoomState);
    socket.on('game_started', handleGameStarted);
    socket.on('track_selected', handleTrackSelected);

    // Richiedi lo stato corrente della room
    socket.emit('request_room_state', { roomCode });

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('game_started', handleGameStarted);
      socket.off('track_selected', handleTrackSelected);
    };
  }, [socket, roomCode, navigate, setSelectedTrack]);

  const handleStartGame = () => {
    if (isHost && socket) {
      //console.log('[WaitingRoom] Host starting game...');
      socket.emit('start_game', { roomCode });
    }
  };

  const handleChangeTrack = () => {
    if (isHost) {
      navigate('/track');
    }
  };

  return (
    <>
      <style>{mkwiiFontStyle}</style>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#3dacf7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflow: 'auto',
      }}>
        <div style={{
          background: 'rgba(20, 20, 40, 0.95)',
          border: '6px solid #FFD700',
          borderRadius: '30px',
          padding: '30px 40px',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 15px 60px rgba(0, 0, 0, 0.8)',
        }}>
          {/* Title */}
          <h1 style={{
            fontFamily: 'MKWii, Arial, sans-serif',
            fontSize: '36px',
            color: '#FFD700',
            textAlign: 'center',
            marginBottom: '10px',
            textShadow: '4px 4px 8px rgba(0, 0, 0, 0.9)',
          }}>
            WAITING ROOM
          </h1>

          {/* Room Code */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            fontSize: '18px',
            color: '#FFFFFF',
            fontFamily: 'MKWii, Arial, sans-serif',
          }}>
            Room Code: <span style={{ 
              color: '#FFD700', 
              fontWeight: 'bold',
              letterSpacing: '3px'
            }}>{roomCode}</span>
          </div>

          {/* Selected Track */}
          {trackInfo && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '3px solid #FFD700',
              borderRadius: '15px',
              padding: '15px',
              marginBottom: '20px',
            }}>
              <h3 style={{
                fontFamily: 'MKWii, Arial, sans-serif',
                fontSize: '18px',
                color: '#FFD700',
                marginBottom: '8px',
                textAlign: 'center',
              }}>
                Selected Track
              </h3>
              <div style={{
                fontSize: '24px',
                color: '#FFFFFF',
                fontWeight: 'bold',
                textAlign: 'center',
                fontFamily: 'MKWii, Arial, sans-serif',
                marginBottom: '10px',
              }}>
                {trackInfo.name}
              </div>
              {trackInfo.preview && (
                <div style={{
                  width: '100%',
                  height: '150px',
                  backgroundImage: `url(${trackInfo.preview})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '10px',
                  border: '2px solid #FFD700',
                }} />
              )}
            </div>
          )}

          {/* Players List */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid #888',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '20px',
            maxHeight: '200px',
            overflow: 'auto',
          }}>
            <h3 style={{
              fontFamily: 'MKWii, Arial, sans-serif',
              fontSize: '16px',
              color: '#FFFFFF',
              marginBottom: '10px',
            }}>
              Players ({players.length})
            </h3>
            {players.map((player, index) => (
              <div key={player.id} style={{
                padding: '8px',
                marginBottom: '6px',
                background: player.isHost ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: player.isHost ? '2px solid #FFD700' : '1px solid #555',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#FFFFFF',
                fontFamily: 'MKWii, Arial, sans-serif',
                fontSize: '14px',
              }}>
                <span>
                  {player.isHost ? '👑' : '🏎️'} Player {index + 1}
                </span>
                {player.isHost && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#FFD700',
                    fontWeight: 'bold'
                  }}>
                    (HOST)
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Status / Buttons */}
          {isHost ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <button
                onClick={handleStartGame}
                style={{
                  padding: '15px 30px',
                  fontFamily: 'MKWii, Arial, sans-serif',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  background: 'linear-gradient(180deg, #00CC00 0%, #008800 100%)',
                  border: '4px solid #00FF00',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0, 255, 0, 0.4)',
                  transition: 'all 0.2s',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 10px 30px rgba(0, 255, 0, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 0, 0.4)';
                }}
              >
                🏁 START GAME
              </button>

              <button
                onClick={handleChangeTrack}
                style={{
                  padding: '12px 25px',
                  fontFamily: 'MKWii, Arial, sans-serif',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  background: 'linear-gradient(180deg, #0066CC 0%, #004499 100%)',
                  border: '3px solid #3399FF',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(51, 153, 255, 0.4)',
                  transition: 'all 0.2s',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                🔄 Change Track
              </button>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px',
            }}>
              <h2 style={{
                fontFamily: 'MKWii, Arial, sans-serif',
                fontSize: '20px',
                color: '#FFD700',
                marginBottom: '15px',
              }}>
                Waiting for host to start game...
              </h2>
              <div style={{
                width: '50px',
                height: '50px',
                border: '5px solid #FFD700',
                borderTop: '5px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }} />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
