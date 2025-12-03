import React, { useState } from 'react';
import { Player, Stats, Skill, Item, EquipmentSlot, Rank } from '../types';

interface StatusWindowProps {
  player: Player;
  onIncreaseStat: (statKey: keyof Stats) => void;
  onOpenUpgradeModal?: (skill: Skill) => void;
  onToggleEquip?: (item: Item) => void;
  onOpenCodeModal?: () => void;
}

const getRankColor = (rank: string) => {
  if (rank === 'S') return 'text-yellow-400';
  if (rank === 'A') return 'text-red-400';
  if (rank === 'B') return 'text-purple-400';
  if (rank === 'C') return 'text-blue-400';
  return 'text-gray-400';
};

export const StatusWindow: React.FC<StatusWindowProps> = ({ player, onIncreaseStat, onOpenUpgradeModal, onToggleEquip, onOpenCodeModal }) => {
  const [activeTab, setActiveTab] = useState<'EQUIPMENT' | 'ARMY'>('EQUIPMENT');
  
  // Calculate bonuses for display
  const getEquippedBonus = (type: 'WEAPON' | 'ARMOR') => {
      return player.inventory
        .filter(i => i.isEquipped && i.type === type)
        .reduce((acc, curr) => acc + curr.effectValue, 0);
  };

  const attackBonus = getEquippedBonus('WEAPON');
  const defenseBonus = getEquippedBonus('ARMOR');

  const getEquippedItem = (slot: EquipmentSlot) => {
      return player.inventory.find(i => i.isEquipped && i.slot === slot);
  }

  return (
    <div className="w-full lg:w-1/3 bg-black/80 border border-system-blue shadow-[0_0_15px_rgba(0,168,255,0.2)] p-4 rounded-lg text-system-text font-sans relative overflow-hidden group flex flex-col gap-6 h-fit">
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
        
        {/* Main Status */}
        <div className="relative z-10">
            <div className="flex justify-between items-center mb-4 border-b border-system-blue/50 pb-2">
                <h2 className="text-2xl font-bold text-system-blue tracking-widest">STATUS</h2>
                {onOpenCodeModal && (
                    <button 
                        onClick={onOpenCodeModal} 
                        className="text-[10px] bg-system-blue/20 hover:bg-system-blue text-system-blue hover:text-black border border-system-blue px-3 py-1 rounded transition-all font-bold tracking-wider hover:shadow-[0_0_10px_#00a8ff]"
                    >
                        ADMIN CODE
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <p className="text-xs text-gray-400">NAME</p>
                    <div className="flex items-center gap-2">
                        <p className="text-lg font-bold">{player.name}</p>
                    </div>
                </div>
                <div>
                    <p className="text-xs text-gray-400">LEVEL</p>
                    <p className="text-lg font-bold text-yellow-400">{player.level}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">JOB</p>
                    <p className="text-sm">{player.job}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">TITLE</p>
                    <p className="text-sm">{player.title}</p>
                </div>
            </div>

            {/* HP/MP Bars */}
            <div className="mb-6 space-y-3">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-red-400 font-bold">HP</span>
                        <span>{player.hp} / {player.maxHp}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-red-600 transition-all duration-300" 
                            style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
                        />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-400 font-bold">MP</span>
                        <span>{player.mp} / {player.maxMp}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-600 transition-all duration-300" 
                            style={{ width: `${Math.max(0, (player.mp / player.maxMp) * 100)}%` }}
                        />
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-yellow-400 font-bold">EXP</span>
                        <span>{player.currentExp} / {player.maxExp}</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-yellow-500 transition-all duration-300" 
                            style={{ width: `${(player.currentExp / player.maxExp) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                    <span className="text-sm text-gray-400">능력치 포인트</span>
                    <span className={`font-mono font-bold ${player.statPoints > 0 ? 'text-yellow-400 animate-pulse' : 'text-gray-600'}`}>
                        {player.statPoints}
                    </span>
                </div>

                {(['strength', 'agility', 'sense', 'vitality', 'intelligence'] as Array<keyof Stats>).map((stat) => (
                    <div key={stat} className="flex items-center justify-between h-8">
                        <span className="text-sm uppercase w-24 text-gray-300">
                            {stat === 'strength' && '근력 (STR)'}
                            {stat === 'agility' && '민첩 (AGI)'}
                            {stat === 'sense' && '감각 (SNS)'}
                            {stat === 'vitality' && '체력 (VIT)'}
                            {stat === 'intelligence' && '지능 (INT)'}
                        </span>
                        <div className="flex gap-2">
                            <span className="font-mono text-system-blue font-bold">{player.stats[stat]}</span>
                            {/* Show Equipment Bonus */}
                            {stat === 'strength' && attackBonus > 0 && <span className="text-xs text-green-400 flex items-center">(+{attackBonus})</span>}
                            {stat === 'vitality' && defenseBonus > 0 && <span className="text-xs text-green-400 flex items-center">(+{defenseBonus})</span>}
                        </div>
                        {player.statPoints > 0 && (
                             <button 
                                onClick={() => onIncreaseStat(stat)}
                                className="ml-2 w-6 h-6 rounded bg-system-blue/20 text-system-blue hover:bg-system-blue hover:text-black text-xs flex items-center justify-center transition-colors"
                             >
                                +
                             </button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="relative z-10 border-t border-gray-800 pt-4 mt-2">
            <div className="flex gap-4 mb-4">
                 <button 
                    onClick={() => setActiveTab('EQUIPMENT')}
                    className={`text-xs font-bold pb-1 transition-colors ${activeTab === 'EQUIPMENT' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                     EQUIPMENT
                 </button>
                 <button 
                    onClick={() => setActiveTab('ARMY')}
                    className={`text-xs font-bold pb-1 transition-colors ${activeTab === 'ARMY' ? 'text-purple-400 border-b border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                     SHADOW ARMY <span className="text-[10px] ml-1 bg-gray-800 px-1 rounded">{player.companions.length}</span>
                 </button>
            </div>

            {activeTab === 'EQUIPMENT' && (
                <div className="grid grid-cols-4 gap-2">
                    {(['WEAPON', 'HEAD', 'BODY', 'ACCESSORY'] as EquipmentSlot[]).map(slot => {
                        const item = getEquippedItem(slot);
                        return (
                            <div key={slot} className="aspect-square bg-gray-900/50 border border-gray-700 rounded flex items-center justify-center relative group">
                                {item ? (
                                    <>
                                        <div className="text-xl">{item.type === 'WEAPON' ? '⚔️' : '🛡️'}</div>
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 z-20">
                                            <span className="text-[10px] text-center text-white leading-tight">{item.name}</span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-xs text-gray-700">{slot.slice(0,1)}</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {activeTab === 'ARMY' && (
                <div className="max-h-[150px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {player.companions.length === 0 ? (
                        <div className="text-center text-gray-600 text-xs py-4">
                            보유한 그림자가 없습니다.
                        </div>
                    ) : (
                        player.companions.map((comp, idx) => (
                            <div key={idx} className="bg-gray-900/50 p-2 rounded border border-gray-800 flex justify-between items-center group hover:border-purple-500/30 transition-colors">
                                <div>
                                    <div className={`text-xs font-bold ${getRankColor(comp.rank)}`}>
                                        {comp.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 flex gap-2">
                                        <span>{comp.role || '병사'}</span>
                                        <span>{comp.rank}급</span>
                                    </div>
                                </div>
                                <div className="text-xs font-mono text-gray-400 group-hover:text-white">
                                    ATK +{comp.attackBonus}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    </div>
  );
};