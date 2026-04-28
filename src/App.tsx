import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { Sky, PointerLockControls, Stars } from "@react-three/drei";
import socket from "./lib/socket";
import { Arena } from "./components/game/Arena";
import { Player } from "./components/game/Player";
import { RemotePlayer } from "./components/game/RemotePlayer";
import { Drone } from "./components/game/Drone";
import { Laser } from "./components/game/Laser";
import { HUD } from "./components/game/HUD";

interface LaserShot {
  id: string;
  origin: number[];
  direction: number[];
}

export default function App() {
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [drones, setDrones] = useState<Record<string, any>>({});
  const [myId, setMyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("LOBBY");
  const [lasers, setLasers] = useState<LaserShot[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    socket.on("init", (data) => {
      setPlayers(data.players);
      setDrones(data.drones || {});
      setMyId(data.id);
    });

    socket.on("player:joined", (player) => {
      setPlayers((prev) => ({ ...prev, [player.id]: player }));
    });

    socket.on("player:moved", (data) => {
      setPlayers((prev) => {
        if (!prev[data.id]) return prev;
        return {
          ...prev,
          [data.id]: {
            ...prev[data.id],
            position: data.position,
            rotation: data.rotation,
          },
        };
      });
    });

    socket.on("player:hit", (data) => {
      setPlayers((prev) => {
        if (!prev[data.id]) return prev;
        return {
          ...prev,
          [data.id]: {
            ...prev[data.id],
            health: data.health,
          },
        };
      });
    });

    socket.on("player:respawned", (data) => {
      setPlayers((prev) => {
        const next = { ...prev };
        if (next[data.id]) {
          next[data.id].health = 100;
          next[data.id].position = data.position;
        }
        if (next[data.killerId]) {
          next[data.killerId].score = data.killerScore;
        }
        return next;
      });
    });

    socket.on("drone:hit", (data) => {
      setDrones(prev => ({
        ...prev,
        [data.id]: { ...prev[data.id], health: data.health }
      }));
    });

    socket.on("drone:respawned", (data) => {
      setDrones(prev => ({
        ...prev,
        [data.id]: { ...prev[data.id], health: 50, position: data.position }
      }));
      setPlayers(prev => {
        if (!prev[data.killerId]) return prev;
        return {
          ...prev,
          [data.killerId]: { ...prev[data.killerId], score: data.killerScore }
        };
      });
    });

    socket.on("player:left", (id) => {
      setPlayers((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    socket.on("laser:fired", (data) => {
      const id = Math.random().toString(36).substr(2, 9);
      setLasers((prev) => [...prev, { id, ...data }]);
      
      // Auto-remove laser after visualization
      setTimeout(() => {
        setLasers((prev) => prev.filter((l) => l.id !== id));
      }, 500);
    });

    return () => {
      socket.off("init");
      socket.off("player:joined");
      socket.off("player:moved");
      socket.off("player:hit");
      socket.off("player:respawned");
      socket.off("player:left");
      socket.off("laser:fired");
    };
  }, []);

  if (!gameStarted) {
    return (
      <div className="h-screen w-screen bg-[#050508] text-white font-sans relative overflow-hidden select-none">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#1a1b3a_0%,_transparent_70%)] opacity-40" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00f2ff] rounded-full blur-[160px] opacity-10" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff00f2] rounded-full blur-[200px] opacity-10" />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        {/* Header */}
        <header className="absolute top-0 w-full p-8 flex justify-between items-start z-20">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-[#00f2ff] p-1">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xl font-bold italic">
                  {myId ? myId[0].toUpperCase() : 'P'}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#00f2ff] text-black text-[10px] font-black px-1 rounded">LVL 42</div>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight italic">
                {myId ? `OP_${myId.substring(0, 8).toUpperCase()}` : 'NEW_PILOT'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#00f2ff] text-xs font-bold uppercase tracking-widest">Diamond II</span>
                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[65%] h-full bg-[#00f2ff]"></div>
                </div>
                <span className="text-xs text-white/40">12,450 / 18,000 XP</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3 backdrop-blur-md">
              <span className="text-[#00f2ff] text-xs font-bold uppercase">Core Credits</span>
              <span className="font-mono font-bold">4,820</span>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3 backdrop-blur-md">
              <span className="text-[#ff00f2] text-xs font-bold uppercase">Photons</span>
              <span className="font-mono font-bold">150</span>
            </div>
          </div>
        </header>

        <main className="h-full flex items-center justify-center relative z-10 overflow-auto pt-24 pb-20">
          <div className="absolute bottom-20 w-[600px] h-[400px] bg-gradient-to-t from-[#00f2ff]/20 to-transparent blur-3xl rounded-full opacity-20" />
          
          {activeTab === "LOBBY" && (
            <div className="text-center">
              <h1 className="text-[100px] md:text-[140px] font-black italic tracking-tighter leading-none mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 select-none">
                LASERZONE
              </h1>
              <p className="text-[#00f2ff] tracking-[0.5em] font-bold text-sm uppercase mb-12">Arena Clash Multiplayer</p>
              
              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={() => setGameStarted(true)}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-[#00f2ff] blur-xl opacity-30 group-hover:opacity-60 transition-opacity" />
                  <div className="relative bg-[#00f2ff] text-black px-16 py-4 rounded-full font-black text-2xl italic tracking-widest border-b-4 border-black/20 transform transition-transform group-active:translate-y-1">
                    ENTER ARENA
                  </div>
                </button>
                
                <div className="flex gap-12 mt-4 text-white/80">
                  <div className="text-center">
                    <span className="block text-xs text-white/40 uppercase tracking-widest mb-1">Current Mode</span>
                    <span className="font-bold italic text-lg uppercase">8v8 Free-For-All</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-white/40 uppercase tracking-widest mb-1">Sector</span>
                    <span className="font-bold italic text-lg uppercase">Neon Grid Alpha</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ARMORY" && (
            <div className="w-full max-w-4xl px-8">
              <h2 className="text-4xl font-black italic uppercase mb-8 tracking-tighter">Armory <span className="text-[#00f2ff] text-sm font-mono ml-4 tracking-normal">EQUIPMENT_VAULT</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "Pulse Blaster", type: "Standard", stats: "BALANCED", color: "cyan" },
                  { name: "Beam Rifle", type: "Long Range", stats: "PRECISION", color: "magenta" },
                  { name: "Phaser SMG", type: "Rapid Fire", stats: "SPEED", color: "yellow" },
                  { name: "Core Cannon", type: "Heavy", stats: "POWER", color: "red" },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 backdrop-blur-md group hover:border-[#00f2ff] transition-all cursor-pointer">
                    <div className="text-[10px] text-white/40 font-bold uppercase mb-2">{item.type}</div>
                    <div className="text-xl font-black italic uppercase mb-4">{item.name}</div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-0.5 flex-1 bg-white/10"><div className="h-full bg-[#00f2ff] w-2/3"></div></div>
                      <span className="text-[10px] font-mono text-[#00f2ff]">{item.stats}</span>
                    </div>
                    <button className="w-full py-2 bg-white/10 text-xs font-bold uppercase tracking-widest group-hover:bg-[#00f2ff] group-hover:text-black transition-colors">Equip</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "LOADOUT" && (
            <div className="w-full max-w-4xl px-8">
              <h2 className="text-4xl font-black italic uppercase mb-8 tracking-tighter">Loadout <span className="text-[#ff00f2] text-sm font-mono ml-4 tracking-normal">STRIKER_CFG</span></h2>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-64 h-96 bg-white/5 border border-white/10 rounded flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#ff00f2]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-24 h-48 bg-gray-800 rounded-full animate-pulse flex items-center justify-center">
                    <span className="text-[10px] opacity-20">PREVIEW</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10">
                    <div className="text-[10px] text-white/40 font-bold uppercase mb-1">Suit Selection</div>
                    <div className="text-lg font-black italic uppercase text-[#00f2ff]">PHANTOM MK.II</div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10">
                    <div className="text-[10px] text-white/40 font-bold uppercase mb-1">Visor Tint</div>
                    <div className="text-lg font-black italic uppercase text-[#ff00f2]">NEON MAGENTA</div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10">
                    <div className="text-[10px] text-white/40 font-bold uppercase mb-1">Laser Signature</div>
                    <div className="text-lg font-black italic uppercase">PULSE_WAVE_01</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "LEADERBOARD" && (
            <div className="w-full max-w-4xl px-8">
              <h2 className="text-4xl font-black italic uppercase mb-8 tracking-tighter">Leaderboard <span className="text-yellow-400 text-sm font-mono ml-4 tracking-normal">GLOBAL_RANKS</span></h2>
              <div className="bg-white/5 border border-white/10 rounded overflow-hidden">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="bg-white/5 text-[10px] text-white/40">
                      <th className="p-4 uppercase">Rank</th>
                      <th className="p-4 uppercase">Pilot</th>
                      <th className="p-4 uppercase">Arena Score</th>
                      <th className="p-4 uppercase text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {Object.values(players).sort((a,b) => b.score - a.score).slice(0, 5).concat([
                      { id: 'Vector_X', score: 25400 },
                      { id: 'Nova_Pulse', score: 21200 },
                      { id: 'GlitchBoi', score: 18900 }
                    ].map(p => ({ ...p, id: p.id, team: 'Red' })) as any).map((p: any, i) => (
                      <tr key={i} className={`hover:bg-white/5 transition-colors ${p.id === myId ? 'bg-[#00f2ff]/10 text-[#00f2ff]' : ''}`}>
                        <td className="p-4 font-black italic">#{i+1}</td>
                        <td className="p-4 font-bold">{p.id.substring(0, 12)}</td>
                        <td className="p-4">{p.score}</td>
                        <td className="p-4 text-right">84%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "SETTINGS" && (
            <div className="w-full max-w-4xl px-8">
              <h2 className="text-4xl font-black italic uppercase mb-8 tracking-tighter">Settings <span className="text-white/40 text-sm font-mono ml-4 tracking-normal">SYSTEM_CFG</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Mouse Sensitivity</label>
                    <input type="range" className="w-full accent-[#00f2ff]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Master Volume</label>
                    <input type="range" className="w-full accent-[#ff00f2]" />
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    "Shadow Quality", "Anti-Aliasing", "V-Sync", "Motion Blur"
                  ].map((setting, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-white/5 border border-white/10">
                      <span className="text-sm font-bold uppercase tracking-wider">{setting}</span>
                      <div className="w-10 h-5 bg-white/10 rounded-full relative group cursor-pointer">
                        <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full group-hover:bg-[#00f2ff]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        <aside className="absolute left-10 bottom-24 w-64 space-y-4 hidden lg:block">
          <div className="bg-white/5 border-l-2 border-[#00f2ff] p-4 backdrop-blur-lg">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Combat Profile</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Tag Accuracy</span>
                <span className="font-mono">72.4%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Career Score</span>
                <span className="font-mono">2.4M</span>
              </div>
            </div>
          </div>
        </aside>

        <aside className="absolute right-10 bottom-24 w-64 space-y-4 hidden lg:block">
          <div className="bg-white/5 border-r-2 border-[#ff00f2] p-4 backdrop-blur-lg">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Arena Active ({Object.keys(players).length})</h3>
            <div className="space-y-3">
              {Object.values(players).slice(0, 3).map((p: any) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]"></div>
                  <span className="text-sm font-medium">{p.id.substring(0, 8)}</span>
                  <span className="ml-auto text-[9px] bg-white/10 px-1 rounded text-white/40 uppercase">In Game</span>
                </div>
              ))}
              {Object.keys(players).length === 0 && <span className="text-xs text-white/30 italic">No pilots detected...</span>}
            </div>
          </div>
        </aside>

        <nav className="absolute bottom-0 w-full h-20 border-t border-white/5 bg-black/40 backdrop-blur-2xl flex justify-center items-center gap-12 z-20">
          <button 
            onClick={() => setActiveTab("LOBBY")}
            className={`font-bold text-xs tracking-widest transition-all uppercase ${activeTab === "LOBBY" ? 'text-[#00f2ff] border-b-2 border-[#00f2ff] pb-1' : 'text-white/40 hover:text-white'}`}
          >Lobby</button>
          <button 
            onClick={() => setActiveTab("ARMORY")}
            className={`font-bold text-xs tracking-widest transition-all uppercase ${activeTab === "ARMORY" ? 'text-[#00f2ff] border-b-2 border-[#00f2ff] pb-1' : 'text-white/40 hover:text-white'}`}
          >Armory</button>
          <button 
            onClick={() => setActiveTab("LOADOUT")}
            className={`font-bold text-xs tracking-widest transition-all uppercase ${activeTab === "LOADOUT" ? 'text-[#00f2ff] border-b-2 border-[#00f2ff] pb-1' : 'text-white/40 hover:text-white'}`}
          >Loadout</button>
          <button 
            onClick={() => setActiveTab("LEADERBOARD")}
            className={`font-bold text-xs tracking-widest transition-all uppercase ${activeTab === "LEADERBOARD" ? 'text-[#00f2ff] border-b-2 border-[#00f2ff] pb-1' : 'text-white/40 hover:text-white'}`}
          >Leaderboard</button>
          <button 
            onClick={() => setActiveTab("SETTINGS")}
            className={`font-bold text-xs tracking-widest transition-all uppercase ${activeTab === "SETTINGS" ? 'text-[#00f2ff] border-b-2 border-[#00f2ff] pb-1' : 'text-white/40 hover:text-white'}`}
          >Settings</button>
        </nav>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden cursor-crosshair">
      <Canvas shadows camera={{ fov: 75 }}>
        <Suspense fallback={null}>
          <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Physics gravity={[0, -9.81, 0]}>
            <Arena />
            <Player />
            {Object.values(players).map((p) => (
              p.id !== myId && <RemotePlayer key={p.id} player={p} />
            ))}
            {Object.values(drones).map((d) => (
              <Drone key={d.id} drone={d} />
            ))}
          </Physics>

          {lasers.map((laser) => (
            <Laser key={laser.id} origin={laser.origin} direction={laser.direction} />
          ))}

          <PointerLockControls />
        </Suspense>
      </Canvas>
      
      <HUD myId={myId} players={players} />
    </div>
  );
}
