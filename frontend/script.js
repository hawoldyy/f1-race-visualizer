let allData = {
    races: null,
    drivers: null,
    circuits: null,
    results: null,
    driverStandings: null,
    constructorStandings: null,
    constructors: null,
    seasons: null,
    qualifying: null,
    pitStops: null,
    sprintResults: null,
    status: null
};

let dataLoaded = false;
let currentSection = 'overview';

function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.dataset.section;

            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');

            currentSection = sectionId;

            closeMobileMenu();

            loadSectionData(sectionId);
        });
    });

    const hamburger = document.getElementById('hamburger-btn');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        hamburger.classList.toggle('active');
    });
}

function closeMobileMenu() {
    const hamburger = document.getElementById('hamburger-btn');
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.remove('open');
    hamburger.classList.remove('active');
}

async function loadAllData() {
    if (dataLoaded) return;

    showLoading(true);

    try {
        const csvFiles = [
            { key: 'circuits', path: '../backend/data/circuits.csv' },
            { key: 'races', path: '../backend/data/races.csv' },
            { key: 'drivers', path: '../backend/data/drivers.csv' },
            { key: 'results', path: '../backend/data/results.csv' },
            { key: 'driverStandings', path: '../backend/data/driver_standings.csv' },
            { key: 'constructorStandings', path: '../backend/data/constructor_standings.csv' },
            { key: 'constructors', path: '../backend/data/constructors.csv' },
            { key: 'seasons', path: '../backend/data/seasons.csv' },
            { key: 'qualifying', path: '../backend/data/qualifying.csv' },
            { key: 'pitStops', path: '../backend/data/pit_stops.csv' },
            { key: 'sprintResults', path: '../backend/data/sprint_results.csv' },
            { key: 'status', path: '../backend/data/status.csv' }
        ];

        const responses = await Promise.all(csvFiles.map(file => fetch(file.path)));
        const texts = await Promise.all(responses.map(res => res.text()));

        csvFiles.forEach((file, index) => {
            allData[file.key] = Papa.parse(texts[index], { header: true, skipEmptyLines: true }).data;
        });

        dataLoaded = true;
        console.log('All F1 data loaded successfully');

        loadOverviewData();

    } catch (error) {
        console.error('Error loading data:', error);
        showStatusMessage('Failed to load F1 data', 'error');
    } finally {
        showLoading(false);
    }
}

function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'overview':
            loadOverviewData();
            break;
        case 'drivers':
            loadDriversData();
            break;
        case 'constructors':
            loadConstructorsData();
            break;
        case 'circuits':
            loadCircuitsData();
            break;
        case 'races':
            loadRacesData();
            break;
        case 'visualizations':
            loadVisualizationsData();
            break;
    }
}

function loadOverviewData() {
    if (!dataLoaded) return;

    updateOverviewStats();

    createRacesByYearChart();
    createTopDriversChart();
}

function updateOverviewStats() {
    const totalRaces = allData.races ? allData.races.length : 0;
    const totalDrivers = allData.drivers ? [...new Set(allData.drivers.map(d => d.driverId))].length : 0;
    const totalConstructors = allData.constructors ? allData.constructors.length : 0;
    const totalCircuits = allData.circuits ? allData.circuits.length : 0;

    document.getElementById('total-races').textContent = totalRaces.toLocaleString();
    document.getElementById('total-drivers').textContent = totalDrivers.toLocaleString();
    document.getElementById('total-constructors').textContent = totalConstructors.toLocaleString();
    document.getElementById('total-circuits').textContent = totalCircuits.toLocaleString();
}

function createRacesByYearChart() {
    const ctx = document.getElementById('racesByYearChart');
    if (!ctx) return;

    const racesByYear = {};
    allData.races.forEach(race => {
        const year = race.year;
        racesByYear[year] = (racesByYear[year] || 0) + 1;
    });

    const years = Object.keys(racesByYear).sort();
    const counts = years.map(year => racesByYear[year]);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Races per Year',
                data: counts,
                backgroundColor: 'rgba(255, 24, 1, 0.8)',
                borderColor: 'rgba(255, 24, 1, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            },
            plugins: {
                legend: { labels: { color: 'rgba(255, 255, 255, 0.8)' } }
            }
        }
    });
}

