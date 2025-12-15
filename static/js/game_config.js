const WEAPON_POWER = {
    'operator': 3.5,
    'odin': 3.0,
    'vandal': 3.0,
    'phantom': 3.0,
    'guardian': 2.2,
    'bulldog': 2.2,
    'outlaw': 2.2,
    'spectre': 1.8,
    'ares': 1.8,
    'judge': 1.8,
    'sheriff': 1.6,
    'marshall': 1.6,
    'ghost': 1.3,
    'frenzy': 1.3,
    'classic': 1.0,
    'shorty': 1.0,
    'stinger': 1.1
};

// ==================== GAME CONFIG CLASS ====================

class GameConfig {
    // ==================== ROLE MODIFIERS ====================
    static ROLE_MODIFIERS = {
        'Duelist': {
            kill: 1.2,
            death: 1.1,
            assist: 0.8,
            firstBlood: 1.5,
            utilityDependency: 0.2  // Low dependency on utilities
        },
        'Controller': {
            kill: 0.9,
            death: 0.9,
            assist: 1.3,
            clutch: 1.1,
            utilityDependency: 0.5  // High dependency on utilities
        },
        'Initiator': {
            kill: 1.0,
            death: 1.0,
            assist: 1.4,
            opening: 1.1,
            utilityDependency: 0.35  // Medium dependency on utilities
        },
        'Sentinel': {
            kill: 0.9,
            death: 0.8,
            assist: 1.0,
            defense: 1.3,
            utilityDependency: 0.5  // High dependency on utilities
        },
        'Flex': {
            kill: 1.0,
            death: 1.0,
            assist: 1.0,
            utilityDependency: 0.3  // Medium dependency on utilities
        }
    };

    // ==================== UTILITY TIERS ====================
    static UTILITY_TIERS = {
        NONE: { cost: 0, bonus: 0.0, name: 'Save' },
        LOW: { cost: 200, bonus: 0.05, name: 'Low Util' },
        MED: { cost: 400, bonus: 0.10, name: 'Med Util' },
        HIGH: { cost: 500, bonus: 0.18, name: 'Full Util' }
    };

    // ==================== UTILITY PURCHASE PRIORITY ====================
    static UTILITY_PURCHASE_PRIORITY = {
        'Duelist': {
            priority: 'LOW',
            minTierOnGoodEcon: 'LOW',
            preferUtilOverGun: false,
            description: 'Foca em arma'
        },
        'Initiator': {
            priority: 'VERY_HIGH',
            minTierOnGoodEcon: 'HIGH',
            preferUtilOverGun: true,
            forceMinTier: 'MED',
            description: 'Precisa de utilitário para info'
        },
        'Controller': {
            priority: 'HIGH',
            minTierOnGoodEcon: 'HIGH',
            preferUtilOverGun: true,
            forceMinTier: 'LOW',
            maxTier: 'HIGH',
            description: 'Controladores precisam de skills'
        },
        'Sentinel': {
            priority: 'DYNAMIC',
            defense: {
                minTierOnGoodEcon: 'HIGH',
                preferUtilOverGun: true,
                forceMinTier: 'MED',
                description: 'Full setup na defesa'
            },
            attack: {
                minTierOnGoodEcon: 'LOW',
                preferUtilOverGun: false,
                forceMinTier: 'NONE',
                description: 'Menos util no ataque'
            }
        },
        'Flex': {
            priority: 'MEDIUM',
            minTierOnGoodEcon: 'MED',
            preferUtilOverGun: false,
            forceMinTier: 'LOW',
            description: 'Equilibrado'
        }
    };

    // ==================== BALANCE PARAMETERS ====================
    static BALANCE = {
        // Dynamic penalty based on Gamesense after losing First Kill
        firstKillPenalty: {
            highGS: 0.10,    // Gamesense 15-20: 10% penalty
            mediumGS: 0.15,  // Gamesense 10-14: 15% penalty
            lowGS: 0.25      // Gamesense 1-9: 25% penalty
        },

        // Variance multipliers for eco rounds (more chaos/RNG)
        ecoVariance: {
            ecoVsFull: 0.30,    // +30% variance when ECO vs FULL
            forceVsFull: 0.15   // +15% variance when FORCE vs FULL
        },

        // Ajuste para média de kills
        killDistribution: {
            stomp: { min: 80, survivorsMin: 5, survivorsMax: 6 },
            dominate: { min: 65, survivorsMin: 4, survivorsMax: 5 },
            win: { min: 55, survivorsMin: 3, survivorsMax: 4 },
            close: { min: 50, survivorsMin: 2, survivorsMax: 3 },
            default: { survivorsMin: 3, survivorsMax: 4 }
        },

        // Role-specific utility impact
        utilityRoleModifiers: {
            'Controller': {
                noPenalty: -0.15,
                lowPenalty: -0.05,
                highBonus: 0.05
            },
            'Sentinel': {
                noPenalty: -0.15,
                lowPenalty: -0.05,
                highBonus: 0.05
            },
            'Initiator': {
                noPenalty: -0.10,
                lowPenalty: -0.03,
                highBonus: 0.05
            },
            'Duelist': {
                noPenalty: 0,
                lowPenalty: 0,
                highBonus: 0.10
            },
            'Flex': {
                noPenalty: -0.05,
                lowPenalty: -0.02,
                highBonus: 0.03
            }
        },

        tacticalFatiguePenalty: 0.85,
        tacticalFatigueThreshold: 3
    };

