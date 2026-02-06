import React from 'react';

const mkwiiFontStyle = `
  @font-face {
    font-family: 'MKWii';
    src: url('/font/mkwiiFont.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const LobbyScreen = ({ isHost, players, onStartRace, roomId }) => {
  return (
    <>
      <style>{mkwiiFontStyle}</style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}>
        <div style={{
          background: 'rgba(20, 20, 40, 0.95)',
          border: '4px solid #4169E1',
          borderRadius: '20px',
          padding: '40px 50px',
          minWidth: '500px',
          maxWidth: '700px',
          boxShadow: '0 10px 50px rgba(0, 0, 0, 0.8)',
        }}>
          {/* Title */}
          <h1 style={{
            fontFamily: 'MKWii, Arial, sans-serif',
            fontSize: '48px',
            color: '#FFD700',
            textAlign: 'center',
            marginBottom: '10px',
            textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8)',
          }}>
            RACE LOBBY
          </h1>

          {/* Room ID */}
          <div style={{
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#AAAAAA',
            marginBottom: '30px',
          }}>
            Room: {roomId || 'N/A'}
          </div>

          {/* Host indicator */}
          {isHost && (
            <div style={{
              background: 'rgba(255, 215, 0, 0.2)',
              border: '2px solid #FFD700',
              borderRadius: '10px',
              padding: '10px',
              marginBottom: '20px',
              textAlign: 'center',
            }}>
              <span style={{
                fontFamily: 'MKWii, Arial, sans-serif',
                fontSize: '20px',
                color: '#FFD700',
                fontWeight: 'bold',
              }}>
                👑 You are the HOST
              </span>
            </div>
          )}

          {/* Players list */}
          <div style={{
            marginBottom: '30px',
          }}>
            <h3 style={{
              fontFamily: 'MKWii, Arial, sans-serif',
              fontSize: '24px',
              color: '#FFFFFF',
              marginBottom: '15px',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            }}>
              Players ({players.length})
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {players.map((player, index) => (
                <div key={player.id} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '15px 20px',
                  borderRadius: '10px',
                  border: player.isHost ? '2px solid #FFD700' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                  }}>
                    <span style={{
                      fontFamily: 'MKWii, Arial, sans-serif',
                      fontSize: '20px',
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                    }}>
                      {index + 1}.
                    </span>
                    <span style={{
                      fontFamily: 'MKWii, Arial, sans-serif',
                      fontSize: '18px',
                      color: player.isHost ? '#FFD700' : '#FFFFFF',
                    }}>
                      Player {index + 1}
                      {player.isHost && ' 👑'}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px',
                    color: '#00FF00',
                  }}>
                    ● Ready
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting message or start button */}
          {isHost ? (
            <button
              onClick={onStartRace}
              style={{
                width: '100%',
                padding: '20px',
                fontFamily: 'MKWii, Arial, sans-serif',
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#FFFFFF',
                background: 'linear-gradient(180deg, #00CC00 0%, #008800 100%)',
                border: '3px solid #00FF00',
                borderRadius: '15px',
                cursor: 'pointer',
                boxShadow: '0 5px 15px rgba(0, 255, 0, 0.3)',
                transition: 'all 0.2s',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 8px 20px rgba(0, 255, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 5px 15px rgba(0, 255, 0, 0.3)';
              }}
            >
              START RACE
            </button>
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              background: 'rgba(255, 165, 0, 0.2)',
              border: '2px solid #FFA500',
              borderRadius: '10px',
            }}>
              <span style={{
                fontFamily: 'MKWii, Arial, sans-serif',
                fontSize: '20px',
                color: '#FFA500',
                fontWeight: 'bold',
              }}>
                ⏳ Waiting for host to start the race...
              </span>
            </div>
          )}

          {/* Info message */}
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#888888',
            fontStyle: 'italic',
          }}>
            {isHost 
              ? 'Click "START RACE" when everyone is ready'
              : 'The host will start the race soon'}
          </div>
        </div>
      </div>
    </>
  );
};