function createTopDriversChart() {
    const ctx = document.getElementById('topDriversChart');
    if (!ctx) return;

    const driverWins = {};
    allData.results.forEach(result => {
        if (result.position === '1') {
            const driverId = result.driverId;
            const driver = allData.drivers.find(d => d.driverId === driverId);
            if (driver) {
                const driverName = `${driver.forename} ${driver.surname}`;
                driverWins[driverName] = (driverWins[driverName] || 0) + 1;
            }
        }
    });

    const topDrivers = Object.entries(driverWins)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topDrivers.map(([name]) => name),
            datasets: [{
                label: 'Race Wins',
                data: topDrivers.map(([,wins]) => wins),
                backgroundColor: 'rgba(255, 215, 0, 0.8)',
                borderColor: 'rgba(255, 215, 0, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            },
            plugins: {
                legend: { labels: { color: 'rgba(255, 255, 255, 0.8)' } }
            }
        }
    });
}

function loadDriversData() {
    if (!dataLoaded) return;

    populateYearSelect('driver-year-select');

    const latestYear = Math.max(...allData.races.map(r => parseInt(r.year)));
    loadDriversStandings(latestYear);
}

function loadDriversStandings(year) {
    const standings = allData.driverStandings.filter(s => s.raceId && allData.races.find(r => r.raceId === s.raceId && r.year === year.toString()));

    const yearRaces = allData.races.filter(r => r.year === year.toString()).sort((a, b) => parseInt(b.round) - parseInt(a.round));
    if (yearRaces.length === 0) return;

    const latestRace = yearRaces[0];
    const latestStandings = standings.filter(s => s.raceId === latestRace.raceId).sort((a, b) => parseInt(a.position) - parseInt(b.position));

    updatePodium(latestStandings.slice(0, 3));

    updateDriversTable(latestStandings);
}

function updatePodium(top3) {
    const positions = ['first', 'second', 'third'];

    positions.forEach((pos, index) => {
        const driver = top3[index];
        const element = document.getElementById(`${pos}-place`);

        if (driver) {
            const driverData = allData.drivers.find(d => d.driverId === driver.driverId);
            element.innerHTML = `
                <div class="driver-name">${driverData ? `${driverData.forename} ${driverData.surname}` : 'Unknown'}</div>
                <div class="driver-points">${driver.points} pts</div>
            `;
        } else {
            element.innerHTML = `
                <div class="driver-name">-</div>
                <div class="driver-points">-</div>
            `;
        }
    });
}

function updateConstructorPodium(top3) {
    const positions = ['first', 'second', 'third'];

    positions.forEach((pos, index) => {
        const constructor = top3[index];
        const element = document.getElementById(`${pos}-constructor`);

        if (constructor) {
            const constructorData = allData.constructors.find(c => c.constructorId === constructor.constructorId);
            element.innerHTML = `
                <div class="constructor-name">${constructorData ? constructorData.name : 'Unknown'}</div>
                <div class="constructor-points">${constructor.points} pts</div>
            `;
        } else {
            element.innerHTML = `
                <div class="constructor-name">-</div>
                <div class="constructor-points">-</div>
            `;
        }
    });
}

