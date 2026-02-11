// ============================================
// 🎲 BO3 DICE ANALYSIS SYSTEM (CORRECT VERSION)
// ============================================

class BO3AnalysisSystem {
    constructor() {
        this.games = []; // Array of completed BO3 series
        this.currentGameMatches = [
            { match: 1, roll1: null, roll2: null },
            { match: 2, roll1: null, roll2: null },
            { match: 3, roll1: null, roll2: null }
        ];
        this.maxMemoryWindow = 20;
        this.loadFromLocalStorage();
        this.initEventListeners();
        this.renderMatchInputs();
        this.render();
    }

    // ============ INITIALIZATION ============
    initEventListeners() {
        document.getElementById('submitGameBtn').addEventListener('click', () => this.handleSubmitGame());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAllData());
    }

    renderMatchInputs() {
        const container = document.getElementById('matchInputs');
        let html = '';

        for (let i = 0; i < 3; i++) {
            html += `
                <div class="match-input-group">
                    <h3>🎲 Match ${i + 1}</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="match${i + 1}roll1">Roll 1 (6-54):</label>
                            <input type="number" id="match${i + 1}roll1" class="match-roll" data-match="${i + 1}" data-roll="1" min="6" max="54" placeholder="Contoh: 25">
                        </div>
                        <div class="form-group">
                            <label for="match${i + 1}roll2">Roll 2 (6-54):</label>
                            <input type="number" id="match${i + 1}roll2" class="match-roll" data-match="${i + 1}" data-roll="2" min="6" max="54" placeholder="Contoh: 38">
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // ============ STATE DETECTION ============
    getState(roll) {
        if (roll >= 6 && roll <= 18) return 'LOW';
        if (roll >= 19 && roll <= 31) return 'MID';
        if (roll >= 32 && roll <= 43) return 'HIGH';
        if (roll >= 44 && roll <= 54) return 'EXTREME';
        return 'UNKNOWN';
    }

    getStateClass(state) {
        return `state-${state.toLowerCase()}`;
    }

    getClassification(roll) {
        return roll <= 31 ? 'KECIL' : 'BESAR';
    }

    // ============ NUMERIC TREND ============
    calculateTrend(roll1, roll2) {
        const diff = roll2 - roll1;
        if (diff > 0) return { direction: 'naik', diff };
        if (diff < 0) return { direction: 'turun', diff };
        return { direction: 'stabil', diff };
    }

    // ============ FORM HANDLING ============
    handleSubmitGame() {
        // Validasi & collect data
        const matchData = [];
        let valid = true;

        for (let i = 1; i <= 3; i++) {
            const roll1 = parseInt(document.getElementById(`match${i}roll1`).value);
            const roll2 = parseInt(document.getElementById(`match${i}roll2`).value);

            if (isNaN(roll1) || isNaN(roll2) || roll1 < 6 || roll1 > 54 || roll2 < 6 || roll2 > 54) {
                alert(`Match ${i}: Input harus antara 6-54 untuk kedua roll!`);
                valid = false;
                break;
            }

            matchData.push({
                matchNumber: i,
                roll1,
                roll2,
                state1: this.getState(roll1),
                state2: this.getState(roll2),
                trend: this.calculateTrend(roll1, roll2),
                classification: this.getClassification(roll2),
                total: roll1 + roll2,
                avgRoll: (roll1 + roll2) / 2
            });
        }

        if (!valid) return;

        // Count winners
        let kecilCount = matchData.filter(m => m.classification === 'KECIL').length;
        let besarCount = matchData.filter(m => m.classification === 'BESAR').length;

        const winner = kecilCount > besarCount ? 'KECIL' : 'BESAR';

        // Create game record
        const game = {
            gameNumber: this.games.length + 1,
            matches: matchData,
            kecilMatchWins: kecilCount,
            besarMatchWins: besarCount,
            seriesWinner: winner,
            timestamp: new Date()
        };

        this.games.push(game);
        this.saveToLocalStorage();
        this.resetCurrentGame();
        this.render();
    }

    resetCurrentGame() {
        this.currentGameMatches = [
            { match: 1, roll1: null, roll2: null },
            { match: 2, roll1: null, roll2: null },
            { match: 3, roll1: null, roll2: null }
        ];
        document.getElementById('matchInputs').querySelectorAll('input').forEach(input => input.value = '');
        document.getElementById('match1roll1').focus();
    }

    // ============ DATA MANAGEMENT ============
    saveToLocalStorage() {
        localStorage.setItem('bo3Games', JSON.stringify(this.games));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('bo3Games');
        this.games = stored ? JSON.parse(stored) : [];
    }

    clearAllData() {
        if (confirm('Hapus semua data BO3? Tindakan tidak dapat dibatalkan.')) {
            this.games = [];
            this.resetCurrentGame();
            this.saveToLocalStorage();
            this.render();
        }
    }

    // ============ ANALYTICS - TREND ANALYSIS ============
    getRecentGames(count = this.maxMemoryWindow) {
        return this.games.slice(-count);
    }

    analyzeTrendDirection() {
        if (this.games.length === 0) return null;

        const recentGames = this.getRecentGames();
        let upCount = 0, downCount = 0, stableCount = 0;

        recentGames.forEach(game => {
            // Hitung trend dari match sequence dalam game
            const allMatches = game.matches;
            const avgGameRoll = allMatches.reduce((sum, m) => sum + m.total, 0) / allMatches.length;

            // Bandingkan dengan game sebelumnya
            if (this.games.indexOf(game) > 0) {
                const prevGame = this.games[this.games.indexOf(game) - 1];
                const prevAvgRoll = prevGame.matches.reduce((sum, m) => sum + m.total, 0) / prevGame.matches.length;
                
                if (avgGameRoll > prevAvgRoll) upCount++;
                else if (avgGameRoll < prevAvgRoll) downCount++;
                else stableCount++;
            }
        });

        // Jika hanya 1 game, hitung dari internal match trends
        if (this.games.length === 1) {
            const matches = this.games[0].matches;
            matches.forEach(m => {
                if (m.trend.direction === 'naik') upCount++;
                else if (m.trend.direction === 'turun') downCount++;
                else stableCount++;
            });
        }

        return { upCount, downCount, stableCount };
    }

    getTrendDominant() {
        const trendAnalysis = this.analyzeTrendDirection();
        if (!trendAnalysis) return '-';

        if (trendAnalysis.upCount > trendAnalysis.downCount && trendAnalysis.upCount > trendAnalysis.stableCount)
            return 'Naik ↑';
        if (trendAnalysis.downCount > trendAnalysis.upCount && trendAnalysis.downCount > trendAnalysis.stableCount)
            return 'Turun ↓';
        return 'Stabil →';
    }

    // ============ ANALYTICS - STATE TRANSITION ============
    buildTransitionMatrix() {
        if (this.games.length < 2) return null;

        const states = ['KECIL', 'BESAR'];
        const matrix = {};

        states.forEach(from => {
            matrix[from] = {};
            states.forEach(to => {
                matrix[from][to] = 0;
            });
        });

        // Transisi dari game ke game
        for (let i = 1; i < this.games.length; i++) {
            const fromState = this.games[i - 1].seriesWinner;
            const toState = this.games[i].seriesWinner;
            matrix[fromState][toState]++;
        }

        return matrix;
    }

    getStateTransitionProbability(fromState) {
        const matrix = this.buildTransitionMatrix();
        if (!matrix) return null;

        const transitions = matrix[fromState];
        const total = Object.values(transitions).reduce((a, b) => a + b, 0);

        if (total === 0) return null;

        const probability = {};
        for (const [toState, count] of Object.entries(transitions)) {
            probability[toState] = Math.round((count / total) * 100);
        }

        return probability;
    }

    // ============ ANALYTICS - WINNER FREQUENCY ============
    getWinnerFrequency() {
        if (this.games.length === 0) return { KECIL: 0, BESAR: 0 };

        const recent = this.getRecentGames();
        let kecilCount = 0, besarCount = 0;

        recent.forEach(game => {
            if (game.seriesWinner === 'KECIL') kecilCount++;
            else besarCount++;
        });

        return { KECIL: kecilCount, BESAR: besarCount };
    }

    // ============ ANALYTICS - AVERAGE ROLL ============
    getAverageRoll() {
        if (this.games.length === 0) return 0;

        const recent = this.getRecentGames();
        let totalRoll = 0;
        let totalMatches = 0;

        recent.forEach(game => {
            game.matches.forEach(match => {
                totalRoll += match.total;
                totalMatches++;
            });
        });

        return totalMatches > 0 ? (totalRoll / totalMatches).toFixed(2) : 0;
    }

    getLastGameWinner() {
        if (this.games.length === 0) return null;
        return this.games[this.games.length - 1].seriesWinner;
    }

    // ============ PREDICTION LOGIC ============
    predictNextGame() {
        if (this.games.length < 3) {
            return { canPredict: false, reason: 'Data belum cukup (minimal 3 Game BO3)' };
        }

        const trendAnalysis = this.analyzeTrendDirection();
        const winnerFreq = this.getWinnerFrequency();
        const lastGameWinner = this.getLastGameWinner();
        const lastGameTransitionProb = this.getStateTransitionProbability(lastGameWinner);
        const avgRoll = parseFloat(this.getAverageRoll());

        let kecilScore = 0;
        let besarScore = 0;

        // 1️⃣ Numeric Trend Component (25%)
        const trendWeight = 0.25;
        if (trendAnalysis.downCount > trendAnalysis.upCount) {
            kecilScore += trendWeight * 0.6;
        } else {
            besarScore += trendWeight * 0.6;
        }

        // 2️⃣ Winner Frequency Component (30%)
        const freqWeight = 0.30;
        const totalWins = winnerFreq.KECIL + winnerFreq.BESAR;
        const kecilFreqRatio = totalWins > 0 ? winnerFreq.KECIL / totalWins : 0.5;
        const besarFreqRatio = totalWins > 0 ? winnerFreq.BESAR / totalWins : 0.5;

        kecilScore += freqWeight * kecilFreqRatio;
        besarScore += freqWeight * besarFreqRatio;

        // 3️⃣ State Transition Component (25%)
        const transitionWeight = 0.25;
        if (lastGameTransitionProb) {
            kecilScore += transitionWeight * (lastGameTransitionProb.KECIL || 0) / 100;
            besarScore += transitionWeight * (lastGameTransitionProb.BESAR || 0) / 100;
        }

        // 4️⃣ Distance from Center Component (20%)
        const centerWeight = 0.20;
        const CENTER = 30;
        const distanceFromCenter = Math.abs(avgRoll - CENTER);
        const maxDistance = 24;

        if (avgRoll < CENTER) {
            kecilScore += centerWeight * (1 - distanceFromCenter / maxDistance);
        } else {
            besarScore += centerWeight * (1 - distanceFromCenter / maxDistance);
        }

        // Normalization
        const totalScore = kecilScore + besarScore;
        const kecilPercent = Math.round((kecilScore / totalScore) * 100);
        const besarPercent = 100 - kecilPercent;

        return {
            canPredict: true,
            KECIL: kecilPercent,
            BESAR: besarPercent,
            reasoning: {
                trendDirection: trendAnalysis,
                winnerFrequency: winnerFreq,
                lastGameWinner,
                lastGameTransitionProb,
                avgRoll
            }
        };
    }

    // ============ RENDER ============
    render() {
        this.renderStats();
        this.renderGameTable();
        this.renderTrendChart();
        this.renderTransitionMatrix();
        this.renderWinnerPattern();
        this.renderPrediction();
        this.renderGameStatus();
    }

    renderGameStatus() {
        document.getElementById('currentGame').textContent = this.games.length + 1;
        document.getElementById('gameStatus').textContent = `Input 3 Match untuk Game ${this.games.length + 1}`;
    }

    renderStats() {
        document.getElementById('totalGames').textContent = this.games.length;

        if (this.games.length === 0) {
            document.getElementById('kecilWinsTotal').textContent = '0';
            document.getElementById('besarWinsTotal').textContent = '0';
            document.getElementById('seriesDominant').textContent = '-';
            return;
        }

        let kecilGamesWon = 0, besarGamesWon = 0;

        this.games.forEach(game => {
            if (game.seriesWinner === 'KECIL') kecilGamesWon++;
            else besarGamesWon++;
        });

        document.getElementById('kecilWinsTotal').textContent = kecilGamesWon;
        document.getElementById('besarWinsTotal').textContent = besarGamesWon;
        document.getElementById('seriesDominant').textContent = kecilGamesWon > besarGamesWon ? 'KECIL 🔵' : 'BESAR 🔴';
    }

    renderGameTable() {
        const tbody = document.getElementById('gameTableBody');

        if (this.games.length === 0) {
            tbody.innerHTML = '<tr class="empty-state"><td colspan="7">Data kosong. Mulai input Game BO3 pertama!</td></tr>';
            return;
        }

        tbody.innerHTML = this.games.map((game, idx) => {
            const m1Result = game.matches[0].classification === 'KECIL' ? '🔵K' : '🔴B';
            const m2Result = game.matches[1].classification === 'KECIL' ? '🔵K' : '🔴B';
            const m3Result = game.matches[2].classification === 'KECIL' ? '🔵K' : '🔴B';

            // Hitung trend series
            let seriesTrend = 'Stabil';
            if (idx > 0) {
                const prevGameWinner = this.games[idx - 1].seriesWinner;
                if (prevGameWinner === game.seriesWinner) seriesTrend = 'Sama';
                else seriesTrend = 'Berubah';
            }

            return `
                <tr>
                    <td><strong>Game ${game.gameNumber}</strong></td>
                    <td><span class="match-badge match-${game.matches[0].classification.toLowerCase()}">${m1Result}</span></td>
                    <td><span class="match-badge match-${game.matches[1].classification.toLowerCase()}">${m2Result}</span></td>
                    <td><span class="match-badge match-${game.matches[2].classification.toLowerCase()}">${m3Result}</span></td>
                    <td>${game.kecilMatchWins}-${game.besarMatchWins}</td>
                    <td><span class="series-winner-badge winner-${game.seriesWinner.toLowerCase()}">${game.seriesWinner}</span></td>
                    <td>${seriesTrend}</td>
                </tr>
            `;
        }).join('');
    }

    renderTrendChart() {
        const canvas = document.getElementById('trendChart');
        const ctx = canvas.getContext('2d');
        const recent = this.getRecentGames(15);

        if (recent.length === 0) {
            document.getElementById('trendSummary').innerHTML = '<p class="empty-state">Data belum cukup untuk analisis tren</p>';
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 50;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;

        const maxValue = 54;
        const minValue = 6;

        const dataPoints = recent.map((game, idx) => {
            const avgRoll = game.matches.reduce((sum, m) => sum + m.total, 0) / game.matches.length;
            return { idx, gameNum: game.gameNumber, avgRoll };
        });

        // Draw grid
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }

        // Draw line
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#667eea';
        ctx.beginPath();
        dataPoints.forEach((point, i) => {
            const x = padding + (chartWidth / (dataPoints.length - 1)) * i;
            const y = padding + chartHeight - ((point.avgRoll - minValue) / (maxValue - minValue)) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        for (let i = 0; i <= 5; i++) {
            const value = minValue + (maxValue - minValue) * (i / 5);
            const y = padding + chartHeight - (chartHeight / 5) * i;
            ctx.fillText(Math.round(value), padding - 30, y + 5);
        }

        // Render summary
        const trendAnalysis = this.analyzeTrendDirection();
        const summary = `
            <div class="analysis-point">
                <strong>📈 Tren Series (${recent.length} game terakhir):</strong><br>
                Naik: ${trendAnalysis.upCount} | Turun: ${trendAnalysis.downCount} | Stabil: ${trendAnalysis.stableCount}
            </div>
            <div class="analysis-point">
                <strong>Dominasi:</strong> <span class="trend-${this.getTrendDominant().includes('↑') ? 'up' : this.getTrendDominant().includes('↓') ? 'down' : 'stable'}">${this.getTrendDominant()}</span>
            </div>
        `;
        document.getElementById('trendSummary').innerHTML = summary;
    }

    renderTransitionMatrix() {
        const matrix = this.buildTransitionMatrix();
        const container = document.getElementById('transitionMatrix');

        if (!matrix || this.games.length < 2) {
            container.innerHTML = '<p class="empty-state">Data belum cukup untuk analisis transisi (minimal 2 Game)</p>';
            return;
        }

        const states = ['KECIL', 'BESAR'];
        let html = '';

        // Header
        html += '<div class="matrix-row">';
        html += '<div class="matrix-cell matrix-header">Winner Sebelumnya</div>';
        states.forEach(state => {
            html += `<div class="matrix-cell matrix-header">${state}</div>`;
        });
        html += '</div>';

        // Data rows
        states.forEach(fromState => {
            html += '<div class="matrix-row">';
            html += `<div class="matrix-cell matrix-header">${fromState}</div>`;

            const probability = this.getStateTransitionProbability(fromState);
            if (probability) {
                states.forEach(toState => {
                    const percent = probability[toState];
                    const intensity = percent / 100;
                    const bgColor = `rgba(102, 126, 234, ${intensity * 0.6})`;
                    html += `<div class="matrix-cell matrix-data" style="background-color: ${bgColor};">${percent}%</div>`;
                });
            } else {
                states.forEach(() => {
                    html += '<div class="matrix-cell matrix-data">-</div>';
                });
            }

            html += '</div>';
        });

        container.innerHTML = html;
    }

    renderWinnerPattern() {
        const container = document.getElementById('winnerPattern');

        if (this.games.length < 2) {
            container.innerHTML = '<p class="empty-state">Data belum cukup untuk analisis pola pemenang</p>';
            return;
        }

        const winnerFreq = this.getWinnerFrequency();
        const totalGames = this.getRecentGames().length;

        const kecilPercent = totalGames > 0 ? Math.round((winnerFreq.KECIL / totalGames) * 100) : 0;
        const besarPercent = totalGames > 0 ? Math.round((winnerFreq.BESAR / totalGames) * 100) : 0;

        const html = `
            <div class="analysis-point">
                <strong>🏆 Pemenang Series (${totalGames} game terakhir):</strong><br>
                KECIL 🔵: ${winnerFreq.KECIL} series (${kecilPercent}%)<br>
                BESAR 🔴: ${winnerFreq.BESAR} series (${besarPercent}%)
            </div>
            <div class="analysis-point">
                <strong>🔄 Pola Berubah/Stabil:</strong><br>
                ${this.analyzeWinnerPattern()}
            </div>
        `;

        container.innerHTML = html;
    }

    analyzeWinnerPattern() {
        if (this.games.length < 2) return 'Data belum cukup';

        const recent = this.getRecentGames();
        let changeCount = 0, sameCount = 0;

        for (let i = 1; i < recent.length; i++) {
            if (recent[i].seriesWinner === recent[i - 1].seriesWinner) sameCount++;
            else changeCount++;
        }

        return `Berubah: ${changeCount} | Sama: ${sameCount} → ${changeCount > sameCount ? 'Pemenang Sering Berubah' : 'Pemenang Sering Sama'}`;
    }

    renderPrediction() {
        const prediction = this.predictNextGame();
        const container = document.getElementById('predictionOutput');
        const basisContainer = document.getElementById('analysisBasis');

        if (!prediction.canPredict) {
            container.innerHTML = `<p class="empty-state">${prediction.reason}</p>`;
            basisContainer.innerHTML = '<p class="empty-state">Dasar analisis akan ditampilkan setelah prediksi</p>';
            return;
        }

        const { KECIL, BESAR, reasoning } = prediction;

        container.innerHTML = `
            <div class="prediction-item prediction-kecil">
                <span class="prediction-label">🔵 KECIL</span>
                <span class="prediction-percentage">${KECIL}%</span>
            </div>
            <div class="prediction-item prediction-besar">
                <span class="prediction-label">🔴 BESAR</span>
                <span class="prediction-percentage">${BESAR}%</span>
            </div>
        `;

        const basisHTML = `
            <div class="analysis-point">
                <strong>🎯 Rekomendasi Game Berikutnya:</strong><br>
                ${KECIL > BESAR ? '🔵 KECIL' : '🔴 BESAR'} (${Math.max(KECIL, BESAR)}% confidence)
            </div>
            <div class="analysis-point">
                <strong>📊 Komponen Analisis:</strong>
                <ul>
                    <li><strong>Tren Numerik:</strong> ${reasoning.trendDirection.downCount > reasoning.trendDirection.upCount ? 'Cenderung menurun (KECIL)' : 'Cenderung meningkat (BESAR)'} (Naik: ${reasoning.trendDirection.upCount}, Turun: ${reasoning.trendDirection.downCount}, Stabil: ${reasoning.trendDirection.stableCount})</li>
                    <li><strong>Frekuensi Pemenang:</strong> KECIL: ${reasoning.winnerFrequency.KECIL}, BESAR: ${reasoning.winnerFrequency.BESAR}</li>
                    <li><strong>Pemenang Game Terakhir:</strong> ${reasoning.lastGameWinner}</li>
                    <li><strong>Rata-rata Roll Series:</strong> ${reasoning.avgRoll} (Pusat K/B: 30) → ${reasoning.avgRoll < 30 ? 'Lebih dekat KECIL' : 'Lebih dekat BESAR'}</li>
                    <li><strong>Transisi dari ${reasoning.lastGameWinner}:</strong>
                        ${reasoning.lastGameTransitionProb ? `KECIL: ${reasoning.lastGameTransitionProb.KECIL || 0}%, BESAR: ${reasoning.lastGameTransitionProb.BESAR || 0}%` : 'Data belum cukup'}
                    </li>
                </ul>
            </div>
            <div class="analysis-point">
                <strong>⚙️ Metodologi:</strong> Hybrid Scoring System (Numeric Trend 25% + Winner Frequency 30% + State Transition 25% + Distance from Center 20%)
            </div>
        `;

        basisContainer.innerHTML = basisHTML;
    }
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    new BO3AnalysisSystem();
});
