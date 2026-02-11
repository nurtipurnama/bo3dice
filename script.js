// ============================================
// 🎲 BO3 DICE ANALYSIS SYSTEM
// ============================================

class BO3DiceSystem {
    constructor() {
        this.matches = [];
        this.maxMatches = 3;
        this.currentMatch = 1;
        this.kecilWins = 0;
        this.besarWins = 0;
        this.seriesOver = false;
        this.loadFromLocalStorage();
        this.initEventListeners();
        this.render();
    }

    // ============ INITIALIZATION ============
    initEventListeners() {
        document.getElementById('inputForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('resetBtn')?.addEventListener('click', () => this.resetSeries());
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
    handleFormSubmit(e) {
        e.preventDefault();

        if (this.seriesOver) {
            alert('BO3 sudah selesai! Reset untuk memulai series baru.');
            return;
        }

        const roll1 = parseInt(document.getElementById('roll1').value);
        const roll2 = parseInt(document.getElementById('roll2').value);

        if (roll1 < 6 || roll1 > 54 || roll2 < 6 || roll2 > 54) {
            alert('Input harus antara 6-54');
            return;
        }

        const matchResult = {
            matchNumber: this.currentMatch,
            roll1,
            roll2,
            state1: this.getState(roll1),
            state2: this.getState(roll2),
            trend: this.calculateTrend(roll1, roll2),
            classification: this.getClassification(roll2),
            timestamp: new Date(),
            total: roll1 + roll2,
            avgRoll: (roll1 + roll2) / 2
        };

        this.matches.push(matchResult);

        // Update score
        if (matchResult.classification === 'KECIL') {
            this.kecilWins++;
        } else {
            this.besarWins++;
        }

        // Check if series is over
        if (this.kecilWins === 2 || this.besarWins === 2) {
            this.seriesOver = true;
        } else if (this.currentMatch < this.maxMatches) {
            this.currentMatch++;
        }

        this.saveToLocalStorage();
        this.render();
        document.getElementById('inputForm').reset();
    }

    // ============ DATA MANAGEMENT ============
    saveToLocalStorage() {
        const data = {
            matches: this.matches,
            currentMatch: this.currentMatch,
            kecilWins: this.kecilWins,
            besarWins: this.besarWins,
            seriesOver: this.seriesOver
        };
        localStorage.setItem('bo3Games', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('bo3Games');
        if (stored) {
            const data = JSON.parse(stored);
            this.matches = data.matches || [];
            this.currentMatch = data.currentMatch || 1;
            this.kecilWins = data.kecilWins || 0;
            this.besarWins = data.besarWins || 0;
            this.seriesOver = data.seriesOver || false;
        }
    }

    resetSeries() {
        if (confirm('Reset seluruh BO3? Semua data akan hilang.')) {
            this.matches = [];
            this.currentMatch = 1;
            this.kecilWins = 0;
            this.besarWins = 0;
            this.seriesOver = false;
            this.saveToLocalStorage();
            this.render();
        }
    }

    // ============ ANALYTICS ============
    analyzeSeriesTrend() {
        if (this.matches.length === 0) return null;

        let upCount = 0, downCount = 0, stableCount = 0;

        this.matches.forEach(match => {
            if (match.trend.direction === 'naik') upCount++;
            else if (match.trend.direction === 'turun') downCount++;
            else stableCount++;
        });

        return { upCount, downCount, stableCount };
    }

    getAverageRollBySeries() {
        if (this.matches.length === 0) return 0;
        const totalAvg = this.matches.reduce((sum, m) => sum + m.avgRoll, 0);
        return (totalAvg / this.matches.length).toFixed(2);
    }

    getStateDominance() {
        if (this.matches.length === 0) return {};

        const stateCounts = { LOW: 0, MID: 0, HIGH: 0, EXTREME: 0 };

        this.matches.forEach(match => {
            stateCounts[match.state2]++;
        });

        return stateCounts;
    }

    getLastMatchState() {
        if (this.matches.length === 0) return null;
        return this.matches[this.matches.length - 1].state2;
    }

    // ============ PREDICTION ============
    predictNextMatch() {
        if (this.matches.length < 1) {
            return { canPredict: false, reason: 'Minimal 1 match untuk prediksi' };
        }

        if (this.seriesOver) {
            return { canPredict: false, reason: 'Series sudah berakhir' };
        }

        const trendAnalysis = this.analyzeSeriesTrend();
        const stateDominance = this.getStateDominance();
        const avgRoll = parseFloat(this.getAverageRollBySeries());

        let kecilScore = 0;
        let besarScore = 0;

        // 1️⃣ Trend Component (30%)
        const trendWeight = 0.30;
        if (trendAnalysis.downCount > trendAnalysis.upCount) {
            kecilScore += trendWeight * 0.7;
        } else {
            besarScore += trendWeight * 0.7;
        }

        // 2️⃣ State Dominance Component (35%)
        const stateWeight = 0.35;
        const totalStateCount = Object.values(stateDominance).reduce((a, b) => a + b, 0);
        const lowMidDominance = (stateDominance.LOW + stateDominance.MID) / totalStateCount || 0;
        const highExtremeDominance = (stateDominance.HIGH + stateDominance.EXTREME) / totalStateCount || 0;

        kecilScore += stateWeight * lowMidDominance;
        besarScore += stateWeight * highExtremeDominance;

        // 3️⃣ Average Roll Distance Component (35%)
        const centerWeight = 0.35;
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
                trendAnalysis,
                stateDominance,
                avgRoll
            }
        };
    }

    // ============ RENDER ============
    render() {
        this.renderScoreboard();
        this.renderMatchStatus();
        this.renderTimeline();
        this.renderCurrentMatchDetails();
        this.renderMatchAnalysis();
        this.renderSeriesAnalysis();
        this.renderNextPrediction();
        this.renderWinner();
    }

    renderScoreboard() {
        document.getElementById('kecilScore').textContent = this.kecilWins;
        document.getElementById('besarScore').textContent = this.besarWins;
        document.getElementById('seriesStatus').textContent = 
            `Seri ${this.kecilWins}-${this.besarWins} | ${this.seriesOver ? '✅ Series Berakhir' : `Match ${this.currentMatch} Berlangsung`}`;
    }

    renderMatchStatus() {
        document.getElementById('currentMatch').textContent = this.seriesOver ? this.currentMatch : this.currentMatch;
        
        let statusText = '';
        if (this.seriesOver) {
            statusText = `✅ Series Selesai! ${this.kecilWins > this.besarWins ? 'KECIL' : 'BESAR'} Menang ${Math.max(this.kecilWins, this.besarWins)}-${Math.min(this.kecilWins, this.besarWins)}`;
        } else {
            statusText = `Masukkan Roll 1 & Roll 2 untuk Match ${this.currentMatch}`;
        }
        document.getElementById('matchStatus').textContent = statusText;

        document.getElementById('submitBtn').disabled = this.seriesOver;
    }

    renderTimeline() {
        const timeline = document.getElementById('timeline');

        if (this.matches.length === 0) {
            timeline.innerHTML = '<div class="timeline-item placeholder"><p>Match results akan ditampilkan di sini</p></div>';
            return;
        }

        timeline.innerHTML = this.matches.map((match, idx) => `
            <div class="timeline-item match-${match.classification.toLowerCase()}">
                <h4>Match ${match.matchNumber}: ${match.classification} ${match.classification === 'KECIL' ? '🔵' : '🔴'}</h4>
                <div class="timeline-item-row">
                    <div class="timeline-item-data"><strong>Roll 1:</strong> ${match.roll1}</div>
                    <div class="timeline-item-data"><strong>State 1:</strong> <span class="state-badge ${this.getStateClass(match.state1)}">${match.state1}</span></div>
                    <div class="timeline-item-data"><strong>Roll 2:</strong> ${match.roll2}</div>
                    <div class="timeline-item-data"><strong>State 2:</strong> <span class="state-badge ${this.getStateClass(match.state2)}">${match.state2}</span></div>
                    <div class="timeline-item-data"><strong>Selisih:</strong> ${match.trend.diff > 0 ? '+' : ''}${match.trend.diff}</div>
                    <div class="timeline-item-data"><strong>Arah:</strong> ${match.trend.direction.toUpperCase()}</div>
                </div>
                <div style="margin-top: 10px;">
                    <strong>Status Seri:</strong> KECIL ${this.getKecilWinsUpTo(idx + 1)} - BESAR ${this.getBesarWinsUpTo(idx + 1)}
                </div>
            </div>
        `).join('');
    }

    getKecilWinsUpTo(matchNumber) {
        return this.matches.slice(0, matchNumber).filter(m => m.classification === 'KECIL').length;
    }

    getBesarWinsUpTo(matchNumber) {
        return this.matches.slice(0, matchNumber).filter(m => m.classification === 'BESAR').length;
    }

    renderCurrentMatchDetails() {
        const container = document.getElementById('matchDetails');

        if (this.matches.length === 0) {
            container.innerHTML = '<p class="empty-state">Belum ada data</p>';
            return;
        }

        const lastMatch = this.matches[this.matches.length - 1];

        container.innerHTML = `
            <div class="detail-box">
                <span class="detail-label">Roll 1</span>
                <span class="detail-value">${lastMatch.roll1}</span>
                <span class="detail-label" style="margin-top: 5px; font-size: 0.8em;">${lastMatch.state1}</span>
            </div>
            <div class="detail-box">
                <span class="detail-label">Roll 2</span>
                <span class="detail-value">${lastMatch.roll2}</span>
                <span class="detail-label" style="margin-top: 5px; font-size: 0.8em;">${lastMatch.state2}</span>
            </div>
            <div class="detail-box">
                <span class="detail-label">Selisih (Roll2 - Roll1)</span>
                <span class="detail-value" style="color: ${lastMatch.trend.diff > 0 ? '#27ae60' : lastMatch.trend.diff < 0 ? '#e74c3c' : '#95a5a6'};">
                    ${lastMatch.trend.diff > 0 ? '+' : ''}${lastMatch.trend.diff}
                </span>
                <span class="detail-label" style="margin-top: 5px; font-size: 0.8em;">${lastMatch.trend.direction.toUpperCase()}</span>
            </div>
            <div class="detail-box">
                <span class="detail-label">Hasil Match</span>
                <span class="detail-value">${lastMatch.classification}</span>
                <span class="detail-label" style="margin-top: 5px; font-size: 0.8em;">${lastMatch.classification === 'KECIL' ? '🔵' : '🔴'}</span>
            </div>
            <div class="detail-box">
                <span class="detail-label">Total (Roll1 + Roll2)</span>
                <span class="detail-value">${lastMatch.total}</span>
                <span class="detail-label" style="margin-top: 5px; font-size: 0.8em;">Average: ${lastMatch.avgRoll.toFixed(1)}</span>
            </div>
        `;
    }

    renderMatchAnalysis() {
        const container = document.getElementById('matchAnalysis');

        if (this.matches.length === 0) {
            container.innerHTML = '<p class="empty-state">Analisis akan ditampilkan setelah submit</p>';
            return;
        }

        const lastMatch = this.matches[this.matches.length - 1];

        const html = `
            <div class="analysis-point">
                <strong>📊 Tren Match:</strong><br>
                Roll1 (${lastMatch.state1}) → Roll2 (${lastMatch.state2})<br>
                Arah: <strong>${lastMatch.trend.direction.toUpperCase()}</strong> (Δ ${lastMatch.trend.diff > 0 ? '+' : ''}${lastMatch.trend.diff})
            </div>
            <div class="analysis-point">
                <strong>🔍 State Transition:</strong><br>
                ${lastMatch.state1} → ${lastMatch.state2}
            </div>
            <div class="analysis-point">
                <strong>📌 Hasil Match ${lastMatch.matchNumber}:</strong><br>
                <span style="font-size: 1.2em; font-weight: bold;">${lastMatch.classification === 'KECIL' ? '🔵 KECIL MENANG' : '🔴 BESAR MENANG'}</span>
            </div>
        `;

        container.innerHTML = html;
    }

    renderSeriesAnalysis() {
        const container = document.getElementById('seriesAnalysis');

        if (this.matches.length === 0) {
            container.innerHTML = '<p class="empty-state">Minimal 1 match untuk analisis seri</p>';
            return;
        }

        const trendAnalysis = this.analyzeSeriesTrend();
        const stateDominance = this.getStateDominance();
        const avgRoll = this.getAverageRollBySeries();

        const html = `
            <div class="analysis-point">
                <strong>📈 Tren Seri (${this.matches.length} match):</strong><br>
                Naik: ${trendAnalysis.upCount} | Turun: ${trendAnalysis.downCount} | Stabil: ${trendAnalysis.stableCount}
            </div>
            <div class="analysis-point">
                <strong>🔄 Dominasi State:</strong><br>
                LOW: ${stateDominance.LOW} | MID: ${stateDominance.MID} | HIGH: ${stateDominance.HIGH} | EXTREME: ${stateDominance.EXTREME}
            </div>
            <div class="analysis-point">
                <strong>📊 Rata-rata Roll di Seri:</strong> ${avgRoll}<br>
                ${parseFloat(avgRoll) < 30 ? '← Cenderung ke KECIL' : '→ Cenderung ke BESAR'}
            </div>
            <div class="analysis-point">
                <strong>🏆 Status Seri:</strong><br>
                KECIL: ${this.kecilWins} | BESAR: ${this.besarWins}<br>
                ${this.seriesOver ? `<strong style="color: ${this.kecilWins > this.besarWins ? '#3498db' : '#e74c3c'};">${this.kecilWins > this.besarWins ? '🔵 KECIL MENANG SERIES' : '🔴 BESAR MENANG SERIES'}</strong>` : 'Series masih berlangsung'}
            </div>
        `;

        container.innerHTML = html;
    }

    renderNextPrediction() {
        const container = document.getElementById('nextPrediction');
        const prediction = this.predictNextMatch();

        if (!prediction.canPredict) {
            container.innerHTML = `<p class="empty-state">${prediction.reason}</p>`;
            return;
        }

        const { KECIL, BESAR, reasoning } = prediction;

        const html = `
            <div class="prediction-item prediction-kecil">
                <span class="prediction-label">🔵 KECIL</span>
                <span class="prediction-percentage">${KECIL}%</span>
            </div>
            <div class="prediction-item prediction-besar">
                <span class="prediction-label">🔴 BESAR</span>
                <span class="prediction-percentage">${BESAR}%</span>
            </div>
            <div style="grid-column: 1 / -1; margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                <strong>📌 Dasar Prediksi Match ${this.currentMatch}:</strong>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>Tren: ${reasoning.trendAnalysis.downCount > reasoning.trendAnalysis.upCount ? 'Menurun → KECIL' : 'Meningkat → BESAR'}</li>
                    <li>Avg Roll Seri: ${reasoning.avgRoll} (Center: 30) → ${reasoning.avgRoll < 30 ? 'KECIL' : 'BESAR'}</li>
                    <li>State Dominance: LOW+MID (${reasoning.stateDominance.LOW + reasoning.stateDominance.MID}) vs HIGH+EXTREME (${reasoning.stateDominance.HIGH + reasoning.stateDominance.EXTREME})</li>
                </ul>
            </div>
        `;

        container.innerHTML = html;
    }

    renderWinner() {
        const section = document.getElementById('winnerSection');
        const display = document.getElementById('winnerDisplay');

        if (!this.seriesOver) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        const winner = this.kecilWins > this.besarWins ? 'KECIL 🔵' : 'BESAR 🔴';
        const medal = this.kecilWins > this.besarWins ? '🏆' : '🏆';

        display.innerHTML = `
            <div class="winner-medal">${medal}</div>
            <h2>${winner} MENANG!</h2>
            <div class="winner-score">
                Skor Final: ${Math.max(this.kecilWins, this.besarWins)} - ${Math.min(this.kecilWins, this.besarWins)}<br>
                <span style="font-size: 1em; opacity: 0.9;">(Dari ${this.currentMatch} Match)</span>
            </div>
        `;
    }
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    new BO3DiceSystem();
});