/**
 * Valorant Simulation Logic
 * Connects GameConfig, Economy, and UI
 */

// ==================== GLOBAL STATE ====================
console.log("ValSim: simulation.js loaded"); // DEBUG LOG
let matchData = null;
let playerStats = { teamA: [], teamB: [] };
let currentRound = 1;
let scoreA = 0;
let scoreB = 0;
let teamAName = "Team A";
let teamBName = "Team B";
let seriesFormat = "BO1"; // "BO1", "BO3", "BO5"
let seriesScore = { A: 0, B: 0 };
let winsNeeded = 1;
let isOvertime = false;
let seriesHistory = []; // Stores map snapshots
let roundHistory = [];
// Sorting State
let currentSort = { key: 'kills', order: 'desc' };
// Economy removed

// Map Pool Logic
let mapPool = [];
let currentMapIndex = 0;

// Icons for Round History
const ROUND_ICONS = {
    elimination: '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20Z"/><circle cx="12" cy="12" r="4"/></svg>',
    boom: '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/></svg>',
    defuse: '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>',
    time: '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20Z"/><path d="M13 7H11V13H17V11H13z"/></svg>'
};

// ==================== INITIALIZATION ====================

function initializeMatch(data) {
    console.log("ValSim: initializeMatch called", data); // DEBUG LOG
    matchData = data;

    // Handle Map Pool (Check if backend sent a list, otherwise use single map)
    // IMPORTANT: The backend might send 'maps' as a list of objects or IDs. 
    // We assume the view passed full map objects in 'maps' or just single 'map'.
    if (data.maps && Array.isArray(data.maps) && data.maps.length > 0) {
        mapPool = data.maps;
    } else {
        mapPool = [data.map];
    }
    currentMapIndex = 0;

    // Update UI to show correct map immediately
    updateMapVisuals();

    teamAName = matchData.team_a.name;
    teamBName = matchData.team_b.name;

    // Initialize Players
    playerStats = {
        teamA: matchData.team_a.players.map(p => initializePlayer(p)),
        teamB: matchData.team_b.players.map(p => initializePlayer(p))
    };

    // Reset Game State
    currentRound = 1;
    scoreA = 0;
    scoreB = 0;
    isOvertime = false;
    roundHistory = [];

    // Initialize Series Logic
    seriesFormat = matchData.format || "BO1";
    if (seriesFormat === "BO3") winsNeeded = 2;
    else if (seriesFormat === "BO5") winsNeeded = 3;
    else winsNeeded = 1;

    // Reset series score on fresh load (simulated)
    seriesScore = { A: 0, B: 0 };
    updateSeriesUI();

    // HANDLE MAP POOL
    // If backend sends 'maps' (array) use it, otherwise use single 'map' object
    if (data.maps && Array.isArray(data.maps) && data.maps.length > 0) {
        mapPool = data.maps;
    } else {
        mapPool = [data.map];
    }
    currentMapIndex = 0;

    // UPDATE UI
    updateScoreUI();
    updatePlayerStatsUI();
    updateMapImage(); // <--- NEW FUNCTION CALL

    // Check Simulation Mode
    if (mode === 'quick') {
        setTimeout(() => { simulateInstantMatch(); }, 100);
    }
}

function initializePlayer(p) {
    // Use mental stat directly from database
    // Ensure stats object exists
    if (!p.stats) p.stats = {};

    // Use mental stat from database, or default to 10 if missing
    const mentalStat = p.stats.mental || 10;

    // CAPTURE THE CORRECT OVERALL FROM DB
    // Check p.overall first, then p.rating, then fallback to 50
    const dbOverall = p.overall || p.rating || 50;

    return {
        ...p,
        overall: dbOverall, // Store it explicitly
        kills: 0, deaths: 0, assists: 0,
        fk: 0, fd: 0,
        roundKills: 0,
        isDead: false,
        survived: true,
        playStyle: getPlayStyle(p.role),
        attributes: {
            aim: p.stats.aim || 10,
            gamesense: p.stats.gamesense || 10,
            support: p.stats.support || 10,
            clutch: p.stats.clutch || 10,
            mental: mentalStat
        }
    };
}

function getPlayStyle(role) {
    const styles = {
        'Duelist': ['Entry', 'Lurker'],
        'Controller': ['Anchor', 'Aggressive'],
        'Sentinel': ['Anchor', 'Lurker'],
        'Initiator': ['Aggressive', 'Support'],
        'Flex': ['Support', 'Aggressive']
    };
    const roleStyles = styles[role] || ['Standard'];
    return roleStyles[Math.floor(Math.random() * roleStyles.length)];
}

