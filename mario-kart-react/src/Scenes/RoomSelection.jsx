import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const mkwiiFontStyle = `
  @font-face {
    font-family: 'MKWii';
    src: url('/font/mkwiiFont.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const RoomSelection = ({ onCreateRoom, onJoinRoom, socket, setSelectedTrack }) => {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();

  // Ascolta room_state per controllare se il tracciato è già stato scelto
  React.useEffect(() => {
    if (socket) {
      const handleRoomState = (data) => {
        console.log('[RoomSelection] Received room_state:', data);
        
          navigate('/character');
      };
      
      socket.on('room_state', handleRoomState);
      return () => socket.off('room_state', handleRoomState);
    }
  }, [socket, navigate, setSelectedTrack]);

  const handleCreateRoom = () => {
    // Generate a random room code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    onCreateRoom(code);
    // Non navigare qui, aspetta room_state
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase());
      // Non navigare qui, aspetta room_state
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
      }}>
        <div style={{
          background: 'rgba(20, 20, 40, 0.95)',
          border: '6px solid #FFD700',
          borderRadius: '30px',
          padding: '50px 60px',
          minWidth: '500px',
          maxWidth: '700px',
          boxShadow: '0 15px 60px rgba(0, 0, 0, 0.8)',
        }}>
          {/* Title */}
          <h1 style={{
            fontFamily: 'MKWii, Arial, sans-serif',
            fontSize: '56px',
            color: '#FFD700',
            textAlign: 'center',
            marginBottom: '15px',
            textShadow: '4px 4px 8px rgba(0, 0, 0, 0.9)',
          }}>
            MARIO KART
          </h1>
          
          <h2 style={{
            fontFamily: 'MKWii, Arial, sans-serif',
            fontSize: '32px',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: '50px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          }}>
            Multiplayer Mode
          </h2>

          {!showJoinInput ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '25px',
            }}>
              {/* Create Room Button */}
              <button
                onClick={handleCreateRoom}
                style={{
                  padding: '25px 40px',
                  fontFamily: 'MKWii, Arial, sans-serif',
                  fontSize: '28px',
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
                🏁 CREATE ROOM
              </button>

              {/* Join Room Button */}
              <button
                onClick={() => setShowJoinInput(true)}
                style={{
                  padding: '25px 40px',
                  fontFamily: 'MKWii, Arial, sans-serif',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  background: 'linear-gradient(180deg, #0066CC 0%, #004499 100%)',
                  border: '4px solid #3399FF',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(51, 153, 255, 0.4)',
                  transition: 'all 0.2s',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 10px 30px rgba(51, 153, 255, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 6px 20px rgba(51, 153, 255, 0.4)';
                }}
              >
                🚪 JOIN ROOM
              </button>

              {/* Back Button */}
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '15px 30px',
                  fontFamily: 'MKWii, Arial, sans-serif',
                  fontSize: '20px',
                  color: '#CCCCCC',
                  background: 'rgba(100, 100, 100, 0.5)',
                  border: '2px solid #888888',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(120, 120, 120, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(100, 100, 100, 0.5)';
                }}
              >
                ← Back
              </button>
            </div>
          ) : (
            /* Join Room Input */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'MKWii, Arial, sans-serif',
                  fontSize: '20px',
                  color: '#FFFFFF',
                  marginBottom: '10px',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                }}>
                  Enter Room Code:
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontFamily: 'MKWii, Arial, sans-serif',
                    fontSize: '32px',
                    textAlign: 'center',
                    letterSpacing: '5px',
                    color: '#000000',
                    background: '#FFFFFF',
                    border: '4px solid #FFD700',
                    borderRadius: '10px',
                    outline: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                  autoFocus
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={!roomCode.trim()}
                style={{
                  padding: '20px 40px',
                  fontFamily: 'MKWii, Arial, sans-serif',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: roomCode.trim() ? '#FFFFFF' : '#888888',
                  background: roomCode.trim() 
                    ? 'linear-gradient(180deg, #0066CC 0%, #004499 100%)'
                    : 'linear-gradient(180deg, #555555 0%, #333333 100%)',
                  border: `4px solid ${roomCode.trim() ? '#3399FF' : '#666666'}`,
                  borderRadius: '15px',
                  cursor: roomCode.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: roomCode.trim() 
                    ? '0 6px 20px rgba(51, 153, 255, 0.4)'
                    : 'none',
                  transition: 'all 0.2s',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                }}
                onMouseEnter={(e) => {
                  if (roomCode.trim()) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 10px 30px rgba(51, 153, 255, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  if (roomCode.trim()) {
                    e.target.style.boxShadow = '0 6px 20px rgba(51, 153, 255, 0.4)';
                  }
                }}
              >
                JOIN
              </button>

              <button
                onClick={() => {
                  setShowJoinInput(false);
                  setRoomCode('');
                }}
                style={{
                  padding: '15px 30px',
                  fontFamily: 'MKWii, Arial, sans-serif',
                  fontSize: '18px',
                  color: '#CCCCCC',
                  background: 'rgba(100, 100, 100, 0.5)',
                  border: '2px solid #888888',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(120, 120, 120, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(100, 100, 100, 0.5)';
                }}
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