function updateDriversTable(standings) {
    const tbody = document.getElementById('drivers-table-body');
    tbody.innerHTML = '';

    const year = standings.length > 0 ? allData.races.find(r => r.raceId === standings[0].raceId)?.year : null;

    const driverPodiums = {};
    if (year) {
        const yearRaces = allData.races.filter(r => r.year === year);
        yearRaces.forEach(race => {
            const raceResults = allData.results.filter(result => result.raceId === race.raceId && result.position <= 3);
            raceResults.forEach(result => {
                const driverId = result.driverId;
                driverPodiums[driverId] = (driverPodiums[driverId] || 0) + 1;
            });
        });
    }

    standings.forEach(standing => {
        const driver = allData.drivers.find(d => d.driverId === standing.driverId);

        let constructorName = 'Unknown';
        if (year) {
            const yearRaces = allData.races.filter(r => r.year === year);
            for (const race of yearRaces) {
                const raceResult = allData.results.find(r => r.raceId === race.raceId && r.driverId === standing.driverId);
                if (raceResult) {
                    const constructor = allData.constructors.find(c => c.constructorId === raceResult.constructorId);
                    if (constructor) {
                        constructorName = constructor.name;
                        break;
                    }
                }
            }
        }

        const podiums = driverPodiums[standing.driverId] || 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${standing.position}</td>
            <td>${driver ? `${driver.forename} ${driver.surname}` : 'Unknown'}</td>
            <td>${constructorName}</td>
            <td>${standing.points}</td>
            <td>${standing.wins || 0}</td>
            <td>${podiums}</td>
        `;
        tbody.appendChild(row);
    });
}

function loadConstructorsData() {
    if (!dataLoaded) return;

    populateYearSelect('constructor-year-select');

    const latestYear = Math.max(...allData.races.map(r => parseInt(r.year)));
    loadConstructorsStandings(latestYear);
}

function loadConstructorsStandings(year) {
    const standings = allData.constructorStandings.filter(s => s.raceId && allData.races.find(r => r.raceId === s.raceId && r.year === year.toString()));

    const yearRaces = allData.races.filter(r => r.year === year.toString()).sort((a, b) => parseInt(b.round) - parseInt(a.round));
    if (yearRaces.length === 0) return;

    const latestRace = yearRaces[0];
    const latestStandings = standings.filter(s => s.raceId === latestRace.raceId).sort((a, b) => parseInt(a.position) - parseInt(b.position));

    updateConstructorPodium(latestStandings.slice(0, 3));

    updateConstructorsTable(latestStandings);
}

function updateConstructorsTable(standings) {
    const tbody = document.getElementById('constructors-table-body');
    tbody.innerHTML = '';

    const year = standings.length > 0 ? allData.races.find(r => r.raceId === standings[0].raceId)?.year : null;

    const constructorPodiums = {};
    if (year) {
        const yearRaces = allData.races.filter(r => r.year === year);
        yearRaces.forEach(race => {
            const raceResults = allData.results.filter(result => result.raceId === race.raceId && result.position <= 3);
            raceResults.forEach(result => {
                const constructorId = result.constructorId;
                constructorPodiums[constructorId] = (constructorPodiums[constructorId] || 0) + 1;
            });
        });
    }

    standings.forEach(standing => {
        const constructor = allData.constructors.find(c => c.constructorId === standing.constructorId);
        const podiums = constructorPodiums[standing.constructorId] || 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${standing.position}</td>
            <td>${constructor ? constructor.name : 'Unknown'}</td>
            <td>${constructor ? constructor.nationality : 'Unknown'}</td>
            <td>${standing.points}</td>
            <td>${standing.wins || 0}</td>
            <td>${podiums}</td>
        `;
        tbody.appendChild(row);
    });
}

function loadCircuitsData() {
    if (!dataLoaded) return;

    const circuitsGrid = document.getElementById('circuits-grid');
    circuitsGrid.innerHTML = '';

    allData.circuits.forEach(circuit => {
        const raceCount = allData.races.filter(r => r.circuitId === circuit.circuitId).length;

        const card = document.createElement('div');
        card.className = 'circuit-card';
        card.innerHTML = `
            <div class="circuit-header">
                <div class="circuit-name">${circuit.name}</div>
                <div class="circuit-location">${circuit.location}, ${circuit.country}</div>
            </div>
            <div class="circuit-details">
                <div class="circuit-info">
                    <div class="circuit-info-item">
                        <div class="circuit-info-label">Races Held</div>
                        <div class="circuit-info-value">${raceCount}</div>
                    </div>
                    <div class="circuit-info-item">
                        <div class="circuit-info-label">First Race</div>
                        <div class="circuit-info-value">${getFirstRaceYear(circuit.circuitId)}</div>
                    </div>
                </div>
            </div>
        `;
        circuitsGrid.appendChild(card);
    });
}