// ==================== SIMULATION LOGIC ====================

function simulateNextRound() {
    console.log("ValSim: simulateNextRound called. Current Round:", currentRound); // DEBUG LOG
    // 1. Check Overtime
    checkOvertimeStatus();

    // 2. Halftime / New Round Reset
    if (currentRound === 13 || currentRound === 25) {
        [...playerStats.teamA, ...playerStats.teamB].forEach(p => {
            p.survived = false;
            p.isDead = false;
            p.roundKills = 0;
        });
    } else {
        // Just reset round flags
        [...playerStats.teamA, ...playerStats.teamB].forEach(p => {
            p.isDead = false;
            p.roundKills = 0;
        });
    }

    // 3. Economy & Loadouts Removed

    // Determine sides (A starts Defense, swaps at 13)
    const teamADefends = currentRound < 13 || (currentRound > 24 && currentRound % 2 !== 0);

    // 4. Calculate Power & Winner
    const teamAPower = calculateTeamPower(playerStats.teamA, 'A');
    const teamBPower = calculateTeamPower(playerStats.teamB, 'B');
    const totalPower = teamAPower + teamBPower;
    const winChanceA = teamAPower / totalPower;

    let winningTeam, losingTeam, winnerKey, winCondition;
    const spikePlanted = Math.random() > 0.5;

    // RNG Winner Determination
    if (Math.random() < winChanceA) {
        winningTeam = playerStats.teamA;
        losingTeam = playerStats.teamB;
        winnerKey = 'A';
        scoreA++;
        winCondition = determineWinCondition(teamADefends, spikePlanted); // Team A is winner
    } else {
        winningTeam = playerStats.teamB;
        losingTeam = playerStats.teamA;
        winnerKey = 'B';
        scoreB++;
        winCondition = determineWinCondition(!teamADefends, spikePlanted); // Team B is winner
    }

    // 5. Distribute Kills/Deaths
    const probDiff = Math.abs(winChanceA - 0.5);
    const killDist = GameConfig.getKillDistribution(probDiff + (winnerKey === 'A' ? winChanceA : (1 - winChanceA))); // Estimate dominance

    // Simplification for reliability
    let winnerSurvivors = 3;
    let loserSurvivors = 0;

    if (probDiff > 0.25) { // Stomp
        winnerSurvivors = Math.random() > 0.5 ? 4 : 5;
        if (Math.random() > 0.7) loserSurvivors = 1;
    } else { // Close
        winnerSurvivors = Math.floor(Math.random() * 2) + 2; // 2 or 3
        if (Math.random() > 0.8) loserSurvivors = 1;
    }

    const winnerDeaths = 5 - winnerSurvivors;
    const loserDeaths = 5 - loserSurvivors;

    distributeRoundStats(winningTeam, losingTeam, winnerDeaths, loserDeaths);

    // 6. Update Economy Post-Round (Removed)
    // economyManager.updateAfterRound(winnerKey, roundStats);

    // Update survival status for next round logic
    [...playerStats.teamA, ...playerStats.teamB].forEach(p => {
        p.survived = !p.isDead;
    });

    // 7. Update UI & History
    updateScoreUI();
    updatePlayerStatsUI();

    roundHistory.push({
        round: currentRound,
        winner: winnerKey,
        condition: winCondition,
        score: `${scoreA}-${scoreB}`
    });

    // 8. Check End Game
    if (!checkMatchEnd()) {
        currentRound++;
        // If 2D mode, reset particles
        if (playersParticles.length > 0) initSimulationParticles();
    }
}

function determineWinCondition(winnerIsDefender, spikePlanted) {
    if (winnerIsDefender) {
        // Defenders won
        if (spikePlanted) return 'defuse'; // Ninja defuse or post-retake
        if (Math.random() > 0.7) return 'time';
        return 'elimination';
    } else {
        // Attackers won
        if (spikePlanted && Math.random() > 0.4) return 'boom';
        return 'elimination';
    }
}

