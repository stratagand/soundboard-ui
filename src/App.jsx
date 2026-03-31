import { useEffect, useMemo, useState } from 'react';

import SOUND_LIST from './soundList.json';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const fetchJson = async (path, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  return response.json();
};

function App() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await fetchJson('/api/auth/status');
        setUser(data.user);
      } catch {
        setUser(null);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadGuilds = async () => {
      if (!user) return;
      try {
        const data = await fetchJson('/api/guilds');
        setGuilds(data.guilds || []);
      } catch (err) {
        setError('Unable to load guilds.');
      }
    };

    loadGuilds();
  }, [user]);

  useEffect(() => {
    const loadChannels = async () => {
      if (!selectedGuild) {
        setChannels([]);
        setSelectedChannel('');
        return;
      }
      try {
        const data = await fetchJson(`/api/guilds/${selectedGuild}/voice-channels`);
        setChannels(data.channels || []);
        setSelectedChannel(data.channels?.[0]?.id || '');
      } catch (err) {
        setError('Unable to load voice channels.');
      }
    };

    loadChannels();
  }, [selectedGuild]);

  const handleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/login`;
  };

  const handleLogout = async () => {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setGuilds([]);
      setChannels([]);
      setSelectedGuild('');
      setSelectedChannel('');
      setStatus('Logged out');
    } catch (err) {
      setError('Logout failed');
    }
  };

  const handlePlay = async (soundId) => {
    if (!selectedGuild || !selectedChannel) {
      setError('Select a guild and voice channel first.');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Sending sound request...');

    try {
      await fetchJson('/api/play', {
        method: 'POST',
        body: JSON.stringify({
          guildId: selectedGuild,
          channelId: selectedChannel,
          soundId
        })
      });
      setStatus(`Queued ${soundId} for playback.`);
    } catch (err) {
      setError(err.message || 'Play request failed.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!selectedGuild || !selectedChannel) {
      setError('Select a guild and voice channel first.');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Sending stop request...');

    try {
      const response = await fetchJson('/api/stop', {
        method: 'POST',
        body: JSON.stringify({
          guildId: selectedGuild,
          channelId: selectedChannel
        })
      });
      setStatus(response.message || 'Stopped playback.');
    } catch (err) {
      setError(err.message || 'Stop request failed.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const soundGroups = useMemo(() => {
    const groups = SOUND_LIST.reduce((groups, sound) => {
      if (!groups[sound.category]) {
        groups[sound.category] = [];
      }
      groups[sound.category].push(sound);
      return groups;
    }, {});

    Object.values(groups).forEach((sounds) => {
      sounds.sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
      );
    });

    return groups;
  }, []);

  const guildOptions = useMemo(
    () => guilds.map((guild) => ({ value: guild.id, label: guild.name })),
    [guilds]
  );

  return (
    <div className="layout">
      <header>
        <div>
          <h1>Stratagand's Discord Soundboard</h1>
          <p>Send sounds into a voice channel for servers you belong to.</p>
        </div>
        {user ? (
          <div className="user-panel">
            <span>{user.username}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button onClick={handleLogin}>Login with Discord</button>
        )}
      </header>

      <main>
        {!user ? (
          <section className="card">
            <h2>Get started</h2>
            <p>Login with Discord to see your available servers and voice channels.</p>
          </section>
        ) : (
          <>
            <section className="card">
              <h2>Choose destination</h2>
              <label>
                Server
                <select
                  value={selectedGuild}
                  onChange={(event) => setSelectedGuild(event.target.value)}
                >
                  <option value="">Select a server</option>
                  {guildOptions.map((guild) => (
                    <option key={guild.value} value={guild.value}>
                      {guild.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Voice channel
                <select
                  value={selectedChannel}
                  onChange={(event) => setSelectedChannel(event.target.value)}
                >
                  <option value="">Select a voice channel</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleStop}
                disabled={!selectedChannel || loading}
                style={{ marginTop: '18px' }}
              >
                Stop playback
              </button>
            </section>

            {Object.entries(soundGroups).map(([category, sounds]) => (
              <section key={category} className="card soundboard">
                <h2>{category}</h2>
                <div className="grid">
                  {sounds.map((sound) => (
                    <button
                      key={sound.id}
                      className="sound-button"
                      disabled={!selectedChannel || loading}
                      onClick={() => handlePlay(sound.id)}
                    >
                      {sound.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        {(status || error) && (
          <section className="card status-card">
            {status && <p className="status-text">{status}</p>}
            {error && <p className="error-text">{error}</p>}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
