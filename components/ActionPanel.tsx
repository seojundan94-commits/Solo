
import React, { useState, useMemo } from 'react';
import { Rank, Enemy, Player, Skill, Companion, Item, PlayerClass, EquipmentSlot } from '../types';

interface ActionPanelProps {
  player: Player;
  addLog: (text: string, type?: any) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  onEnemyDefeated: (enemyRank: Rank, expReward: number, goldReward: number, storyId?: number) => void;
  onPlayerDamage: (damage: number) => void;
}

type GameState = 'IDLE' | 'COMBAT' | 'VICTORY' | 'SHOP' | 'DEFEAT';
type CombatAnim = 'NORMAL' | 'HIT' | 'EXTRACTION';
type ShopCategory = 'ALL' | 'CONSUMABLE' | 'WEAPON' | 'ARMOR';

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

// --- 확장된 몬스터 데이터 ---
const ENEMIES_POOL: Record<Rank, Enemy[]> = {
    [Rank.E]: [
        { name: "굶주린 고블린", rank: Rank.E, hp: 60, maxHp: 60, attack: 10, description: "비쩍 마른 고블린입니다.", isBoss: false },
        { name: "동굴 거미", rank: Rank.E, hp: 80, maxHp: 80, attack: 12, description: "끈적한 거미줄을 내뿜습니다.", isBoss: false },
        { name: "슬라임", rank: Rank.E, hp: 50, maxHp: 50, attack: 8, description: "말랑말랑한 괴물입니다.", isBoss: false }
    ],
    [Rank.D]: [
        { name: "홉 고블린", rank: Rank.D, hp: 200, maxHp: 200, attack: 25, description: "거구의 고블린입니다.", isBoss: false },
        { name: "회색 늑대", rank: Rank.D, hp: 180, maxHp: 180, attack: 30, description: "무리를 지어 다닙니다.", isBoss: false },
        { name: "좀비 전사", rank: Rank.D, hp: 250, maxHp: 250, attack: 20, description: "죽지 않는 병사입니다.", isBoss: false }
    ],
    [Rank.C]: [
        { name: "리자드맨 정찰병", rank: Rank.C, hp: 500, maxHp: 500, attack: 55, description: "창술이 뛰어납니다.", isBoss: false },
        { name: "검은 호랑이", rank: Rank.C, hp: 600, maxHp: 600, attack: 65, description: "매우 빠릅니다.", isBoss: false },
        { name: "스켈레톤 나이트", rank: Rank.C, hp: 700, maxHp: 700, attack: 60, description: "뼈로 된 갑옷을 입었습니다.", isBoss: false }
    ],
    [Rank.B]: [
        { name: "철의 골렘", rank: Rank.B, hp: 1500, maxHp: 1500, attack: 100, description: "방어력이 매우 높습니다.", isBoss: false },
        { name: "와이번", rank: Rank.B, hp: 1200, maxHp: 1200, attack: 120, description: "하늘에서 공격합니다.", isBoss: false },
        { name: "아이스 엘프", rank: Rank.B, hp: 1300, maxHp: 1300, attack: 110, description: "냉기 마법을 씁니다.", isBoss: false }
    ],
    [Rank.A]: [
        { name: "하이 오크 전사", rank: Rank.A, hp: 3500, maxHp: 3500, attack: 200, description: "전투의 화신입니다.", isBoss: false },
        { name: "블러드 뱀파이어", rank: Rank.A, hp: 3000, maxHp: 3000, attack: 250, description: "피를 갈구합니다.", isBoss: false },
        { name: "나태의 지옥견", rank: Rank.A, hp: 4000, maxHp: 4000, attack: 220, description: "지옥의 파수꾼입니다.", isBoss: false }
    ],
    [Rank.S]: [
        { name: "고대 용의 후예", rank: Rank.S, hp: 12000, maxHp: 12000, attack: 600, description: "용의 숨결을 내뿜습니다.", isBoss: false },
        { name: "카르갈간 (보스)", rank: Rank.S, hp: 20000, maxHp: 20000, attack: 800, description: "하이 오크들의 주술사 왕입니다.", isBoss: true },
        { name: "베르 (보스)", rank: Rank.S, hp: 25000, maxHp: 25000, attack: 950, description: "개미들의 왕입니다.", isBoss: true }
    ]
};