function calculateTeamPower(team, teamName) {
    return team.reduce((sum, p) => {
        if (p.isDead) return sum; // Should be alive at start of round calculation

        const attr = p.attributes;
        let baseSkill = (attr.aim * 2) + (attr.gamesense * 1.5) + (attr.support * 1.0) + (attr.clutch * 0.5);

        let mentalMultiplier = 1.0;
        // Removed economy-based mental changes

        // Fixed Weapon Power (Vandal/Phantom equivalent)
        let weaponPower = 3.0;

        // Neutral Utility Multiplier
        const utilBonus = 1.0;

        return sum + (baseSkill * mentalMultiplier * weaponPower * utilBonus);
    }, 0);
}

function distributeRoundStats(winners, losers, winnerDeaths, loserDeaths) {
    // Kill Losers
    let losersAlive = losers.filter(p => !p.isDead);
    let deadCountL = 0;

    while (deadCountL < loserDeaths && losersAlive.length > 0) {
        const victim = getWeightedPlayer(losersAlive, 'death'); // Low survival/Low luck
        const killer = getWeightedPlayer(winners.filter(p => !p.isDead), 'kill'); // High aim

        victim.isDead = true;
        victim.deaths++;
        victim.survived = false;

        if (killer) {
            killer.kills++;
            killer.roundKills++;
            // Check for First Blood tracking would go here
        }

        losersAlive = losers.filter(p => !p.isDead);
        deadCountL++;
    }

    // Kill Winners (Trades)
    let winnersAlive = winners.filter(p => !p.isDead);
    let deadCountW = 0;

    while (deadCountW < winnerDeaths && winnersAlive.length > 0) {
        const victim = getWeightedPlayer(winnersAlive, 'death');
        const killer = getWeightedPlayer(losers, 'kill'); // Even dead players can have traded earlier

        victim.isDead = true;
        victim.deaths++;
        victim.survived = false;

        if (killer) {
            killer.kills++;
            killer.roundKills++;
        }

        winnersAlive = winners.filter(p => !p.isDead);
        deadCountW++;
    }
}

function getWeightedPlayer(team, type) {
    // Simple weighting
    if (team.length === 0) return null;
    return team[Math.floor(Math.random() * team.length)];
}

// assignPlayerLoadouts removed

// ==================== MATCH CONTROL & AUTOMATION ====================

function simulateInstantMatch() {
    // Hide controls
    const btnNext = document.getElementById('next-round-btn');
    const btnSim = document.getElementById('simulate-all-btn');
    if (btnNext) btnNext.classList.add('hidden');
    if (btnSim) btnSim.classList.add('hidden');

    let safetyBreak = 0;
    let matchEnded = false;

    // Fast loop
    while (!matchEnded && safetyBreak < 50) {
        simulateNextRound();
        if (checkMatchEndStateOnly()) {
            matchEnded = true;
        }
        safetyBreak++;
    }
}

function simulateFullMatch() {
    console.log("ValSim: simulateFullMatch called"); // DEBUG LOG
    const interval = setInterval(() => {
        if (checkMatchEndStateOnly() || document.getElementById('match-over-modal').classList.contains('hidden') === false) {
            clearInterval(interval);
        } else {
            simulateNextRound();
        }
    }, 200); // 200ms per round for visual effect
}

function checkMatchEndStateOnly() {
    if (!isOvertime) {
        if (scoreA >= 13 || scoreB >= 13) return true;
    } else {
        const diff = Math.abs(scoreA - scoreB);
        if (diff >= 2) return true;
    }
    return false;
}

function checkOvertimeStatus() {
    if (scoreA === 12 && scoreB === 12 && !isOvertime) {
        isOvertime = true;
        // Optional: Show OT indicator UI
    }
}

function checkMatchEnd() {
    let winner = null;
    if (!isOvertime) {
        if (scoreA >= 13) winner = teamAName;
        else if (scoreB >= 13) winner = teamBName;
    } else {
        const diff = Math.abs(scoreA - scoreB);
        if (diff >= 2) {
            winner = scoreA > scoreB ? teamAName : teamBName;
        }
    }

    if (winner) {
        endMatch(winner, Math.max(scoreA, scoreB), Math.min(scoreA, scoreB));
        return true;
    }
    return false;
}

// function endMatch(winner, winnerScore, loserScore) { ... rewritten below }

