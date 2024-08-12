import React, { useState, useEffect, useRef } from 'react';

const FantasyBidApp = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [numGMs, setNumGMs] = useState(2);
  const [gmSetup, setGmSetup] = useState(Array(2).fill(''));
  const [budget, setBudget] = useState(200);
  const [spots, setSpots] = useState(13);
  const [gms, setGMs] = useState({});
  const [playerName, setPlayerName] = useState('');
  const [openingBid, setOpeningBid] = useState('');
  const [timerDuration, setTimerDuration] = useState(120);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [isBidding, setIsBidding] = useState(false);
  const [finalBid, setFinalBid] = useState('');
  const [selectedGM, setSelectedGM] = useState('');

  const audioRef = useRef(null);
  const isAudioPlayingRef = useRef(false);

  useEffect(() => {
    setGmSetup(Array(numGMs).fill(''));
  }, [numGMs]);

  useEffect(() => {
    let timer;
    if (isBidding && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 10 && newTime > 0 && !isAudioPlayingRef.current) {
            audioRef.current.play();
            isAudioPlayingRef.current = true;
          }
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsBidding(false);
      audioRef.current.pause();
      isAudioPlayingRef.current = false;
    }
    return () => clearInterval(timer);
  }, [isBidding, timeLeft]);

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    if (gmSetup.some(name => name.trim() === '')) {
      alert('Please enter names for all GMs');
      return;
    }
    const initialGMs = {};
    gmSetup.forEach(name => {
      initialGMs[name] = { players: [], spots: spots, budget: budget };
    });
    setGMs(initialGMs);
    setIsSetupComplete(true);
  };

  const handleGMNameChange = (index, name) => {
    setGmSetup(prevSetup => {
      const newSetup = [...prevSetup];
      newSetup[index] = name;
      return newSetup;
    });
  };

  const startBidding = () => {
    if (playerName && openingBid) {
      setTimeLeft(timerDuration);
      setIsBidding(true);
      isAudioPlayingRef.current = false;
    } else {
      alert('Please enter a player name and set an opening bid.');
    }
  };

  const resetToElevenSeconds = () => {
    setTimeLeft(10);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      isAudioPlayingRef.current = true;
    }
  };

  const completeBid = () => {
    if (finalBid && selectedGM) {
      const bidAmount = parseInt(finalBid);
      const gmData = gms[selectedGM];
      if (gmData.budget >= bidAmount && gmData.spots > 0) {
        if (bidAmount < gmData.spots) {
          alert('Bid amount must be at least $1 per remaining spot.');
          return;
        }
        setGMs(prevGMs => ({
          ...prevGMs,
          [selectedGM]: {
            players: [...prevGMs[selectedGM].players, { name: playerName, bid: bidAmount }],
            spots: prevGMs[selectedGM].spots - 1,
            budget: prevGMs[selectedGM].budget - bidAmount
          }
        }));
        setIsBidding(false);
        setPlayerName('');
        setOpeningBid('');
        setFinalBid('');
        setSelectedGM('');
        audioRef.current.pause();
        isAudioPlayingRef.current = false;
      } else if (gmData.spots === 0) {
        alert('This GM has no more roster spots available.');
      } else {
        alert('Insufficient budget for this bid.');
      }
    } else {
      alert('Please enter a final bid and select a GM.');
    }
  };

  const removePlayer = (gmName, playerIndex) => {
    setGMs(prevGMs => {
      const updatedGM = {...prevGMs[gmName]};
      const removedPlayer = updatedGM.players[playerIndex];
      updatedGM.players = updatedGM.players.filter((_, index) => index !== playerIndex);
      updatedGM.spots += 1;
      updatedGM.budget += removedPlayer.bid;
      return {...prevGMs, [gmName]: updatedGM};
    });
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "GM,Player,Bid\n";
    
    Object.entries(gms).forEach(([gm, data]) => {
      data.players.forEach(player => {
        csvContent += `${gm},${player.name},${player.bid}\n`;
      });
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fantasy_basketball_rosters.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isSetupComplete) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Fantasy Basketball Bid Setup</h1>
        <form onSubmit={handleSetupSubmit}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Draft Settings</h2>
            <div style={styles.inputGroup}>
              <label htmlFor="numGMs" style={styles.label}>Number of GMs:</label>
              <input
                type="number"
                id="numGMs"
                value={numGMs}
                onChange={(e) => setNumGMs(Math.max(2, parseInt(e.target.value) || 2))}
                style={styles.input}
                min="2"
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="budget" style={styles.label}>Budget per GM:</label>
              <input
                type="number"
                id="budget"
                value={budget}
                onChange={(e) => setBudget(Math.max(1, parseInt(e.target.value) || 1))}
                style={styles.input}
                min="1"
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="spots" style={styles.label}>Roster Spots per GM:</label>
              <input
                type="number"
                id="spots"
                value={spots}
                onChange={(e) => setSpots(Math.max(1, parseInt(e.target.value) || 1))}
                style={styles.input}
                min="1"
              />
            </div>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>GM Names</h2>
            {gmSetup.map((name, index) => (
              <div key={index} style={styles.inputGroup}>
                <label htmlFor={`gm${index}`} style={styles.label}>GM {index + 1} Name:</label>
                <input
                  type="text"
                  id={`gm${index}`}
                  value={name}
                  onChange={(e) => handleGMNameChange(index, e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            ))}
          </div>
          <button type="submit" style={styles.button}>Start Draft</button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Fantasy Basketball Bid</h1>
      
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Player Input</h2>
        <input
          type="text"
          placeholder="Enter player name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          style={styles.input}
        />
      </div>
      
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Bidding</h2>
        <input
          type="number"
          placeholder="Opening Bid"
          value={openingBid}
          onChange={(e) => setOpeningBid(e.target.value)}
          style={styles.input}
        />
        <select
          onChange={(e) => setTimerDuration(parseInt(e.target.value))}
          style={styles.select}
        >
          <option value="120">2 minutes</option>
          <option value="60">1 minute</option>
        </select>
        <button onClick={startBidding} style={styles.button}>Start Bidding</button>
      </div>
      
      {isBidding && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Timer</h2>
          <p style={styles.timerText}>{timeLeft} seconds</p>
          <button onClick={resetToElevenSeconds} style={styles.button}>+10 seconds</button>
        </div>
      )}
      
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Finalize Bid</h2>
        <input
          type="number"
          placeholder="Final Bid"
          value={finalBid}
          onChange={(e) => setFinalBid(e.target.value)}
          style={styles.input}
        />
        <select
          value={selectedGM}
          onChange={(e) => setSelectedGM(e.target.value)}
          style={styles.select}
        >
          <option value="">Select GM</option>
          {Object.keys(gms).map(gm => (
            <option key={gm} value={gm}>{gm}</option>
          ))}
        </select>
        <button onClick={completeBid} style={styles.button}>Complete Bid</button>
      </div>
      
      <button onClick={exportToCSV} style={styles.exportButton}>Export to CSV</button>
      
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>GM Rosters</h2>
        {Object.entries(gms).map(([gm, data]) => (
          <div key={gm} style={styles.gmRoster}>
            <h3 style={styles.gmTitle}>{gm} (Spots: {data.spots}, Budget: ${data.budget})</h3>
            <ul style={styles.playerList}>
              {data.players.map((player, index) => (
                <li key={index} style={styles.playerItem}>
                  <span>{player.name} - ${player.bid}</span>
                  <button 
                    onClick={() => removePlayer(gm, index)} 
                    style={styles.removeButton}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <audio ref={audioRef} src="/countdown.mp3" />
    </div>
  );
};

const styles = {
  container: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '30px',
    backgroundColor: '#1e1e2e',
    backgroundImage: 'linear-gradient(to bottom right, #1e1e2e, #2a2a3a)',
    borderRadius: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    color: '#fff',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '30px',
    textAlign: 'center',
    letterSpacing: '2px',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '15px',
    padding: '20px',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#10a37f',
    marginBottom: '15px',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#fff',
    fontSize: '16px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    transition: 'border-color 0.3s ease',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    marginBottom: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    appearance: 'none',
    transition: 'border-color 0.3s ease',
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#10a37f',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginBottom: '15px',
    transition: 'background-color 0.3s ease',
    fontWeight: '600',
  },
  exportButton: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'background-color 0.3s ease',
    fontWeight: '600',
  },
  timerText: {
    fontSize: '48px',
    fontWeight: '700',
    marginBottom: '15px',
    textAlign: 'center',
    color: '#10a37f',
  },
  gmRoster: {
    marginBottom: '20px',
  },
  gmTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '10px',
    color: '#10a37f',
    },
  playerList: {
    listStyleType: 'none',
    padding: '0',
  },
  playerItem: {
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#d32f2f',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '5px 10px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'background-color 0.3s ease',
  },
};

export default FantasyBidApp;