function getFirstRaceYear(circuitId) {
    const circuitRaces = allData.races.filter(r => r.circuitId === circuitId);
    if (circuitRaces.length === 0) return 'N/A';
    return Math.min(...circuitRaces.map(r => parseInt(r.year)));
}

function loadRacesData() {
    if (!dataLoaded) return;

    populateYearSelect('race-year-select');
    populateCircuitSelect();

    const latestYear = Math.max(...allData.races.map(r => parseInt(r.year)));
    loadRacesForYear(latestYear);
}

function loadRacesForYear(year, circuitId = null) {
    let yearRaces = allData.races.filter(r => r.year === year.toString()).sort((a, b) => parseInt(a.round) - parseInt(b.round));

    if (circuitId) {
        yearRaces = yearRaces.filter(r => r.circuitId === circuitId);
    }

    const raceResults = document.getElementById('race-results');
    raceResults.innerHTML = '';

    if (yearRaces.length === 0) {
        raceResults.innerHTML = '<div class="no-results">No races found for the selected filters.</div>';
        return;
    }

    yearRaces.forEach(race => {
        const circuit = allData.circuits.find(c => c.circuitId === race.circuitId);
        const raceResultsData = allData.results.filter(r => r.raceId === race.raceId).sort((a, b) => parseInt(a.positionOrder) - parseInt(b.positionOrder));

        const raceCard = document.createElement('div');
        raceCard.className = 'race-card';
        raceCard.innerHTML = `
            <div class="race-header">
                <div class="race-title">Round ${race.round}: ${race.name}</div>
                <div class="race-meta">${circuit ? circuit.name : 'Unknown Circuit'} - ${race.date}</div>
            </div>
            <div class="race-positions">
                ${raceResultsData.slice(0, 10).map(result => {
                    const driver = allData.drivers.find(d => d.driverId === result.driverId);
                    const constructor = allData.constructors.find(c => c.constructorId === result.constructorId);
                    return `
                        <div class="position-row">
                            <div class="position-number">${result.position}</div>
                            <div class="position-driver">${driver ? `${driver.forename} ${driver.surname}` : 'Unknown'}</div>
                            <div class="position-constructor">${constructor ? constructor.name : 'Unknown'}</div>
                            <div class="position-time">${(result.time && result.time !== '\\N') ?
                                (result.time.startsWith('+') ? result.time : formatTime(result.time)) :
                                ((result.milliseconds && result.milliseconds !== '\\N') ? formatTime(parseInt(result.milliseconds) / 1000) : 'DNF')}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        raceResults.appendChild(raceCard);
    });
}

function loadVisualizationsData() {
    if (!dataLoaded) return;

    populateYearSelect('viz-year');
    populateDriverSelect('viz-driver');

    document.getElementById('viz-type').addEventListener('change', updateVisualization);
    document.getElementById('viz-year').addEventListener('change', updateVisualization);
    document.getElementById('viz-driver').addEventListener('change', updateVisualization);

    updateVisualization();
}

