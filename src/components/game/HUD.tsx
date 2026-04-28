import { useEffect, useState } from "react";
import socket from "../../lib/socket";

export function HUD({ myId, players }: { myId: string | null, players: Record<string, any> }) {
  const me = myId ? players[myId] : null;
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const handleRespawn = (data: any) => {
      const killer = players[data.killerId];
      const victim = players[data.id];
      if (killer && victim) {
        setMessages(prev => [`${killer.id.substring(0, 5)} tagged ${victim.id.substring(0, 5)}!`, ...prev].slice(0, 5));
      }
    };

    socket.on("player:respawned", handleRespawn);
    return () => {
      socket.off("player:respawned", handleRespawn);
    };
  }, [players]);

  if (!me) return null;

  return (
    <div className="fixed inset-0 pointer-events-none select-none font-sans overflow-hidden">
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-70">
        <div className="absolute w-full h-[1px] bg-[#00f2ff]" />
        <div className="absolute h-full w-[1px] bg-[#00f2ff]" />
        <div className="w-1 h-1 bg-[#ff00f2] rounded-full shadow-[0_0_10px_#ff00f2]" />
      </div>

      {/* Primary HUD Elements */}
      <div className="absolute top-0 w-full p-8 flex justify-between items-start">
        <div className="flex gap-4">
          <div className="bg-black/40 backdrop-blur-md border border-white/5 border-l-[#00f2ff] border-l-2 p-4 min-w-[200px]">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Squad Connectivity</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff] animate-pulse" />
              <span className="text-sm font-bold italic tracking-wider">SECTOR ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="bg-black/40 backdrop-blur-md border border-white/5 border-r-[#ff00f2] border-r-2 p-4 text-right">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Arena Standing</div>
            <div className="text-3xl font-black italic text-[#ff00f2]">{me.score}</div>
          </div>
        </div>
      </div>

      {/* Bottom HUD - Vitals */}
      <div className="absolute bottom-10 left-10 w-96">
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent opacity-50" />
          
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Shield Integrity</div>
              <div className="text-4xl font-black italic text-[#00f2ff]">{Math.floor(me.health)}%</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">System Load</div>
              <div className="text-sm font-mono text-white/60">NOMINAL</div>
            </div>
          </div>
          
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#00f2ff] to-[#00f2ff]/40 transition-all duration-300 relative" 
              style={{ width: `${me.health}%` }}
            >
              <div className="absolute top-0 right-0 w-8 h-full bg-white animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Combat Log */}
      <div className="absolute top-32 left-10 space-y-2 max-w-xs">
        {messages.map((msg, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-sm border-l-2 border-[#ff00f2] px-4 py-2 text-[11px] font-medium tracking-wide uppercase text-white animate-in slide-in-from-left fade-in duration-500">
            {msg}
          </div>
        ))}
      </div>

      {/* Active Pilots List */}
      <div className="absolute right-10 top-32 space-y-2">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-4 text-right">Operational Feed</div>
        {Object.values(players).map((p: any) => (
           <div key={p.id} className="flex items-center justify-end gap-3 group">
             <div className="text-right">
               <div className={`text-[11px] font-bold tracking-widest uppercase ${p.id === myId ? 'text-[#00f2ff]' : 'text-white/60'}`}>
                 {p.id.substring(0, 8)} {p.id === myId ? '(YOU)' : ''}
               </div>
               <div className="text-[9px] font-mono text-white/20">SCORE: {p.score}</div>
             </div>
             <div className={`w-1 h-8 ${p.id === myId ? 'bg-[#00f2ff]' : 'bg-white/10'}`} />
           </div>
        ))}
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-10 right-10 text-right">
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
          <span>Move</span><span className="text-white/40">WASD / SCROLL</span>
          <span>Jump</span><span className="text-white/40">SPACE</span>
          <span>Engage</span><span className="text-white/40">MOUSE-1</span>
        </div>
      </div>
    </div>
  );
}
