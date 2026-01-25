
import React, { useState } from 'react';
import { Player, Stats, Item, EquipmentSlot, Rank, Companion } from '../types';

interface StatusWindowProps {
  player: Player;
  onIncreaseStat: (statKey: keyof Stats) => void;
  onToggleEquip: (itemUid: string) => void;
  onUseItem: (itemUid: string) => void;
  onOpenCodeModal?: () => void;
}

const getRankColor = (rank: Rank) => {
  switch (rank) {
    case Rank.S: return 'text-yellow-400';
    case Rank.A: return 'text-red-500';
    case Rank.B: return 'text-purple-500';
    case Rank.C: return 'text-blue-500';
    case Rank.D: return 'text-green-500';
    default: return 'text-gray-400';
  }
};

const getRankBg = (rank: Rank) => {
  switch (rank) {
    case Rank.S: return 'bg-yellow-400/10 border-yellow-400/30';
    case Rank.A: return 'bg-red-500/10 border-red-500/30';
    case Rank.B: return 'bg-purple-500/10 border-purple-500/30';
    default: return 'bg-gray-800/40 border-gray-700';
  }
};

type TabType = 'STATUS' | 'ARMY' | 'INVENTORY';

export const StatusWindow: React.FC<StatusWindowProps> = ({ 
    player, 
    onIncreaseStat, 
    onToggleEquip, 
    onUseItem,
    onOpenCodeModal 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('STATUS');
  const [selectedShadow, setSelectedShadow] = useState<Companion | null>(null);

  const getEquippedItem = (slot: EquipmentSlot) => {
      return player.inventory.find(i => i.isEquipped && i.slot === slot);
  }

  const weaponBonus = player.inventory.filter(i => i.isEquipped && i.type === 'WEAPON').reduce((sum, i) => sum + (i.effectValue || 0), 0);
  const armorBonus = player.inventory.filter(i => i.isEquipped && i.type === 'ARMOR').reduce((sum, i) => sum + (i.effectValue || 0), 0);

  return (
    <div className="w-full lg:w-80 shrink-0 bg-system-panel/80 border border-system-blue/40 p-5 rounded-lg text-system-text font-sans relative overflow-hidden flex flex-col gap-6 shadow-[0_0_20px_rgba(0,168,255,0.1)] backdrop-blur-md min-h-[500px]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-system-blue to-transparent opacity-50"></div>
        
        <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-center mb-5 border-b border-system-blue/30 pb-3">
                <h2 className="text-xl font-black text-system-blue tracking-[0.2em] italic">STATUS</h2>
                <div className="text-[10px] text-system-blue/60 font-mono">{player.rank}-RANK</div>
            </div>
            
            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-widest">PLAYER</p>
                    <p className="text-lg font-bold truncate text-white">{player.name || '미등록'}</p>
                    <p className="text-[10px] text-system-blue font-bold italic">{player.title}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-widest">LEVEL</p>
                    <p className="text-2xl font-black text-yellow-400 italic">Lv.{player.level}</p>
                </div>
            </div>

            {/* HP/MP Bars */}
            <div className="space-y-4 mb-6">
                <div>
                    <div className="flex justify-between text-[10px] mb-1 font-bold">
                        <span className="text-red-400">HP</span>
                        <span className="font-mono">{player.hp.toLocaleString()} / {player.maxHp.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                        <div className="h-full bg-gradient-to-r from-red-900 to-red-500 transition-all duration-500" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] mb-1 font-bold">
                        <span className="text-blue-400">MP</span>
                        <span className="font-mono">{player.mp.toLocaleString()} / {player.maxMp.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                        <div className="h-full bg-gradient-to-r from-blue-900 to-blue-500 transition-all duration-500" style={{ width: `${(player.mp / player.maxMp) * 100}%` }} />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-800 mb-4 shrink-0">
                <button onClick={() => setActiveTab('STATUS')} className={`flex-1 py-2 text-[10px] font-black transition-all ${activeTab === 'STATUS' ? 'text-system-blue border-b-2 border-system-blue' : 'text-gray-500'}`}>상태</button>
                <button onClick={() => setActiveTab('INVENTORY')} className={`flex-1 py-2 text-[10px] font-black transition-all ${activeTab === 'INVENTORY' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500'}`}>아이템</button>
                <button onClick={() => { setActiveTab('ARMY'); setSelectedShadow(null); }} className={`flex-1 py-2 text-[10px] font-black transition-all ${activeTab === 'ARMY' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500'}`}>군단</button>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-1">
                {activeTab === 'STATUS' && (
                    <div className="space-y-2">
                        {(['strength', 'agility', 'sense', 'vitality', 'intelligence'] as Array<keyof Stats>).map((stat) => (
                            <div key={stat} className="flex items-center justify-between py-2 px-3 hover:bg-white/5 rounded-lg transition-colors group">
                                <span className="text-[11px] text-gray-500 uppercase font-bold group-hover:text-system-blue">
                                    {stat === 'strength' ? '근력' : stat === 'agility' ? '민첩' : stat === 'sense' ? '감각' : stat === 'vitality' ? '체력' : '지능'}
                                </span>
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-system-blue font-black">{player.stats[stat]}</span>
                                    {player.statPoints > 0 && (
                                        <button onClick={() => onIncreaseStat(stat)} className="w-5 h-5 bg-system-blue/20 text-system-blue hover:bg-system-blue hover:text-black rounded-full flex items-center justify-center font-black text-xs transition-all">+</button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="pt-2 border-t border-gray-800 mt-2 space-y-1">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-gray-500">추가 공격력 (무기)</span>
                                <span className="text-red-400">+{weaponBonus}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-gray-500">추가 방어력 (방어구)</span>
                                <span className="text-blue-400">+{armorBonus}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-800">
                             <p className="text-[10px] text-gray-500 mb-4 font-black tracking-widest">EQUIPMENT</p>
                             <div className="grid grid-cols-4 gap-3">
                                {(['WEAPON', 'HEAD', 'BODY', 'ACCESSORY'] as EquipmentSlot[]).map(slot => {
                                    const item = getEquippedItem(slot);
                                    return (
                                        <div key={slot} className={`aspect-square bg-black/60 border border-gray-800 rounded-lg flex flex-col items-center justify-center transition-all relative overflow-hidden group ${item ? 'border-system-blue/40' : ''}`}>
                                            <span className={`text-[10px] font-bold ${item ? 'text-system-blue' : 'text-gray-700'}`}>
                                                {item ? (slot === 'WEAPON' ? '⚔️' : slot === 'HEAD' ? '🪖' : slot === 'BODY' ? '🛡️' : '💍') : slot[0]}
                                            </span>
                                            {item && (
                                                <button 
                                                    onClick={() => onToggleEquip(item.uid!)}
                                                    className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-black text-red-500"
                                                >
                                                    해제
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'INVENTORY' && (
                    <div className="space-y-2">
                        {player.inventory.length === 0 ? (
                            <div className="py-10 text-center opacity-20">
                                <p className="text-[10px] font-black">인벤토리가 비어 있습니다</p>
                            </div>
                        ) : (
                            player.inventory.map((item) => (
                                <div key={item.uid} className={`p-3 rounded-lg border flex justify-between items-center transition-all ${item.isEquipped ? 'bg-system-blue/10 border-system-blue/30' : 'bg-black/40 border-gray-800'}`}>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white truncate">{item.name}</span>
                                            {item.isEquipped && <span className="text-[8px] bg-system-blue text-black px-1 rounded font-black shrink-0">장착</span>}
                                        </div>
                                        <p className="text-[9px] text-gray-500 mt-0.5 truncate italic">{item.description}</p>
                                    </div>
                                    <div className="shrink-0">
                                        {item.type === 'CONSUMABLE' ? (
                                            <button 
                                                onClick={() => onUseItem(item.uid!)}
                                                className="px-2 py-1 bg-green-900 text-green-400 text-[9px] font-black rounded hover:bg-green-800 transition-colors"
                                            >
                                                사용
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => onToggleEquip(item.uid!)}
                                                className={`px-2 py-1 text-[9px] font-black rounded transition-colors ${item.isEquipped ? 'bg-red-900 text-red-400 hover:bg-red-800' : 'bg-system-blue/20 text-system-blue hover:bg-system-blue/40'}`}
                                            >
                                                {item.isEquipped ? '해제' : '장착'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'ARMY' && (
                    <div className="flex-1 flex flex-col min-h-0">
                        {selectedShadow ? (
                            <div className={`p-5 rounded-lg border animate-in slide-in-from-right-4 ${getRankBg(selectedShadow.rank)} flex flex-col gap-4`}>
                                <div className="flex justify-between items-start">
                                    <button onClick={() => setSelectedShadow(null)} className="text-[10px] font-black text-gray-500 hover:text-white transition-colors">← 돌아가기</button>
                                    <span className={`text-[10px] font-black ${getRankColor(selectedShadow.rank)}`}>{selectedShadow.rank}-RANK</span>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-black text-white italic">{selectedShadow.name}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-[10px]">
                                    <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                                        <span className="text-gray-500 block mb-1">포지션</span>
                                        <span className="font-black text-white">{selectedShadow.role || '보병'}</span>
                                    </div>
                                    <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                                        <span className="text-gray-500 block mb-1">공격 보너스</span>
                                        <span className="font-black text-red-500">+{selectedShadow.attackBonus}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-purple-200/60 italic text-center">"{selectedShadow.description}"</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {player.companions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center opacity-10 py-20">
                                        <span className="text-5xl mb-4">💀</span>
                                        <span className="text-[11px] font-black tracking-widest uppercase">No Army</span>
                                    </div>
                                ) : (
                                    player.companions.map(comp => (
                                        <button 
                                            key={comp.id} 
                                            onClick={() => setSelectedShadow(comp)}
                                            className={`w-full p-4 rounded-lg border text-left group transition-all hover:translate-x-1 ${getRankBg(comp.rank)}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-black text-white">{comp.name}</span>
                                                <span className={`text-[9px] font-black ${getRankColor(comp.rank)}`}>{comp.rank}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-gray-500 font-bold italic">{comp.role || '그림자 병사'}</span>
                                                <span className="text-[9px] text-purple-400 font-black opacity-0 group-hover:opacity-100 transition-opacity">상세 ></span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <button onClick={onOpenCodeModal} className="mt-auto pt-4 w-full text-[9px] font-black text-system-blue/40 hover:text-system-blue transition-colors text-center uppercase tracking-widest">Admin Access</button>
        </div>
    </div>
  );
};
