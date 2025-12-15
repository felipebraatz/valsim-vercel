/**
 * Valorant Economy System
 * Implements competitive Valorant economy rules
 */

// ==================== CONSTANTS ====================

const ECONOMY = {
    // Credit Limits
    MAX_CREDITS: 9000,
    INITIAL_CREDITS: 800,
    OVERTIME_CREDITS: 5000,

    // Configuration requested
    MIN_NEXT_ROUND_BUY: 3300, // Valor mínimo garantido para o próximo round

    // Round Rewards
    WIN_BONUS: 3000,

    // Loss Streak Bonuses
    LOSS_BONUS: {
        1: 1900,  // First loss
        2: 2400,  // Second consecutive loss
        3: 2900   // Third+ consecutive loss (caps here)
    },

    // Extra Rewards
    KILL_BONUS: 200,
    SPIKE_PLANT_BONUS: 300
};

// Equipment Prices
const EQUIPMENT_PRICES = {
    // Armor
    armor: {
        none: 0,
        light: 400,
        heavy: 1000
    },
    // Weapons
    eco: {
        classic: 0,
        shorty: 300,
        ghost: 500,
        sheriff: 800
    },
    force: {
        stinger: 1100,
        spectre: 1600,
        judge: 1850
    },
    meta: {
        bulldog: 2050,
        guardian: 2250,
        outlaw: 2400,
        vandal: 2900,
        phantom: 2900
    },
    power: {
        odin: 3200,
        operator: 4700
    }
};

// Buy States
const BUY_STATE = {
    PISTOL: 'PISTOL',
    ECO: 'ECO',
    FORCE: 'FORCE_BUY',
    FULL: 'FULL_BUY',
    HERO: 'HERO_BUY'
};

// Role-based loadout preferences
const ROLE_LOADOUT_CONFIG = {
    'Duelist': {
        ecoWeapon: 'sheriff',
        forceWeapon: 'spectre',
        fullWeapon: 'vandal',
        ecoMultiplier: 0.6,
        forceMultiplier: 0.8,
        fullMultiplier: 1.0,
        utilityDependency: 0.2
    },
    'Controller': {
        ecoWeapon: 'sheriff',
        forceWeapon: 'stinger',
        fullWeapon: 'phantom',
        ecoMultiplier: 0.4,
        forceMultiplier: 0.65,
        fullMultiplier: 1.0,
        utilityDependency: 0.4
    },
    'Initiator': {
        ecoWeapon: 'ghost',
        forceWeapon: 'spectre',
        fullWeapon: 'phantom',
        ecoMultiplier: 0.4,
        forceMultiplier: 0.7,
        fullMultiplier: 1.0,
        utilityDependency: 0.5
    },
    'Sentinel': {
        ecoWeapon: 'sheriff',
        forceWeapon: 'stinger',
        fullWeapon: 'vandal',
        ecoMultiplier: 0.5,
        forceMultiplier: 0.75,
        fullMultiplier: 1.0,
        utilityDependency: 0.3
    },
    'Flex': {
        ecoWeapon: 'sheriff',
        forceWeapon: 'spectre',
        fullWeapon: 'vandal',
        ecoMultiplier: 0.5,
        forceMultiplier: 0.75,
        fullMultiplier: 1.0,
        utilityDependency: 0.3
    }
};

// ==================== ECONOMY MANAGER ====================

class EconomyManager {
    constructor() {
        this.teamACredits = [];
        this.teamBCredits = [];
        this.teamALossStreak = 0;
        this.teamBLossStreak = 0;
        this.currentRound = 0;
    }

    initialize() {
        this.currentRound = 1;
        this.teamALossStreak = 0;
        this.teamBLossStreak = 0;
        this.teamACredits = Array(5).fill(ECONOMY.INITIAL_CREDITS);
        this.teamBCredits = Array(5).fill(ECONOMY.INITIAL_CREDITS);
    }

    // Reset para o Round 13 (Virada de Lado / Halftime)
    resetHalftime() {
        this.teamALossStreak = 0;
        this.teamBLossStreak = 0;
        // Todos voltam para 800 créditos (pistol round)
        this.teamACredits = Array(5).fill(ECONOMY.INITIAL_CREDITS);
        this.teamBCredits = Array(5).fill(ECONOMY.INITIAL_CREDITS);
    }