// --- 확장된 100개 아이템 데이터 생성 함수 ---
const generateItems = (): Item[] => {
    const items: Item[] = [];
    
    // 1. 소모품 (회복 및 스탯)
    const potions = [
        { prefix: '하급', heal: 100, price: 100 },
        { prefix: '중급', heal: 500, price: 400 },
        { prefix: '상급', heal: 1500, price: 1000 },
        { prefix: '최상급', heal: 5000, price: 3000 },
        { prefix: '기적의', heal: 99999, price: 10000 }
    ];
    potions.forEach(p => {
        items.push({ id: `hp_${p.prefix}`, name: `${p.prefix} 생명력 물약`, type: 'CONSUMABLE', description: `HP를 ${p.heal}만큼 회복합니다.`, price: p.price, effectValue: p.heal });
        items.push({ id: `mp_${p.prefix}`, name: `${p.prefix} 정신력 물약`, type: 'CONSUMABLE', description: `MP를 ${p.heal/2}만큼 회복합니다.`, price: p.price, effectValue: p.heal/2 });
    });

    const elixirs = ['근력', '민첩', '감각', '체력', '지능'];
    elixirs.forEach(e => {
        items.push({ id: `elixir_${e}`, name: `${e}의 영약`, type: 'CONSUMABLE', description: `${e} 스탯을 영구히 1 증가시킵니다.`, price: 5000, effectValue: 1 });
    });

    // 2. 무기 (단검, 장검, 낫, 지팡이)
    const weaponTypes = [
        { name: '단검', slot: 'WEAPON' as EquipmentSlot, bonus: 1.0 },
        { name: '장검', slot: 'WEAPON' as EquipmentSlot, bonus: 1.5 },
        { name: '대검', slot: 'WEAPON' as EquipmentSlot, bonus: 2.0 },
        { name: '낫', slot: 'WEAPON' as EquipmentSlot, bonus: 2.5 }
    ];
    const ranks = [
        { r: '낡은', multi: 0.5, price: 500 },
        { r: '강철', multi: 1.2, price: 2000 },
        { r: '명장의', multi: 2.5, price: 8000 },
        { r: '전설의', multi: 6.0, price: 30000 },
        { r: '신화의', multi: 15.0, price: 100000 },
        { r: '군주의', multi: 40.0, price: 500000 }
    ];
    weaponTypes.forEach(w => {
        ranks.forEach(r => {
            items.push({
                id: `wpn_${w.name}_${r.r}`,
                name: `${r.r} ${w.name}`,
                type: 'WEAPON',
                slot: w.slot,
                description: `${r.r} 등급의 ${w.name}입니다. 공격력이 대폭 상승합니다.`,
                price: r.price,
                effectValue: Math.floor(20 * w.bonus * r.multi)
            });
        });
    });

    // 3. 방어구 (머리, 몸, 액세서리)
    const armorSlots = [
        { name: '투구', slot: 'HEAD' as EquipmentSlot },
        { name: '갑옷', slot: 'BODY' as EquipmentSlot },
        { name: '망토', slot: 'ACCESSORY' as EquipmentSlot },
        { name: '반지', slot: 'ACCESSORY' as EquipmentSlot }
    ];
    armorSlots.forEach(a => {
        ranks.forEach(r => {
            items.push({
                id: `arm_${a.name}_${r.r}`,
                name: `${r.r} ${a.name}`,
                type: 'ARMOR',
                slot: a.slot,
                description: `${r.r} 등급의 ${a.name}입니다. 방어력이 상승합니다.`,
                price: r.price,
                effectValue: Math.floor(10 * r.multi)
            });
        });
    });

    // 4. 유니크 아이템 (원작 반영)
    items.push({ id: 'kasaka_fang', name: '카사카의 독니', type: 'WEAPON', slot: 'WEAPON', description: '마비와 출혈 효과가 깃든 단검입니다.', price: 15000, effectValue: 120 });
    items.push({ id: 'demon_king_dagger', name: '악마왕의 단검', type: 'WEAPON', slot: 'WEAPON', description: '악마왕 바란이 사용하던 무기입니다.', price: 80000, effectValue: 450 });
    items.push({ id: 'orb_of_avarice', name: '탐욕의 구슬', type: 'ARMOR', slot: 'ACCESSORY', description: '마법 공격력을 두 배로 증폭시킵니다.', price: 120000, effectValue: 800 });

    return items;
};