    // ==================== ECONOMY CONSTANTS ====================
    static ECONOMY = {
        MAX_CREDITS: 9000,
        INITIAL_CREDITS: 800,
        OVERTIME_CREDITS: 5000,
        WIN_BONUS: 3000,
        LOSS_BONUS: {
            1: 1900,
            2: 2400,
            3: 2900
        },
        KILL_BONUS: 200,
        SPIKE_PLANT_BONUS: 300
    };

    // ==================== EQUIPMENT PRICES ====================
    static EQUIPMENT_PRICES = {
        armor: {
            none: 0,
            light: 400,
            heavy: 1000
        },
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

    // ==================== BUY STATES ====================
    static BUY_STATE = {
        ECO: 'ECO',
        FORCE: 'FORCE_BUY',
        FULL: 'FULL_BUY',
        HERO: 'HERO_BUY'
    };

    // ==================== HELPER FUNCTIONS ====================

    /**
     * Get dynamic penalty based on team's average Gamesense
     */
    static getFirstKillPenalty(averageGamesense) {
        if (averageGamesense >= 15) return this.BALANCE.firstKillPenalty.highGS;
        if (averageGamesense >= 10) return this.BALANCE.firstKillPenalty.mediumGS;
        return this.BALANCE.firstKillPenalty.lowGS;
    }

    /**
     * Get kill distribution based on win chance percentage
     */
    static getKillDistribution(winChancePercent) {
        const dist = this.BALANCE.killDistribution;
        const chance = winChancePercent * 100;

        if (chance >= dist.stomp.min) return { min: dist.stomp.survivorsMin, max: dist.stomp.survivorsMax };
        if (chance >= dist.dominate.min) return { min: dist.dominate.survivorsMin, max: dist.dominate.survivorsMax };
        if (chance >= dist.win.min) return { min: dist.win.survivorsMin, max: dist.win.survivorsMax };
        return { min: dist.close.survivorsMin, max: dist.close.survivorsMax };
    }

    /**
     * Calculate utility multiplier based on role and utility tier
     */
    static getUtilityMultiplier(role, utilityTier, baseMultiplier = 1.0) {
        // Fallback safety
        if (!this.UTILITY_TIERS[utilityTier]) utilityTier = 'NONE';

        const tierBonus = this.UTILITY_TIERS[utilityTier].bonus;
        let multiplier = baseMultiplier + tierBonus;

        const roleModifiers = this.BALANCE.utilityRoleModifiers[role] || this.BALANCE.utilityRoleModifiers['Flex'];

        if (utilityTier === 'NONE') {
            multiplier += roleModifiers.noPenalty;
        } else if (utilityTier === 'LOW') {
            multiplier += roleModifiers.lowPenalty;
        } else if (utilityTier === 'HIGH') {
            multiplier += roleModifiers.highBonus;
        }

        return multiplier;
    }

    /**
     * Get variance multiplier for eco rounds
     */
    static getEcoVariance(teamBuyState, enemyBuyState) {
        if (teamBuyState === this.BUY_STATE.ECO && enemyBuyState === this.BUY_STATE.FULL) {
            return this.BALANCE.ecoVariance.ecoVsFull;
        }
        if (teamBuyState === this.BUY_STATE.FORCE && enemyBuyState === this.BUY_STATE.FULL) {
            return this.BALANCE.ecoVariance.forceVsFull;
        }
        return 0;
    }

    /**
     * Decide which utility tier a player should buy
     */
    static decideUtilityTier(role, availableCredits, buyState, isDefense = true) {
        // 1. Eco Estrito
        if (buyState === 'ECO') {
            if (availableCredits > 1500) return 'LOW';
            return 'NONE';
        }

        // 2. Full Buy / Hero Buy
        if (buyState === 'FULL_BUY' || buyState === 'HERO_BUY') {
            if (availableCredits >= this.UTILITY_TIERS.HIGH.cost) return 'HIGH';
            if (availableCredits >= this.UTILITY_TIERS.MED.cost) return 'MED';
            if (availableCredits >= this.UTILITY_TIERS.LOW.cost) return 'LOW';
            return 'NONE';
        }

        // 3. Force Buy
        const config = this.UTILITY_PURCHASE_PRIORITY[role] || this.UTILITY_PURCHASE_PRIORITY['Flex'];
        let effectiveConfig = config;

        if (role === 'Sentinel') {
            effectiveConfig = isDefense ? config.defense : config.attack;
        }

        const tiers = ['HIGH', 'MED', 'LOW'];

        for (let tier of tiers) {
            if (availableCredits >= this.UTILITY_TIERS[tier].cost) {
                return tier;
            }
        }

        return 'NONE';
    }

    /**
     * Helper to compare tier levels
     */
    static getTierLevel(tier) {
        const levels = { 'NONE': 0, 'LOW': 1, 'MED': 2, 'HIGH': 3 };
        return levels[tier] || 0;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}