    initializeOvertime() {
        this.teamACredits = Array(5).fill(ECONOMY.OVERTIME_CREDITS);
        this.teamBCredits = Array(5).fill(ECONOMY.OVERTIME_CREDITS);
        this.teamALossStreak = 0;
        this.teamBLossStreak = 0;
    }

    getTeamAverage(team) {
        const credits = team === 'A' ? this.teamACredits : this.teamBCredits;
        return Math.floor(credits.reduce((a, b) => a + b, 0) / credits.length);
    }

    getLossBonus(streak) {
        if (streak >= 3) return ECONOMY.LOSS_BONUS[3];
        return ECONOMY.LOSS_BONUS[streak] || ECONOMY.LOSS_BONUS[1];
    }

    updateAfterRound(winner, roundStats) {
        const winnerTeam = winner === 'A' ? 'teamA' : 'teamB';
        const loserTeam = winner === 'A' ? 'teamB' : 'teamA';

        // Update loss streaks
        if (winner === 'A') {
            this.teamALossStreak = 0;
            this.teamBLossStreak++;
        } else {
            this.teamBLossStreak = 0;
            this.teamALossStreak++;
        }

        // Calculate rewards
        const winBonus = ECONOMY.WIN_BONUS;
        const lossBonus = this.getLossBonus(
            winner === 'A' ? this.teamBLossStreak : this.teamALossStreak
        );

        const spikePlantBonus = roundStats.spikePlanted ? ECONOMY.SPIKE_PLANT_BONUS : 0;
        const winnerKills = (roundStats.playerKills && roundStats.playerKills[winner]) || [0, 0, 0, 0, 0];
        const loserKills = (roundStats.playerKills && roundStats.playerKills[winner === 'A' ? 'B' : 'A']) || [0, 0, 0, 0, 0];

        // Update winner team
        const winnerCredits = this[`${winnerTeam}Credits`];
        for (let i = 0; i < winnerCredits.length; i++) {
            let earned = winBonus + spikePlantBonus;
            const playerKills = winnerKills[i] || 0;
            earned += playerKills * ECONOMY.KILL_BONUS;
            winnerCredits[i] = Math.min(winnerCredits[i] + earned, ECONOMY.MAX_CREDITS);
        }

        // Update loser team
        const loserCredits = this[`${loserTeam}Credits`];
        for (let i = 0; i < loserCredits.length; i++) {
            let earned = lossBonus;
            const playerKills = loserKills[i] || 0;
            earned += playerKills * ECONOMY.KILL_BONUS;
            loserCredits[i] = Math.min(loserCredits[i] + earned, ECONOMY.MAX_CREDITS);
        }

        this.currentRound++;
    }
}

// ==================== LOADOUT DECIDER ====================

class LoadoutDecider {
    static decideBuyState(averageCredits, enemyAverageCredits, lossStreak, currentRound = 1, wonLastRound = false) {
        // Round 1 e 13 são Pistol Rounds
        if (currentRound === 1 || currentRound === 13) {
            return BUY_STATE.PISTOL;
        }

        const fullBuyThreshold = 3700;
        const forceBuyThreshold = 2000;

        // Round 2 e 14 (Pós-Pistol): Vencedor força, Perdedor faz eco
        if (currentRound === 2 || currentRound === 14) {
            if (wonLastRound) {
                return BUY_STATE.FORCE;
            } else {
                return BUY_STATE.ECO;
            }
        }

        // Post-round logic (Rounds 3+ e 15+)
        if (wonLastRound) {
            if (averageCredits >= fullBuyThreshold) return BUY_STATE.FULL;
            if (averageCredits >= forceBuyThreshold) return BUY_STATE.FORCE;
            return BUY_STATE.ECO;
        } else {
            if (lossStreak === 1 && averageCredits < fullBuyThreshold) return BUY_STATE.ECO;
            if (lossStreak === 2) return averageCredits >= fullBuyThreshold ? BUY_STATE.FULL : BUY_STATE.ECO;
            if (lossStreak >= 3) {
                if (averageCredits >= fullBuyThreshold) return BUY_STATE.FULL;
                if (averageCredits >= forceBuyThreshold) return BUY_STATE.FORCE;
                return BUY_STATE.ECO;
            }
            if (averageCredits >= fullBuyThreshold) return BUY_STATE.FULL;
            if (averageCredits >= forceBuyThreshold && lossStreak >= 2) return BUY_STATE.FORCE;
            return BUY_STATE.ECO;
        }
    }