const SHOP_ITEMS = generateItems();

export const ActionPanel: React.FC<ActionPanelProps> = ({ player, addLog, updatePlayer, onEnemyDefeated, onPlayerDamage }) => {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [animState, setAnimState] = useState<CombatAnim>('NORMAL');
  const [isExtracting, setIsExtracting] = useState(false);
  const [shopCategory, setShopCategory] = useState<ShopCategory>('ALL');
  
  // 웨이브 시스템 상태
  const [currentWave, setCurrentWave] = useState(1);
  const [maxWaves, setMaxWaves] = useState(5);
  const [currentGateRank, setCurrentGateRank] = useState<Rank>(Rank.E);

  const filteredItems = useMemo(() => {
    if (shopCategory === 'ALL') return SHOP_ITEMS;
    return SHOP_ITEMS.filter(item => item.type === shopCategory);
  }, [shopCategory]);

  const startCombat = (rank: Rank) => {
      const waveCount = Math.floor(Math.random() * 6) + 5; // 5~10 웨이브
      setCurrentGateRank(rank);
      setCurrentWave(1);
      setMaxWaves(waveCount);
      spawnEnemy(rank, 1);
      setGameState('COMBAT');
      addLog(`${rank}급 게이트에 진입했습니다. (총 ${waveCount}웨이브)`, 'system');
  };

  const spawnEnemy = (rank: Rank, wave: number) => {
      const templates = ENEMIES_POOL[rank];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      // 웨이브에 따른 적 강화
      const powerScale = 1 + (wave - 1) * 0.15;
      const isBossWave = wave === maxWaves;
      
      setCurrentEnemy({
          ...template,
          hp: Math.floor(template.hp * powerScale),
          maxHp: Math.floor(template.maxHp * powerScale),
          attack: Math.floor(template.attack * powerScale),
          name: isBossWave ? `[BOSS] ${template.name}` : `${template.name} (W.${wave})`
      });
      addLog(`웨이브 ${wave}: ${template.name}(이)가 나타났습니다.`, 'combat');
  };

  const handleAttack = () => {
    if (!currentEnemy) return;
    
    // 공격력 계산 (스탯 + 군단 보너스 + 장비)
    const critChance = Math.min(0.5, player.stats.sense * 0.01);
    const isCrit = Math.random() < critChance;
    const baseDmg = (player.stats.strength * 6) + (player.stats.agility * 3);
    const shadowBonus = player.companions.reduce((sum, c) => sum + (c.attackBonus || 0), 0);
    const weaponBonus = player.inventory.filter(i => i.isEquipped && i.type === 'WEAPON').reduce((sum, i) => sum + (i.effectValue || 0), 0);
    
    let totalDmg = Math.floor((baseDmg + shadowBonus + weaponBonus) * (0.8 + Math.random() * 0.4));
    if (isCrit) totalDmg = Math.floor(totalDmg * 2.5);

    const newHp = Math.max(0, currentEnemy.hp - totalDmg);
    setCurrentEnemy({ ...currentEnemy, hp: newHp });
    addLog(`${currentEnemy.name}에게 ${totalDmg} 피해! ${isCrit ? '(치명타!)' : ''}`, isCrit ? 'danger' : 'combat');

    if (newHp <= 0) {
        if (currentWave < maxWaves) {
            // 다음 웨이브
            const nextWave = currentWave + 1;
            setCurrentWave(nextWave);
            setTimeout(() => spawnEnemy(currentGateRank, nextWave), 600);
            addLog(`웨이브 클리어! 체력을 일부 회복합니다.`, 'gain');
            updatePlayer({ hp: Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.1)) });
        } else {
            handleVictory();
        }
    } else {
        setTimeout(enemyTurn, 300);
    }
  };

  const enemyTurn = () => {
      if (!currentEnemy || gameState !== 'COMBAT') return;
      setAnimState('HIT');
      
      const armorBonus = player.inventory.filter(i => i.isEquipped && i.type === 'ARMOR').reduce((sum, i) => sum + (i.effectValue || 0), 0);
      const defense = (player.stats.vitality * 3) + armorBonus;
      const dmg = Math.max(5, currentEnemy.attack - defense);
      
      onPlayerDamage(dmg);
      addLog(`${currentEnemy.name}의 공격! ${dmg} 피해를 입었습니다.`, 'danger');
      setTimeout(() => setAnimState('NORMAL'), 150);
  };

  const handleVictory = () => {
      if (!currentEnemy) return;
      const exp = Math.floor(currentEnemy.maxHp * 1.2);
      const gold = Math.floor(currentEnemy.maxHp * 4);
      onEnemyDefeated(currentGateRank, exp, gold);
      setGameState('VICTORY');
      addLog(`게이트 공략 성공! 모든 적을 소탕했습니다.`, 'system');
  };

  const handleExtraction = () => {
      if (!currentEnemy || isExtracting) return;
      if (player.mp < 50) { addLog("추출을 위한 마력이 부족합니다.", 'info'); return; }
      
      setIsExtracting(true);
      setAnimState('EXTRACTION');
      updatePlayer({ mp: player.mp - 50 });
      addLog(`"일어나라."`, 'system');

      setTimeout(() => {
          const successChance = 0.3 + (player.stats.intelligence * 0.015);
          const success = Math.random() < successChance;

          if (success) {
              const newShadow: Companion = {
                  id: Date.now().toString(),
                  name: `그림자 ${currentEnemy.name.replace('[BOSS] ', '').split(' ')[0]}`,
                  rank: currentGateRank,
                  description: `군주의 의지에 귀속된 병사`,
                  type: 'SHADOW',
                  attackBonus: Math.floor(currentEnemy.attack * 0.35),
                  role: currentEnemy.isBoss ? '기사' : '보병'
              };
              updatePlayer({ companions: [...player.companions, newShadow] });
              addLog(`그림자 추출에 성공했습니다: ${newShadow.name}`, 'gain');
          } else {
              addLog("그림자가 저항하여 추출에 실패했습니다.", 'info');
          }
          setIsExtracting(false);
          setAnimState('NORMAL');
          setGameState('IDLE');
      }, 2000);
  };

  return (
    <div className="flex-1 bg-system-panel/50 border border-system-blue/30 rounded-lg p-6 backdrop-blur-sm flex flex-col min-h-[450px]">
        {gameState === 'IDLE' && (
            <div className="flex-1 flex flex-col justify-center items-center gap-8">
                <div className="text-center">
                    <h3 className="text-xl font-black text-system-blue tracking-[0.4em] mb-2">GATE SELECTION</h3>
                    <p className="text-[10px] text-gray-500 font-bold">공략할 게이트 등급을 선택하십시오</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
                    {Object.values(Rank).map(rank => (
                        <button 
                            key={rank} 
                            onClick={() => startCombat(rank)} 
                            className="group relative p-5 bg-black/60 border border-gray-800 rounded-lg hover:border-system-blue transition-all overflow-hidden hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-system-blue/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className={`text-3xl font-black italic block mb-1 ${getRankColor(rank)}`}>{rank}</span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">GATE ENTRANCE</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => setGameState('SHOP')} className="px-12 py-3 border border-yellow-500/50 text-yellow-500 font-bold text-xs tracking-[0.3em] hover:bg-yellow-500/20 transition-all rounded-full shadow-[0_0_15px_rgba(234,179,8,0.2)]">시스템 상점 입장</button>
            </div>
        )}

        {gameState === 'COMBAT' && currentEnemy && (
            <div className={`flex-1 flex flex-col ${animState === 'HIT' ? 'animate-glitch' : ''}`}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black text-system-blue border border-system-blue/50 px-2 py-0.5 rounded">WAVE {currentWave}/{maxWaves}</span>
                            {currentEnemy.isBoss && <span className="text-[9px] font-black text-red-500 animate-pulse">[BOSS]</span>}
                        </div>
                        <h2 className="text-2xl font-black text-white italic">{currentEnemy.name}</h2>
                    </div>
                    <span className={`text-4xl font-black italic ${getRankColor(currentGateRank)}`}>{currentGateRank}</span>
                </div>

                {/* 웨이브 진행 바 */}
                <div className="w-full h-1 bg-gray-900 rounded-full mb-10 overflow-hidden">
                    <div className="h-full bg-system-blue transition-all duration-500" style={{ width: `${(currentWave / maxWaves) * 100}%` }}></div>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center gap-12">
                    <div className="w-full max-w-md relative">
                        <div className="flex justify-between text-[10px] mb-2 font-mono">
                            <span className="text-red-500 font-bold">ENEMY HP</span>
                            <span className="text-white">{currentEnemy.hp.toLocaleString()} / {currentEnemy.maxHp.toLocaleString()}</span>
                        </div>
                        <div className="h-5 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden relative">
                            <div className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-400 transition-all duration-300" style={{ width: `${(currentEnemy.hp / currentEnemy.maxHp) * 100}%` }}></div>
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:50px_50px] animate-scanline"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        <button onClick={handleAttack} className="group relative py-5 bg-red-600 hover:bg-red-500 text-black font-black italic tracking-widest rounded shadow-lg transition-all active:scale-95 overflow-hidden">
                            <span className="relative z-10">⚔️ 일반 공격</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </button>
                        <button className="py-5 bg-gray-800 text-gray-500 font-black italic tracking-widest rounded cursor-not-allowed border border-gray-700">⚡ 특수 스킬 (잠김)</button>
                    </div>
                </div>
            </div>
        )}

        {gameState === 'VICTORY' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-system-blue/10 border-2 border-system-blue rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,168,255,0.4)]">
                    <span className="text-3xl">🏆</span>
                </div>
                <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2">DUNGEON CLEAR</h2>
                <p className="text-[11px] text-gray-500 mb-10 tracking-widest font-bold">시스템이 공략 성공을 확인했습니다</p>
                
                <div className="flex flex-col gap-4 w-full max-w-xs">
                    {player.job !== PlayerClass.NONE && (
                        <button 
                            onClick={handleExtraction}
                            disabled={isExtracting}
                            className={`py-4 bg-purple-900 border-2 border-purple-500 text-white font-black italic tracking-[0.5em] rounded shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all ${isExtracting ? 'animate-pulse opacity-50' : 'hover:bg-purple-800'}`}
                        >
                            {isExtracting ? '추출 진행 중...' : '일어나라'}
                        </button>
                    )}
                    <button onClick={() => setGameState('IDLE')} className="py-3 text-[10px] text-gray-500 font-black hover:text-white transition-colors underline underline-offset-8 tracking-widest">GATE EXIT</button>
                </div>
            </div>
        )}

        {gameState === 'SHOP' && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-300 overflow-hidden">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-2xl font-black text-yellow-500 italic tracking-widest">SYSTEM STORE</h2>
                    <button onClick={() => setGameState('IDLE')} className="text-[11px] font-bold text-gray-500 hover:text-white transition-colors">BACK [ESC]</button>
                </div>

                {/* 카테고리 필터 */}
                <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto pb-2 custom-scrollbar">
                    {(['ALL', 'CONSUMABLE', 'WEAPON', 'ARMOR'] as ShopCategory[]).map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setShopCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all whitespace-nowrap border ${shopCategory === cat ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-black/40 text-gray-500 border-gray-800 hover:border-gray-600'}`}
                        >
                            {cat === 'ALL' ? '전체' : cat === 'CONSUMABLE' ? '소모품' : cat === 'WEAPON' ? '무기' : '방어구'}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {filteredItems.map(item => (
                        <div key={item.id} className="p-4 bg-black/40 border border-gray-800 rounded-lg flex justify-between items-center group hover:border-yellow-500/40 transition-all">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="font-bold text-white group-hover:text-yellow-400 transition-colors">{item.name}</h4>
                                    <span className="text-[8px] font-black px-1.5 bg-gray-800 text-gray-400 rounded-sm">{item.type}</span>
                                </div>
                                <p className="text-[10px] text-gray-500">{item.description}</p>
                            </div>
                            <button 
                                onClick={() => {
                                    if (player.gold >= item.price) {
                                        updatePlayer({ gold: player.gold - item.price, inventory: [...player.inventory, {...item, uid: Math.random().toString(36), isEquipped: false}] });
                                        addLog(`${item.name} 구매 완료.`, 'gain');
                                    } else {
                                        addLog("금이 부족하여 구매할 수 없습니다.", 'info');
                                    }
                                }}
                                className="ml-4 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black font-black text-[11px] rounded shadow-md transition-all active:scale-95 whitespace-nowrap"
                            >
                                {item.price.toLocaleString()} G
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};