function endMatch(winner, winnerScore, loserScore) {
    const btnNextRound = document.getElementById('next-round-btn');
    const btnSimAll = document.getElementById('simulate-all-btn');
    if (btnNextRound) btnNextRound.classList.add('hidden');
    if (btnSimAll) btnSimAll.classList.add('hidden');

    // 1. Update Series Score
    const winnerKey = winner === matchData.team_a.name ? 'A' : 'B';
    seriesScore[winnerKey]++;
    updateSeriesUI();

    // 2. Check if Series is Over
    const isSeriesOver = seriesScore[winnerKey] >= winsNeeded;

    // 3. Populate Modal Data
    const scoreAEl = document.getElementById('modal-score-a-final');
    const scoreBEl = document.getElementById('modal-score-b-final');
    if (scoreAEl) scoreAEl.textContent = scoreA;
    if (scoreBEl) scoreBEl.textContent = scoreB;

    const winnerNameEl = document.querySelector('.winner-name');
    if (winnerNameEl) winnerNameEl.textContent = winner;

    const modalTitle = document.querySelector('#match-over-modal h1');
    const winnerTextDiv = document.getElementById('winner-text');

    // 4. Configure Modal based on Series State
    const btnNextMap = document.getElementById('btn-next-map');
    const btnRestart = document.getElementById('btn-restart');
    // Main Menu and New Match are generally <a> tags so we target them by hierarchy or assuming standard
    const footerDiv = document.querySelector('#match-over-modal .border-t');
    const footerButtons = footerDiv.querySelectorAll('a, button:not(#btn-next-map)');

    // Helper to get logo URL
    const winnerLogo = winner === matchData.team_a.name ? matchData.team_a.logo : matchData.team_b.logo;
    const logoHtml = winnerLogo ? `<img src="${winnerLogo}" class="w-10 h-10 object-contain inline-block mr-3 align-middle">` : '';

    if (isSeriesOver) {
        // SERIES OVER SCENARIO
        if (modalTitle) modalTitle.textContent = "SERIES WINNER";
        if (winnerTextDiv) {
            winnerTextDiv.innerHTML = `
                <div class="flex items-center justify-center gap-2 mb-2">
                    ${logoHtml}
                    <span class="font-bold text-white winner-name text-4xl align-middle">${winner}</span>
                </div>
                <div class="text-gray-400 text-lg mt-2">WINS THE SERIES <span class="text-white font-bold">${seriesScore.A} - ${seriesScore.B}</span></div>
            `;
        }

        // Show End Game Buttons
        if (btnNextMap) btnNextMap.classList.add('hidden');
        footerButtons.forEach(btn => btn.classList.remove('hidden'));

    } else {
        // NEXT MAP SCENARIO
        if (modalTitle) modalTitle.textContent = `MAP COMPLETE`;

        // Subtitle: Team X wins map. Series Score: 1-0
        if (winnerTextDiv) {
            winnerTextDiv.innerHTML = `
                <div class="flex items-center justify-center gap-2 mb-2">
                     ${logoHtml}
                     <span class="font-bold text-white text-3xl align-middle">${winner}</span> 
                     <span class="text-xl text-gray-400 align-middle">wins the map</span>
                </div>
                <div class="text-gray-400 text-base mt-1">SERIES SCORE: <span class="text-white font-bold">${seriesScore.A} - ${seriesScore.B}</span></div>
            `;
        }

        // Hide End Game Buttons, Show Next Map
        footerButtons.forEach(btn => btn.classList.add('hidden'));
        if (btnNextMap) btnNextMap.classList.remove('hidden');
    }

    // 5. Show Modal
    document.getElementById('match-over-modal').classList.remove('hidden');

    // 6. Stats Management
    // Save Snapshot
    seriesHistory.push({
        mapIndex: seriesHistory.length + 1,
        winner: winner,
        scoreA: Math.max(scoreA, scoreB) === scoreA ? scoreA : scoreB, // Assuming scoreA is teamA
        scoreB: Math.max(scoreA, scoreB) === scoreB ? scoreA : scoreB, // Logic needs to be careful here
        scoreA_real: scoreA,
        scoreB_real: scoreB,
        playerStats: {
            teamA: JSON.parse(JSON.stringify(playerStats.teamA)),
            teamB: JSON.parse(JSON.stringify(playerStats.teamB))
        }
    });

    // Render Stats
    if (isSeriesOver) {
        renderSeriesTabs();
        // Default to Overall Stats
        const aggregated = getAggregatedStats();
        renderModalTable(aggregated.teamA, 'modal-stats-a');
        renderModalTable(aggregated.teamB, 'modal-stats-b');
    } else {
        // Just show current map stats
        const tabsContainer = document.getElementById('series-tabs');
        if (tabsContainer) tabsContainer.innerHTML = ''; // Clear tabs if not series end

        renderModalTable(playerStats.teamA, 'modal-stats-a');
        renderModalTable(playerStats.teamB, 'modal-stats-b');
    }

    // Continue updating background UI
    updatePlayerStatsUI();
}