    static getPistolLoadout(role, credits) {
        const random = Math.random();
        let loadout = { weapon: 'classic', armor: 'none', cost: 0, multiplier: 1.0 };

        // Duelistas agressivos (Ghost ou Colete)
        if ((role === 'Duelist' || role === 'Flex') && random < 0.5) {
            loadout.weapon = 'classic';
            loadout.armor = 'light';
            loadout.cost = 400;
            loadout.multiplier = 0.85;
            return loadout;
        }

        // Padrão Ghost
        if (random < 0.35) {
            loadout.weapon = 'ghost';
            loadout.armor = 'none';
            loadout.cost = 500;
            loadout.multiplier = 0.9;
            return loadout;
        }

        // Suportes guardando dinheiro para utilitário
        if ((role === 'Controller' || role === 'Initiator' || role === 'Sentinel') && random < 0.7) {
            loadout.weapon = 'classic';
            loadout.armor = 'none';
            loadout.cost = 0;
            loadout.multiplier = 0.75;
            return loadout;
        }

        // Sheriff ocasional (Reyna/Jett smurfs)
        if (role === 'Duelist' && random > 0.8) {
            loadout.weapon = 'sheriff';
            loadout.armor = 'none';
            loadout.cost = 800;
            loadout.multiplier = 1.1;
            return loadout;
        }

        // Default
        loadout.weapon = 'classic';
        loadout.armor = 'light';
        loadout.cost = 400;
        loadout.multiplier = 0.8;
        return loadout;
    }