function updateVisualization() {
    const vizType = document.getElementById('viz-type').value;
    const year = document.getElementById('viz-year').value;
    const driver = document.getElementById('viz-driver').value;

    const driverGroup = document.querySelector('label[for="viz-driver"]').parentElement;
    if (vizType === 'lap-times') {
        driverGroup.style.visibility = 'visible';
    } else {
        driverGroup.style.visibility = 'hidden';
    }

    let driversToShow = allData.drivers;
    if (year) {
        if (vizType === 'lap-times') {
            const yearRaces = allData.races.filter(r => r.year === year.toString());
            const driverIdsWithPitStops = new Set();
            yearRaces.forEach(race => {
                allData.pitStops.filter(p => p.raceId === race.raceId).forEach(p => {
                    driverIdsWithPitStops.add(p.driverId);
                });
            });
            driversToShow = allData.drivers.filter(d => driverIdsWithPitStops.has(d.driverId));
        } else {
            const yearRaces = allData.races.filter(r => r.year === year.toString());
            const driverIdsInYear = new Set();
            yearRaces.forEach(race => {
                allData.results.filter(r => r.raceId === race.raceId).forEach(result => {
                    driverIdsInYear.add(result.driverId);
                });
            });
            driversToShow = allData.drivers.filter(d => driverIdsInYear.has(d.driverId));
        }
    }

    const select = document.getElementById('viz-driver');
    select.innerHTML = '<option value="">Select Driver</option>';
    driversToShow.sort((a, b) => `${a.surname} ${a.forename}`.localeCompare(`${b.surname} ${b.forename}`)).forEach(driverOption => {
        const option = document.createElement('option');
        option.value = driverOption.driverId;
        option.textContent = `${driverOption.forename} ${driverOption.surname}`;
        select.appendChild(option);
    });

    if (driver && driversToShow.find(d => d.driverId === driver)) {
        select.value = driver;
    }

    const ctx = document.getElementById('main-visualization-chart');
    if (!ctx) return;

    if (window.mainChart) {
        window.mainChart.destroy();
    }

    switch (vizType) {
        case 'lap-times':
            createLapTimesVisualization(year, driver);
            break;
        case 'points-progression':
            createPointsProgressionVisualization(year);
            break;
        case 'constructor-performance':
            createConstructorPerformanceVisualization(year);
            break;
    }
}

function createLapTimesVisualization(year, driver) {
    const ctx = document.getElementById('main-visualization-chart');

    let pitStopData = [];
    if (year && driver) {
        pitStopData = allData.pitStops.filter(stop =>
            stop.driverId === driver &&
            allData.races.find(r => r.raceId === stop.raceId && r.year === year.toString())
        );
    } else if (year) {
        const yearRaces = allData.races.filter(r => r.year === year.toString());
        pitStopData = yearRaces.map(race => {
            const raceStops = allData.pitStops.filter(stop => stop.raceId === race.raceId);
            const avgTime = raceStops.length > 0 ?
                raceStops.reduce((sum, stop) => sum + parseFloat(stop.duration || 0), 0) / raceStops.length : 0;
            return {
                raceName: race.name,
                avgDuration: avgTime
            };
        }).filter(item => item.avgDuration > 0);
    }

    if (pitStopData.length === 0) {
        const yearRaces = allData.races.filter(r => r.year === year.toString()).sort((a, b) => parseInt(a.round) - parseInt(b.round));
        const driverResults = yearRaces.map(race => {
            const result = allData.results.find(r => r.raceId === race.raceId && r.driverId === driver);
            return {
                raceName: `R${race.round}`,
                position: result ? parseInt(result.positionOrder) : null
            };
        }).filter(item => item.position !== null);

        window.mainChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: driverResults.map(d => d.raceName),
                datasets: [{
                    label: 'Finishing Position',
                    data: driverResults.map(d => d.position),
                    borderColor: 'rgba(255, 24, 1, 1)',
                    backgroundColor: 'rgba(255, 24, 1, 0.1)',
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(255, 24, 1, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                scales: {
                    y: {
                        reverse: true,
                        beginAtZero: false,
                        min: 1,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    }
                },
                plugins: {
                    legend: { labels: { color: 'rgba(255, 255, 255, 0.8)' } },
                    title: {
                        display: true,
                        text: `${year} Season: Finishing Positions`,
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: { size: 16 }
                    }
                }
            }
        });
        return;
    }

    window.mainChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: pitStopData.map((_, i) => `Stop ${i + 1}`),
            datasets: [{
                label: 'Pit Stop Duration (seconds)',
                data: pitStopData.map(stop => parseFloat(stop.duration || 0)),
                backgroundColor: 'rgba(255, 24, 1, 0.8)',
                borderColor: 'rgba(255, 24, 1, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            },
            plugins: {
                legend: { labels: { color: 'rgba(255, 255, 255, 0.8)' } },
                title: {
                    display: true,
                    text: `${year} Season: Pit Stop Performance`,
                    color: 'rgba(255, 255, 255, 0.9)',
                    font: { size: 16 }
                }
            }
        }
    });
}