// Helper: Render Series Tabs
function renderSeriesTabs() {
    const container = document.getElementById('series-tabs');
    if (!container) return;

    container.innerHTML = '';

    // Shared Layout Classes (Enforces single line alignment)
    const layoutClasses = 'px-4 py-2 text-sm font-bold uppercase rounded transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap border';

    // State Specific Classes
    const activeClasses = 'bg-[#38bdf8] border-[#38bdf8] text-[#09090b] hover:bg-[#38bdf8]/90 shadow-[0_0_10px_rgba(56,189,248,0.3)]';
    const inactiveClasses = 'bg-[#16213e] border-white/10 text-gray-400 hover:text-white hover:border-white/30';

    // 1. Overall Button
    const overallBtn = document.createElement('button');
    overallBtn.className = `${layoutClasses} ${activeClasses}`; // Default Active
    overallBtn.innerHTML = `<span>Overall</span>`;
    overallBtn.onclick = () => {
        // Reset all buttons to inactive
        Array.from(container.children).forEach(btn => btn.className = `${layoutClasses} ${inactiveClasses}`);
        // Set this to active
        overallBtn.className = `${layoutClasses} ${activeClasses}`;

        const agg = getAggregatedStats();
        renderModalTable(agg.teamA, 'modal-stats-a');
        renderModalTable(agg.teamB, 'modal-stats-b');
    };
    container.appendChild(overallBtn);

    // 2. Map Buttons
    seriesHistory.forEach((map, index) => {
        const btn = document.createElement('button');
        btn.className = `${layoutClasses} ${inactiveClasses}`;

        // Map Winner Logo
        const mapWinnerLogo = map.winner === matchData.team_a.name ? matchData.team_a.logo : matchData.team_b.logo;
        // Ensure image is block-level within flex to prevent weird text alignment
        const logoImg = mapWinnerLogo ? `<img src="${mapWinnerLogo}" class="w-5 h-5 object-contain block">` : '';

        btn.innerHTML = `<span>Map ${index + 1}</span>${logoImg}`;

        btn.onclick = () => {
            // Reset all buttons to inactive
            Array.from(container.children).forEach(b => b.className = `${layoutClasses} ${inactiveClasses}`);
            // Set this to active
            btn.className = `${layoutClasses} ${activeClasses}`;

            renderModalTable(map.playerStats.teamA, 'modal-stats-a');
            renderModalTable(map.playerStats.teamB, 'modal-stats-b');
        };
        container.appendChild(btn);
    });
}

// Logic: Sorting
function setSort(key) {
    if (currentSort.key === key) {
        currentSort.order = currentSort.order === 'desc' ? 'asc' : 'desc';
    } else {
        currentSort.key = key;
        currentSort.order = 'desc'; // Default desc for new key
    }

    // Find active tab and trigger click to re-render with new sort
    const activeTab = document.querySelector('#series-tabs button.bg-\\[\\#38bdf8\\]');
    if (activeTab) {
        activeTab.click();
    } else {
        // Fallback if no series tabs (e.g. single map before series end, or simple re-render)
        // Since getAggregatedStats calculates on fly and renderModalTable sorts on fly, we just need to call render
        // But what data? 
        // If series tabs are hidden/empty, we are likely in "Map Complete" mode showing current map.
        // We can just re-render current playerStats.
        renderModalTable(playerStats.teamA, 'modal-stats-a');
        renderModalTable(playerStats.teamB, 'modal-stats-b');
    }
}

// Helper: Get Aggregated Stats
function getAggregatedStats() {
    // Deep clone first map structure to initialize
    // Limitation: Assumes player list doesn't change order/roster.

    // We'll create a fresh map of players by name to be safe
    const aggStats = { teamA: [], teamB: [] };

    // Initialize with roster names from first map (or current matchData)
    // We use matchData to ensure we have all players

    const initPlayer = (p) => ({
        name: p.name,
        role: p.role, // Assuming these don't change
        photo: p.photo, // Add photo
        kills: 0, deaths: 0, assists: 0,
        fk: 0, fd: 0,
        roundsPlayed: 0
    });

    const mapA = new Map();
    const mapB = new Map();

    // Sum up stats
    seriesHistory.forEach(map => {
        map.playerStats.teamA.forEach(p => {
            if (!mapA.has(p.name)) mapA.set(p.name, initPlayer(p));
            const entry = mapA.get(p.name);
            entry.kills += p.kills;
            entry.deaths += p.deaths;
            entry.assists += p.assists;
            // fk/fd if stored
        });
        map.playerStats.teamB.forEach(p => {
            if (!mapB.has(p.name)) mapB.set(p.name, initPlayer(p));
            const entry = mapB.get(p.name);
            entry.kills += p.kills;
            entry.deaths += p.deaths;
            entry.assists += p.assists;
        });
    });

    return {
        teamA: Array.from(mapA.values()),
        teamB: Array.from(mapB.values())
    };
}