    static getLoadout(role, buyState, credits, currentRound = 0, lossStreak = 0) {
        const config = ROLE_LOADOUT_CONFIG[role] || ROLE_LOADOUT_CONFIG['Flex'];
        let loadout = { weapon: 'classic', armor: 'none', cost: 0, multiplier: 1.0 };

        // Reserva de orçamento para utilitário
        let weaponBudget = credits;
        const isRichForce = buyState === BUY_STATE.FORCE && credits > 2800;

        if (!isRichForce && (buyState === BUY_STATE.FULL || buyState === BUY_STATE.FORCE)) {
            // Roles dependentes de utilitário reservam dinheiro
            if (config.utilityDependency >= 0.4) {
                weaponBudget = Math.max(0, credits - 600);
            } else if (config.utilityDependency >= 0.3) {
                weaponBudget = Math.max(0, credits - 400);
            }
        }

        switch (buyState) {
            case BUY_STATE.PISTOL:
                return this.getPistolLoadout(role, credits);

            case BUY_STATE.ECO:
                // Lógica de Sheriff para tentar roubar rounds
                let canBuySheriff = false;
                // No round 2 (se perdeu pistol), calcula se dá pra comprar sheriff e ainda ter full buy no round 3
                if (currentRound === 2) {
                    const nextLossBonus = ECONOMY.LOSS_BONUS[Math.min(lossStreak + 1, 3)] || 2400;
                    const sheriffCost = 800;
                    const futureMoney = (credits - sheriffCost) + nextLossBonus;
                    if (futureMoney >= ECONOMY.MIN_NEXT_ROUND_BUY) {
                        canBuySheriff = true;
                    }
                } else {
                    if (credits > 1400) canBuySheriff = true;
                }

                if (canBuySheriff) {
                    loadout.weapon = 'sheriff';
                    loadout.cost = 800;
                    loadout.multiplier = config.ecoMultiplier + 0.1;
                } else {
                    loadout.weapon = config.ecoWeapon;
                    // Se a config diz Sheriff mas não temos dinheiro, cai pra Classic
                    if (loadout.weapon === 'sheriff' && !canBuySheriff) {
                        loadout.weapon = 'classic';
                        loadout.cost = 0;
                        loadout.multiplier = 0.8;
                    } else {
                        loadout.cost = this.getWeaponPrice(config.ecoWeapon);
                        loadout.multiplier = config.ecoMultiplier;
                    }
                }
                loadout.armor = 'none';
                break;

            case BUY_STATE.FORCE:
                // === NOVA LÓGICA: FORCE "FULL" NO PÓS-PISTOL (Round 2 e 14) ===
                // O vencedor do pistol tenta comprar Vandal/Phantom + Colete Leve (Bonus Aggressive)
                if (currentRound === 2 || currentRound === 14) {
                    const fullWeaponPrice = this.getWeaponPrice(config.fullWeapon); // ~2900

                    // 1. Opção Agressiva: Vandal/Phantom + Colete Leve (3300 créditos)
                    if (weaponBudget >= fullWeaponPrice + 400) {
                        loadout.weapon = config.fullWeapon;
                        loadout.armor = 'light';
                        loadout.cost = fullWeaponPrice + 400;
                        // Multiplicador levemente reduzido por ser colete leve
                        loadout.multiplier = config.fullMultiplier * 0.95;
                        return loadout;
                    }

                    // 2. Opção Segura: Bulldog + Colete Pesado (3050 créditos)
                    if (weaponBudget >= 2050 + 1000) {
                        loadout.weapon = 'bulldog';
                        loadout.armor = 'heavy';
                        loadout.cost = 3050;
                        loadout.multiplier = config.forceMultiplier + 0.25;
                        return loadout;
                    }
                }

                // === LÓGICA PADRÃO DE FORCE (Rounds normais) ===
                if (weaponBudget >= 2050 + 400) {
                    if (weaponBudget >= 2250 + 400 && Math.random() > 0.7) {
                        loadout.weapon = 'guardian';
                        loadout.cost = 2250;
                        loadout.multiplier = config.forceMultiplier + 0.2;
                    } else {
                        loadout.weapon = 'bulldog';
                        loadout.cost = 2050;
                        loadout.multiplier = config.forceMultiplier + 0.15;
                    }
                } else {
                    loadout.weapon = config.forceWeapon;
                    loadout.cost = this.getWeaponPrice(config.forceWeapon);
                    loadout.multiplier = config.forceMultiplier;
                }

                // Define armadura do Force
                if (isRichForce && weaponBudget - loadout.cost >= 1000) {
                    loadout.armor = 'heavy';
                    loadout.cost += 1000;
                } else {
                    loadout.armor = weaponBudget - loadout.cost >= 400 ? 'light' : 'none';
                    loadout.cost += (loadout.armor === 'light' ? 400 : 0);
                }
                break;

            case BUY_STATE.FULL:
            case BUY_STATE.HERO:
                const metaPrice = this.getWeaponPrice(config.fullWeapon);
                const heavyArmorPrice = 1000;

                // Prioridade 1: Vandal/Phantom + Heavy
                if (weaponBudget >= metaPrice + heavyArmorPrice) {
                    loadout.weapon = config.fullWeapon;
                    loadout.armor = 'heavy';
                    loadout.multiplier = config.fullMultiplier;
                    loadout.cost = metaPrice + heavyArmorPrice;
                }
                // Prioridade 2: Bulldog + Heavy (Forçar compra com pouca grana)
                else if (weaponBudget >= 2050 + heavyArmorPrice) {
                    loadout.weapon = 'bulldog';
                    loadout.armor = 'heavy';
                    loadout.multiplier = config.fullMultiplier * 0.9;
                    loadout.cost = 2050 + heavyArmorPrice;
                }
                // Prioridade 3: Vandal + Light (Glass Cannon)
                else if (weaponBudget >= metaPrice + 400) {
                    loadout.weapon = config.fullWeapon;
                    loadout.armor = 'light';
                    loadout.multiplier = config.fullMultiplier * 0.95;
                    loadout.cost = metaPrice + 400;
                }
                // Fallback: Spectre + Heavy
                else {
                    loadout.weapon = 'spectre';
                    loadout.armor = 'heavy';
                    loadout.multiplier = config.forceMultiplier;
                    loadout.cost = 1600 + 1000;
                }
                break;
        }
        return loadout;
    }

    static getWeaponPrice(weaponName) {
        for (const tier of Object.values(EQUIPMENT_PRICES)) {
            if (typeof tier === 'object' && tier[weaponName] !== undefined) {
                return tier[weaponName];
            }
        }
        return 0;
    }

    static getTeamMultiplier(team, buyState) {
        const multipliers = team.map(player => {
            const config = ROLE_LOADOUT_CONFIG[player.role] || ROLE_LOADOUT_CONFIG['Flex'];
            switch (buyState) {
                case BUY_STATE.ECO: return config.ecoMultiplier;
                case BUY_STATE.FORCE: return config.forceMultiplier;
                case BUY_STATE.FULL:
                case BUY_STATE.HERO: return config.fullMultiplier;
                default: return 1.0;
            }
        });
        return multipliers.reduce((a, b) => a + b, 0) / multipliers.length;
    }
}

// Export for use in simulation.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EconomyManager, LoadoutDecider, ECONOMY, BUY_STATE };
}