function createPointsProgressionVisualization(year) {
    const ctx = document.getElementById('main-visualization-chart');

    const yearRaces = allData.races.filter(r => r.year === year.toString()).sort((a, b) => parseInt(a.round) - parseInt(b.round));
    const driverStandings = allData.driverStandings.filter(s =>
        allData.races.find(r => r.raceId === s.raceId && r.year === year.toString())
    );

    const finalStandings = driverStandings.filter(s => s.raceId === yearRaces[yearRaces.length - 1]?.raceId)
        .sort((a, b) => parseInt(a.position) - parseInt(b.position))
        .slice(0, 5);

    if (finalStandings.length === 0) {
        window.mainChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['No Data'],
                datasets: [{
                    label: 'No championship data available',
                    data: [0]
                }]
            }
        });
        return;
    }

    const datasets = finalStandings.map((finalStanding, index) => {
        const driver = allData.drivers.find(d => d.driverId === finalStanding.driverId);
        const driverName = driver ? `${driver.forename} ${driver.surname}` : `Driver ${finalStanding.driverId}`;

        const progression = yearRaces.map(race => {
            const standing = driverStandings.find(s => s.raceId === race.raceId && s.driverId === finalStanding.driverId);
            return standing ? parseInt(standing.points) : 0;
        });

        const colors = [
            'rgba(255, 24, 1, 1)',
            'rgba(255, 215, 0, 1)',
            'rgba(0, 212, 170, 1)',
            'rgba(55, 66, 250, 1)',
            'rgba(255, 107, 53, 1)'
        ];

        return {
            label: driverName,
            data: progression,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length].replace('1)', '0.1)'),
            tension: 0.4,
            pointBackgroundColor: colors[index % colors.length],
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            fill: false
        };
    });

    window.mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: yearRaces.map((_, i) => `Race ${i + 1}`),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            },
            plugins: {
                legend: { labels: { color: 'rgba(255, 255, 255, 0.8)' } },
                title: {
                    display: true,
                    text: `${year} Championship: Points Progression`,
                    color: 'rgba(255, 255, 255, 0.9)',
                    font: { size: 16 }
                }
            }
        }
    });
}

function createConstructorPerformanceVisualization(year) {
    const ctx = document.getElementById('main-visualization-chart');

    const constructorStandings = allData.constructorStandings.filter(s =>
        allData.races.find(r => r.raceId === s.raceId && r.year === year.toString())
    );

    const yearRaces = allData.races.filter(r => r.year === year.toString()).sort((a, b) => parseInt(b.round) - parseInt(a.round));
    const latestRace = yearRaces[0];

    if (!latestRace) {
        window.mainChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['No Data'],
                datasets: [{
                    label: 'No constructor data available',
                    data: [0]
                }]
            }
        });
        return;
    }

    const latestStandings = constructorStandings.filter(s => s.raceId === latestRace.raceId)
        .sort((a, b) => parseInt(a.position) - parseInt(b.position))
        .slice(0, 10);

    const labels = latestStandings.map(standing => {
        const constructor = allData.constructors.find(c => c.constructorId === standing.constructorId);
        return constructor ? constructor.name : `Constructor ${standing.constructorId}`;
    });

    const pointsData = latestStandings.map(standing => parseInt(standing.points));
    const winsData = latestStandings.map(standing => parseInt(standing.wins || 0));

    window.mainChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Championship Points',
                data: pointsData,
                backgroundColor: 'rgba(255, 24, 1, 0.8)',
                borderColor: 'rgba(255, 24, 1, 1)',
                borderWidth: 1,
                yAxisID: 'y'
            }, {
                label: 'Race Wins',
                data: winsData,
                backgroundColor: 'rgba(255, 215, 0, 0.8)',
                borderColor: 'rgba(255, 215, 0, 1)',
                borderWidth: 1,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    title: {
                        display: true,
                        text: 'Championship Points',
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    title: {
                        display: true,
                        text: 'Race Wins',
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: { labels: { color: 'rgba(255, 255, 255, 0.8)' } },
                title: {
                    display: true,
                    text: `${year} Constructor Championship Standings`,
                    color: 'rgba(255, 255, 255, 0.9)',
                    font: { size: 16 }
                }
            }
        }
    });
}

function populateYearSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Select Year</option>';

    const years = [...new Set(allData.races.map(r => parseInt(r.year)))].sort((a, b) => b - a);

    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    });
}

function populateCircuitSelect(year = null) {
    const select = document.getElementById('race-circuit-select');
    if (!select) return;

    select.innerHTML = '<option value="">Select Circuit</option>';

    let circuitsToShow = allData.circuits;

    if (year) {
        const yearRaceCircuitIds = new Set(
            allData.races
                .filter(r => r.year === year.toString())
                .map(r => r.circuitId)
        );
        circuitsToShow = allData.circuits.filter(c => yearRaceCircuitIds.has(c.circuitId));
    }

    circuitsToShow.sort((a, b) => a.name.localeCompare(b.name)).forEach(circuit => {
        const option = document.createElement('option');
        option.value = circuit.circuitId;
        option.textContent = circuit.name;
        select.appendChild(option);
    });
}

function populateDriverSelect(selectId, year = '') {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Select Driver</option>';

    let driversToShow = allData.drivers;

    if (year) {
        const yearRaces = allData.races.filter(r => r.year === year.toString());
        const driverIdsInYear = new Set();
        yearRaces.forEach(race => {
            allData.results.filter(r => r.raceId === race.raceId).forEach(result => {
                driverIdsInYear.add(result.driverId);
            });
        });
        driversToShow = allData.drivers.filter(d => driverIdsInYear.has(d.driverId));
    }

    driversToShow.sort((a, b) => `${a.surname} ${a.forename}`.localeCompare(`${b.surname} ${b.forename}`)).forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.driverId;
        option.textContent = `${driver.forename} ${driver.surname}`;
        select.appendChild(option);
    });
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';

    if (!isNaN(timeString)) {
        const totalSeconds = parseInt(timeString) / 1000;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = (totalSeconds % 60).toFixed(3);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds}`;
        } else {
            return `${minutes}:${seconds}`;
        }
    }

    const parts = timeString.split(':');
    if (parts.length === 3) {
        return timeString;
    } else if (parts.length === 2) {
        return timeString;
    }

    return timeString;
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
}

function showStatusMessage(message, type) {
    console.log(`${type}: ${message}`);
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('F1 Data Dashboard initialized');

    initializeNavigation();

    await loadAllData();

    document.getElementById('driver-year-select')?.addEventListener('change', function() {
        loadDriversStandings(this.value);
    });

    document.getElementById('constructor-year-select')?.addEventListener('change', function() {
        loadConstructorsStandings(this.value);
    });

    document.getElementById('race-year-select')?.addEventListener('change', function() {
        const year = this.value;
        document.getElementById('race-circuit-select').value = '';
        populateCircuitSelect(year);
        loadRacesForYear(year);
    });

    document.getElementById('race-circuit-select')?.addEventListener('change', function() {
        const year = document.getElementById('race-year-select').value;
        const circuitId = this.value;
        loadRacesForYear(year, circuitId);
    });
});