// Helper: Render Table (Replaces internal generateRows)
// Helper: Render Table (Replaces internal generateRows)
function renderModalTable(teamData, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';

    // Sort Data based on currentSort global
    const sorted = [...teamData].sort((a, b) => {
        let valA, valB;
        // Handle K/D ratio sorting specifically
        if (currentSort.key === 'kd') {
            valA = a.deaths > 0 ? a.kills / a.deaths : a.kills;
            valB = b.deaths > 0 ? b.kills / b.deaths : b.kills;
        } else {
            valA = a[currentSort.key] || 0;
            valB = b[currentSort.key] || 0;
        }
        return currentSort.order === 'asc' ? valA - valB : valB - valA;
    });

    sorted.forEach(p => {
        const kd = p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : p.kills.toFixed(2);
        const kdColor = parseFloat(kd) >= 1.0 ? 'text-green-400' : 'text-gray-400';
        // Fallback image if photo is missing
        const photoUrl = p.photo ? p.photo : 'https://placehold.co/40';

        const row = `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="pl-4 pr-4 py-3 font-medium text-white truncate text-left flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-gray-800 overflow-hidden shrink-0 border border-gray-600">
                        <img src="${photoUrl}" class="w-full h-full object-cover">
                    </div>
                    <span>${p.name}</span>
                </td>
                <td class="px-2 py-3 text-center text-white font-mono font-semibold">${p.kills}</td>
                <td class="px-2 py-3 text-center text-gray-400 font-mono">${p.deaths}</td>
                <td class="px-2 py-3 text-center font-mono font-bold ${kdColor}">${kd}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}


function startNextMap() {
    // Increment Map Index
    currentMapIndex++;

    // Check if we ran out of maps (Safety)
    if (currentMapIndex >= mapPool.length) {
        currentMapIndex = 0; // Should ideally match is over before this happens
    }

    // Update the Visual Image
    updateMapVisuals();

    // Reset Map State
    currentRound = 1;
    scoreA = 0;
    scoreB = 0;
    isOvertime = false;
    roundHistory = [];

    // Reset Player Stats (KDA, Money, etc)
    playerStats.teamA.forEach(p => resetPlayerStats(p));
    playerStats.teamB.forEach(p => resetPlayerStats(p));

    // Reset UI
    updateScoreUI();
    updatePlayerStatsUI();

    // Clear Round History UI
    const historyContainer = document.getElementById('round-history-vis');
    if (historyContainer) historyContainer.innerHTML = '';

    // Hide Modal & Show Buttons
    document.getElementById('match-over-modal').classList.add('hidden');

    // Show Control Buttons
    const btnNextRound = document.getElementById('next-round-btn');
    const btnSimAll = document.getElementById('simulate-all-btn');
    if (btnNextRound) btnNextRound.classList.remove('hidden');
    if (btnSimAll) btnSimAll.classList.remove('hidden');

}

function updateMapVisuals() {
    const mapObj = mapPool[currentMapIndex];
    if (!mapObj) return;

    // Update Image
    const imgEl = document.getElementById('current-map-image');
    if (imgEl) {
        // Use the minimap URL from the data
        if (mapObj.minimap) {
            imgEl.src = mapObj.minimap;
            imgEl.style.display = 'block';
        } else {
            // Fallback or hide if no image
            imgEl.style.display = 'none';
        }
    }


}

function resetPlayerStats(p) {
    p.kills = 0;
    p.deaths = 0;
    p.assists = 0;
    p.fk = 0;
    p.fd = 0;
    p.roundKills = 0;
    p.isDead = false;
    p.survived = true;
    // Keep attributes/role/name same
}

function updateSeriesUI() {
    const container = document.getElementById('series-score');
    const winsA = document.getElementById('series-wins-a');
    const winsB = document.getElementById('series-wins-b');

    if (container && winsA && winsB) {
        if (seriesFormat === "BO1") {
            container.classList.add('hidden');
        } else {
            container.classList.remove('hidden');
            winsA.textContent = seriesScore.A;
            winsB.textContent = seriesScore.B;
        }
    }
}

// ==================== UI UPDATES ====================

function updateScoreUI() {
    const scoreAEl = document.getElementById('score-a');
    const scoreBEl = document.getElementById('score-b');
    const roundEl = document.getElementById('round-counter');

    if (scoreAEl) scoreAEl.textContent = scoreA;
    if (scoreBEl) scoreBEl.textContent = scoreB;
    if (roundEl) roundEl.textContent = currentRound;
}

function updatePlayerStatsUI() {
    // 1. Update In-Game Cards
    playerStats.teamA.forEach((p, index) => {
        const card = document.getElementById(`player-card-${index}-a`);
        if (card) {
            card.querySelector('.kda-display').textContent = `${p.kills}/${p.deaths}/${p.assists}`;
            updatePlayerCardUI(card, p, index, 0); // Removed credits
        }
    });

    playerStats.teamB.forEach((p, index) => {
        const card = document.getElementById(`player-card-${index}-b`);
        if (card) {
            card.querySelector('.kda-display').textContent = `${p.kills}/${p.deaths}/${p.assists}`;
            updatePlayerCardUI(card, p, index, 0); // Removed credits
        }
    });

    // 2. Update Detailed Stats Table (Post-Match)
    const allPlayers = [
        ...playerStats.teamA.map((p, i) => ({ ...p, team: teamAName, teamColor: 'text-[#ff4655]' })),
        ...playerStats.teamB.map((p, i) => ({ ...p, team: teamBName, teamColor: 'text-[#38bdf8]' }))
    ].sort((a, b) => b.kills - a.kills);

    const tbody = document.getElementById('stats-table-body');
    if (tbody) {
        tbody.innerHTML = '';
        allPlayers.forEach(p => {
            const diff = p.kills - p.deaths;
            const diffColor = diff > 0 ? 'text-green-400' : (diff < 0 ? 'text-red-400' : 'text-gray-400');
            const diffSign = diff > 0 ? '+' : '';

            const row = `
                <tr class="border-b border-gray-800 hover:bg-[#1f2b4d] transition-colors">
                    <td class="p-3 flex items-center gap-3">
                        <div class="w-8 h-8 bg-gray-700 rounded-full overflow-hidden">
                            ${p.photo ? `<img src="${p.photo}" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center text-xs">?</div>'}
                        </div>
                        <div>
                            <div class="font-bold text-white">${p.name}</div>
                            <div class="text-xs text-gray-500">${p.role}</div>
                        </div>
                    </td>
                    <td class="p-3 ${p.teamColor} font-bold">${p.team}</td>
                    <td class="p-3 text-center font-mono text-lg text-white">${p.kills}</td>
                    <td class="p-3 text-center font-mono text-lg text-gray-400">${p.deaths}</td>
                    <td class="p-3 text-center font-mono text-lg text-gray-400">${p.assists}</td>
                    <td class="p-3 text-center font-mono font-bold ${diffColor}">${diffSign}${diff}</td>
                    <td class="p-3 text-center font-mono text-yellow-400">${p.fk}</td>
                    <td class="p-3 text-center font-mono text-red-400">${p.fd}</td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    }

    // 3. Update Modal Small Tables (if modal is open)
    // NOTE: This is now handled by renderModalTable calls in endMatch or tab clicks.
    // We only need to auto-update ONLY IF we are mid-match map logic, BUT endMatch handles the final state.
    // So we can leave this EMPTY or removed to avoid conflicts with the tab system.
    // The previous logic put live stats here. The new logic puts SNAPSHOT stats here.
    // We should NOT overwrite the modal with live stats if the match is over and we are viewing history.

    /* 
       Dynamic updates removed to prevent overriding Tab selections. 
       The modal is ONLY shown at End of Map/Match, where stats are static snapshots.
    */
}

function updatePlayerCardUI(card, p, index, creditsArray) {
    if (!card) return;

    // 1. Visual: Dead state
    if (p.isDead) {
        card.classList.add('is-dead');
    } else {
        card.classList.remove('is-dead');
    }

    // 2. Update Name (Safety check)
    const nameEl = card.querySelector('.player-name');
    if (nameEl && p.name) nameEl.textContent = p.name;

    // 3. Update Role (Safety check)
    const roleEl = card.querySelector('.player-role');
    if (roleEl && p.role) roleEl.textContent = p.role;

    // 4. Update KDA
    const kdaDisplay = card.querySelector('.kda-display');
    if (kdaDisplay) {
        kdaDisplay.textContent = `${p.kills}/${p.deaths}/${p.assists}`;
    }

    // 5. Update Overall
    const ovrDisplay = card.querySelector('.player-ovr-value');
    if (ovrDisplay) {
        // PRIORITY: Use the value directly from the database/initialization
        let finalOvr = p.overall;

        // Fallback: Only calculate if p.overall is invalid/missing
        if (!finalOvr) {
            let avg = 0;
            if (p.attributes) {
                avg = (p.attributes.aim + p.attributes.gamesense + p.attributes.support) / 3;
            } else if (p.stats) {
                avg = (p.stats.aim + p.stats.gamesense + p.stats.support) / 3;
            } else {
                avg = 50;
            }
            // Auto-detect scale logic (Only used in fallback)
            if (avg <= 20) avg = avg * 5;
            finalOvr = Math.min(99, Math.round(avg));
        }

        ovrDisplay.textContent = finalOvr;

        // Update Color
        if (typeof getOverallColor === 'function') {
            ovrDisplay.className = 'font-black text-lg text-white leading-none player-ovr-value ' + getOverallColor(finalOvr);
        }
    }

    // 6. Health Bar (Optional, safe check)
    const healthBar = card.querySelector('.health-bar');
    if (healthBar) {
        healthBar.style.width = p.isDead ? '0%' : '100%';
    }
}

function renderRoundHistory(targetId = 'round-history-vis') {
    // This creates the visual boxes for round history
    const container = document.getElementById(targetId);
    if (!container) return; // Might not exist in some views

    let htmlA = '';
    let htmlB = '';

    // Calculate display limit
    const isMatchOver = checkMatchEndStateOnly();
    let displayLimit = isMatchOver ? roundHistory.length : Math.max(13, currentRound);

    for (let i = 1; i <= displayLimit; i++) {
        const roundData = roundHistory.find(r => r.round === i);
        const baseSlotClass = `w-6 h-6 rounded-sm flex items-center justify-center transition-all mr-1`;
        let cellA, cellB;

        if (roundData) {
            const icon = ROUND_ICONS[roundData.condition] || ROUND_ICONS['elimination'];
            if (roundData.winner === 'A') {
                cellA = `< div class="${baseSlotClass} bg-[#ff4655] text-white shadow-[0_0_8px_rgba(255,70,85,0.4)] text-[10px]" > ${icon}</div > `;
                cellB = `< div class="${baseSlotClass} bg-[#1a1a2e] border border-gray-700/50 opacity-30" ></div > `;
            } else {
                cellB = `< div class="${baseSlotClass} bg-[#38bdf8] text-white shadow-[0_0_8px_rgba(56,189,248,0.4)] text-[10px]" > ${icon}</div > `;
                cellA = `< div class="${baseSlotClass} bg-[#1a1a2e] border border-gray-700/50 opacity-30" ></div > `;
            }
        } else {
            // Future rounds
            cellA = `< div class="${baseSlotClass} bg-gray-800/20 border border-gray-800/50" ></div > `;
            cellB = `< div class="${baseSlotClass} bg-gray-800/20 border border-gray-800/50" ></div > `;
        }
        htmlA += cellA;
        htmlB += cellB;
    }

    container.innerHTML = `
    < div class="flex flex-col gap-1 w-full h-full justify-center" >
            <div class="flex items-center justify-center h-6 overflow-hidden w-full">${htmlA}</div>
            <div class="flex items-center justify-center h-6 overflow-hidden w-full">${htmlB}</div>
        </div >
    `;
}

// 2D Simulation Code (Minimal placeholder preserved)
// 2D Simulation Code Removed

// HELPER: Overall Color Logic
function getOverallColor(rating) {
    if (rating >= 90) return 'text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]'; // Radiant/Blue
    if (rating >= 80) return 'text-[#4ade80]'; // Green
    if (rating >= 70) return 'text-[#facc15]'; // Gold
    if (rating >= 60) return 'text-[#ca8a04]'; // Orange/Bronze
    return 'text-[#ef4444]'; // Red
}
