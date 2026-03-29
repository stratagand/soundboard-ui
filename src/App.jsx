import { useEffect, useMemo, useState } from 'react';

const SOUND_LIST = [
  { id: '2hourslater', label: '2 Hours Later' },
  { id: 'booty', label: 'Booty' },
  { id: 'burger', label: 'Burger' },
  { id: 'hellsbells', label: 'Hells Bells' },
  { id: 'ineedamonk', label: 'I Need A Monk' },
  { id: 'mikemikemike', label: 'Mike Mike Mike' },
  { id: 'natalie', label: 'Natalie' },
  { id: 'russell', label: 'Russell' },
  { id: 'whostheman', label: "Who's The Man" },
  { id: 'xgongiveittoya', label: 'Gonna Give It To Ya' }
];

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

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

  const guildOptions = useMemo(
    () => guilds.map((guild) => ({ value: guild.id, label: guild.name })),
    [guilds]
  );

  return (
    <div className="layout">
      <header>
        <div>
          <h1>Discord Soundboard</h1>
          <p>Send sounds into a voice channel for guilds you belong to.</p>
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
            <p>Login with Discord to see your available guilds and voice channels.</p>
          </section>
        ) : (
          <>
            <section className="card">
              <h2>Choose destination</h2>
              <label>
                Guild
                <select
                  value={selectedGuild}
                  onChange={(event) => setSelectedGuild(event.target.value)}
                >
                  <option value="">Select a guild</option>
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
            </section>

            <section className="card soundboard">
              <h2>Soundboard</h2>
              <div className="grid">
                {SOUND_LIST.map((sound) => (
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
