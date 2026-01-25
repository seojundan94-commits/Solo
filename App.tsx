
import React, { useState, useEffect, useCallback } from 'react';
import { Player, PlayerClass, Rank, Stats, LogEntry, Skill, Companion, Item, EquipmentSlot } from './types';
import { StatusWindow } from './components/StatusWindow';
import { ActionPanel } from './components/ActionPanel';
import { GameLog } from './components/GameLog';

const INITIAL_STATS: Stats = {
  strength: 10,
  agility: 10,
  sense: 10,
  vitality: 10,
  intelligence: 10
};

const INITIAL_PLAYER: Player = {
  name: "", 
  level: 1,
  currentExp: 0,
  maxExp: 100,
  hp: 200,
  maxHp: 200,
  mp: 100,
  maxMp: 100,
  gold: 2000,
  stats: INITIAL_STATS,
  statPoints: 0,
  job: PlayerClass.NONE,
  title: "최약체 병기",
  rank: Rank.E,
  skills: [],
  companions: [],
  inventory: [],
  storyStage: 0
};

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    const safeText = typeof text === 'string' ? text : JSON.stringify(text);
    setLogs(prev => [
      ...prev, 
      { id: `${Date.now()}-${Math.random()}`, text: safeText, type, timestamp: Date.now() }
    ].slice(-50));
  }, []);

  useEffect(() => {
    if (!gameStarted) return;
    if (player.currentExp >= player.maxExp) {
      const leftoverExp = player.currentExp - player.maxExp;
      const newLevel = player.level + 1;
      
      setPlayer(prev => ({
        ...prev,
        level: newLevel,
        currentExp: leftoverExp,
        maxExp: Math.floor(prev.maxExp * 1.3),
        maxHp: prev.maxHp + 50,
        hp: prev.maxHp + 50,
        maxMp: prev.maxMp + 20,
        mp: prev.maxMp + 20,
        statPoints: prev.statPoints + 5
      }));
      
      setIsLevelUp(true);
      addLog(`【레벨 업】 레벨 ${newLevel}에 도달했습니다! 모든 수치가 회복됩니다.`, 'system');

      if (newLevel === 10 && player.job === PlayerClass.NONE) {
          setPlayer(prev => ({ ...prev, job: PlayerClass.NECROMANCER, title: "그림자 군주" }));
          addLog("【전직 성공】 당신은 '그림자 군주'로 전직했습니다.", 'system');
      }
    }
  }, [player.currentExp, player.maxExp, gameStarted, addLog, player.job]);

  const handleStartGame = () => {
    if (!playerNameInput.trim()) return;
    setPlayer(prev => ({ ...prev, name: playerNameInput }));
    setGameStarted(true);
    addLog("시스템이 활성화되었습니다. 성장을 시작하십시오.", 'system');
  };

  const handleIncreaseStat = (statKey: keyof Stats) => {
    if (player.statPoints <= 0) return;
    setPlayer(prev => ({
        ...prev,
        stats: { ...prev.stats, [statKey]: prev.stats[statKey] + 1 },
        statPoints: prev.statPoints - 1,
        maxHp: statKey === 'vitality' ? prev.maxHp + 20 : prev.maxHp,
        maxMp: statKey === 'intelligence' ? prev.maxMp + 10 : prev.maxMp
    }));
  };

  const handleToggleEquip = (itemUid: string) => {
    setPlayer(prev => {
      const targetItem = prev.inventory.find(i => i.uid === itemUid);
      if (!targetItem || targetItem.type === 'CONSUMABLE') return prev;

      const isEquipping = !targetItem.isEquipped;
      const slot = targetItem.slot;

      const newInventory = prev.inventory.map(item => {
        // 동일 슬롯의 다른 아이템 해제
        if (isEquipping && item.slot === slot && item.uid !== itemUid) {
          return { ...item, isEquipped: false };
        }
        // 대상 아이템 토글
        if (item.uid === itemUid) {
          return { ...item, isEquipped: isEquipping };
        }
        return item;
      });

      addLog(isEquipping ? `${targetItem.name}을(를) 장착했습니다.` : `${targetItem.name}의 장착을 해제했습니다.`, 'info');
      return { ...prev, inventory: newInventory };
    });
  };

  const handleUseItem = (itemUid: string) => {
    setPlayer(prev => {
      const itemIndex = prev.inventory.findIndex(i => i.uid === itemUid);
      if (itemIndex === -1) return prev;
      const item = prev.inventory[itemIndex];
      if (item.type !== 'CONSUMABLE') return prev;

      let newPlayer = { ...prev };
      const newInventory = [...prev.inventory];
      newInventory.splice(itemIndex, 1);
      newPlayer.inventory = newInventory;

      // 아이템 효과 적용
      if (item.id.startsWith('hp_')) {
        newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + item.effectValue);
        addLog(`${item.name} 사용: HP가 ${item.effectValue} 회복되었습니다.`, 'gain');
      } else if (item.id.startsWith('mp_')) {
        newPlayer.mp = Math.min(newPlayer.maxMp, newPlayer.mp + item.effectValue);
        addLog(`${item.name} 사용: MP가 ${item.effectValue} 회복되었습니다.`, 'gain');
      } else if (item.id.startsWith('elixir_')) {
        const statMap: Record<string, keyof Stats> = {
          'elixir_근력': 'strength',
          'elixir_민첩': 'agility',
          'elixir_감각': 'sense',
          'elixir_체력': 'vitality',
          'elixir_지능': 'intelligence'
        };
        const statKey = statMap[item.id];
        if (statKey) {
          newPlayer.stats = { ...newPlayer.stats, [statKey]: newPlayer.stats[statKey] + item.effectValue };
          if (statKey === 'vitality') newPlayer.maxHp += 20;
          if (statKey === 'intelligence') newPlayer.maxMp += 10;
          addLog(`${item.name} 사용: ${item.id.split('_')[1]} 스탯이 ${item.effectValue} 증가했습니다.`, 'gain');
        }
      }

      return newPlayer;
    });
  };

  const handleEnemyDefeated = (rank: Rank, exp: number, gold: number) => {
      setPlayer(prev => ({
          ...prev,
          currentExp: prev.currentExp + exp,
          gold: prev.gold + gold
      }));
      addLog(`경험치 +${exp}, 골드 +${gold}G 획득!`, 'gain');
  };

  const handlePlayerDamage = (damage: number) => {
      setPlayer(prev => {
          const newHp = Math.max(0, prev.hp - damage);
          if (newHp === 0) {
              addLog("치명타! 시스템이 긴급 복구를 시도합니다.", 'danger');
              return { ...prev, hp: Math.floor(prev.maxHp * 0.2), gold: Math.floor(prev.gold * 0.9) };
          }
          return { ...prev, hp: newHp };
      });
  };

  const handleAdminCode = () => {
      const code = codeInput.trim().toLowerCase();
      setIsCodeModalOpen(false);
      if (code === 'sungjinwoo') {
          setPlayer(prev => ({
              ...prev,
              level: 99,
              stats: { strength: 999, agility: 999, sense: 999, vitality: 999, intelligence: 999 },
              maxHp: 50000,
              hp: 50000,
              gold: 9999999,
              job: PlayerClass.SHADOW_MONARCH,
              title: "그림자 군주 성진우"
          }));
          addLog("관리자 권한 승인: 성진우 모드 활성화.", 'system');
      }
      setCodeInput("");
  };

  if (!gameStarted) {
      return (
          <div className="min-h-screen w-full bg-system-dark flex flex-col items-center justify-center p-4">
              <div className="bg-system-panel border border-system-blue p-10 rounded shadow-[0_0_40px_rgba(0,168,255,0.2)] max-w-sm w-full animate-in zoom-in duration-500">
                  <h1 className="text-4xl font-black text-system-blue text-center mb-10 tracking-[0.2em] italic">SYSTEM</h1>
                  <input 
                    type="text" 
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartGame()}
                    placeholder="플레이어 이름"
                    className="w-full bg-black/60 border border-gray-800 p-4 text-white mb-6 outline-none focus:border-system-blue transition-all font-bold text-center"
                  />
                  <button onClick={handleStartGame} className="w-full bg-system-blue hover:bg-blue-600 text-black font-black py-4 rounded tracking-[0.3em] transition-all">진입하기</button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen w-full flex flex-col p-4 lg:p-8 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-system-blue/20 animate-scanline pointer-events-none"></div>
      
      <header className="flex justify-between items-center mb-6 border-b border-system-blue/20 pb-4 shrink-0">
        <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-system-blue animate-pulse rounded-full"></span>
            <h1 className="text-2xl font-black text-white italic tracking-tighter">SOLO LEVELING <span className="text-system-blue">SYSTEM</span></h1>
        </div>
        <div className="text-yellow-500 font-mono font-bold text-sm bg-yellow-500/10 px-4 py-1 rounded border border-yellow-500/20">
          GOLD: {player.gold.toLocaleString()} G
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 flex-1 max-w-7xl mx-auto w-full overflow-hidden min-h-0">
        <StatusWindow 
            player={player} 
            onIncreaseStat={handleIncreaseStat}
            onToggleEquip={handleToggleEquip}
            onUseItem={handleUseItem}
            onOpenCodeModal={() => setIsCodeModalOpen(true)}
        />
        <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
            <GameLog logs={logs} />
            <ActionPanel 
                player={player} 
                addLog={addLog} 
                updatePlayer={(updates) => setPlayer(prev => ({ ...prev, ...updates }))}
                onEnemyDefeated={handleEnemyDefeated}
                onPlayerDamage={handlePlayerDamage}
            />
        </div>
      </main>

      {isLevelUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-system-panel border-2 border-yellow-400 p-12 rounded shadow-[0_0_60px_rgba(250,204,21,0.4)] text-center">
                  <h2 className="text-5xl font-black text-yellow-400 mb-6 italic tracking-widest">LEVEL UP!</h2>
                  <p className="text-white font-bold mb-10">한계가 확장되었습니다.</p>
                  <button onClick={() => setIsLevelUp(false)} className="px-16 py-4 bg-yellow-500 text-black font-black rounded active:scale-95 transition-all">확인</button>
              </div>
          </div>
      )}

      {isCodeModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4">
              <div className="bg-system-panel border border-system-blue p-8 rounded max-w-xs w-full">
                  <h3 className="text-system-blue font-black mb-6 text-center">ADMIN ACCESS</h3>
                  <input 
                    type="password"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminCode()}
                    className="w-full bg-black border border-gray-800 p-3 text-white mb-6 text-center outline-none"
                    placeholder="CODE"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAdminCode} className="flex-1 bg-system-blue text-black font-bold py-3 rounded">OK</button>
                    <button onClick={() => setIsCodeModalOpen(false)} className="flex-1 bg-gray-800 text-gray-400 font-bold py-3 rounded">CLOSE</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
