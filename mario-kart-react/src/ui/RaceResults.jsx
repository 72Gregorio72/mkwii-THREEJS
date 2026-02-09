import React from 'react';

const mkwiiFontStyle = `
  @font-face {
    font-family: 'MKWii';
    src: url('/font/mkwiiFont.otf') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const RaceResults = ({ finishers }) => {
  if (!finishers || finishers.length === 0) return null;

  // Split finishers into two columns
  const leftColumn = finishers.slice(0, 6);
  const rightColumn = finishers.slice(6, 12);

  const renderFinisher = (finisher, index) => {
    const position = index + 1;
    let positionColor = '#FFD700'; // Gold for 1st
    if (position === 2) positionColor = '#C0C0C0'; // Silver
    else if (position === 3) positionColor = '#CD7F32'; // Bronze
    else positionColor = '#FFFFFF'; // White for others

    // Format the racer name
    let displayName = finisher.id;
    if (finisher.id === 'player') {
      displayName = 'YOU';
    } else if (finisher.id.startsWith('bot_')) {
      const botNumber = parseInt(finisher.id.split('_')[1]) + 1;
      displayName = `BOT ${botNumber}`;
    }

    return (
      <div key={finisher.id} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '10px 15px',
        borderRadius: '10px',
        border: finisher.id === 'player' ? '2px solid #00FF00' : '2px solid transparent',
        animation: 'fadeIn 0.3s ease-in',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{
            fontFamily: 'MKWii, Arial, sans-serif',
            fontSize: '24px',
            color: positionColor,
            fontWeight: 'bold',
            minWidth: '35px',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
          }}>
            {position}
          </span>
          <span style={{
            fontFamily: 'MKWii, Arial, sans-serif',
            fontSize: '20px',
            color: finisher.id === 'player' ? '#00FF00' : '#FFFFFF',
            fontWeight: finisher.id === 'player' ? 'bold' : 'normal',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
          }}>
            {displayName}
          </span>
        </div>
        {finisher.finishTime && (
          <span style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#CCCCCC',
          }}>
            {finisher.finishTime}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{mkwiiFontStyle}</style>
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.85)',
        border: '4px solid #FFD700',
        borderRadius: '20px',
        padding: '30px 40px',
        minWidth: '800px',
        maxWidth: '1000px',
        zIndex: 1000,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
      }}>
        <h2 style={{
          fontFamily: 'MKWii, Arial, sans-serif',
          fontSize: '32px',
          color: '#FFD700',
          textAlign: 'center',
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        }}>
          RACE RESULTS
        </h2>

        <div style={{
          display: 'flex',
          gap: '30px',
        }}>
          {/* Left Column */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {leftColumn.map((finisher, index) => renderFinisher(finisher, index))}
          </div>

          {/* Right Column */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {rightColumn.map((finisher, index) => renderFinisher(finisher, index + 6))}
          </div>
        </div>

        {finishers.length < 12 && (
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontFamily: 'MKWii, Arial, sans-serif',
            fontSize: '14px',
            color: '#AAAAAA',
          }}>
            Waiting for other racers...
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};
