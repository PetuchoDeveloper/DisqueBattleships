const playersDisplay = document.querySelector('#jugadores')
const tablerosDisplay = document.querySelector('#tableros')
const startButton = document.querySelector('#start-button')
const welcomeScreen = document.querySelector('#welcome-screen')

let casillas = 0
let hasTeam1Configured = false
let hasTeam2Configured = false
let status = "configurando"
let team1Color = ""
let team2Color = ""
let boatsLimit = 0
let team1Boats = 0
let team2Boats = 0

let players = []
let teamTurn = "team1"
let team1playerTurns = []
let team2playerTurns = []
let team1playerTurn = 0
let team2playerTurn = 0

let team1Table = []
let team2Table = []
let team1TacticalTable = []
let team2TacticalTable = []

const showHitAnimation = (casilla) => {
    // Create video element
    const video = document.createElement('video')
    video.src = './assets/video/Explosion.mp4'
    video.muted = false
    video.style.display = 'none'
    document.body.appendChild(video)

    // Create canvas element
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Get casilla dimensions and position
    console.log(casilla.offsetWidth)
    console.log(casilla.offsetHeight)
    const rect = casilla.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Style canvas to overlay casilla
    canvas.style.position = 'absolute'
    canvas.style.left = rect.left + window.scrollX + 'px'
    canvas.style.top = rect.top + window.scrollY + 'px'
    canvas.style.width = casilla.offsetWidth + 'px'
    canvas.style.height = casilla.offsetHeight + 'px'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '1000'

    document.body.appendChild(canvas)

    console.log(canvas)
    // Process video frames to remove greenscreen
    const processFrame = () => {
        if (video.paused || video.ended) {
            // Clean up when video ends
            canvas.remove()
            video.remove()
            return
        }

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Remove green pixels (chroma key)
        for (let i = 0; i < data.length; i += 4) {
            const red = data[i]
            const green = data[i + 1]
            const blue = data[i + 2]

            // Check if pixel is green (greenscreen detection)
            // Green channel should be significantly higher than red and blue
            if (green > 100 && green > red * 1.5 && green > blue * 1.5) {
                data[i + 3] = 0 // Set alpha to 0 (transparent)
            }
        }

        // Put processed image data back to canvas
        ctx.putImageData(imageData, 0, 0)

        // Continue processing next frame
        requestAnimationFrame(processFrame)
    }

    // Start video and processing
    video.play().then(() => {
        processFrame()
    }).catch(err => {
        console.error('Error playing explosion video:', err)
        canvas.remove()
        video.remove()
    })
}


const createPlayer = () => {
    const name = document.querySelector('#player-name').value
    const color = document.querySelector('#player-color').value
    const team = document.querySelector('input[name="player-team"]:checked').value
    if (!team) {
        alert("Debes seleccionar un equipo")
        return;
    }
    if (!name) {
        alert("Debes ingresar un nombre")
        return;
    }
    players.push({ name, color, team })
    console.log(players)

    const existingFeedback = document.querySelector('.player-feedback')
    if (existingFeedback) existingFeedback.remove()

    document.querySelector('#player-form').insertAdjacentHTML('beforeend', `
        <div class="player-feedback">✓ Jugador "${name}" agregado al ${team === 'team1' ? 'Equipo 1' : 'Equipo 2'}</div>
    `)

    document.querySelector('#player-name').value = ''

    setTimeout(() => {
        const feedback = document.querySelector('.player-feedback')
        if (feedback) feedback.remove()
    }, 3000)
}

const continueConfiguring = () => {
    if (!(players.find(p => p.team == "team1") && players.find(p => p.team == "team2"))) {
        alert("Debes crear al menos un jugador para cada equipo")
        return;
    }

    const playerForm = document.querySelector('#player-form')
    playerForm.remove()
    welcomeScreen.querySelector('button').remove()
    welcomeScreen.querySelector('h1').innerText = "Configura el juego"

    welcomeScreen.insertAdjacentHTML('beforeend', `
        <div id="game-form">
            <input type="number" placeholder="Casillas" id="game-casillas">
            <input type="number" placeholder="Barcos por equipo" id="boats-limit">
            <input type='color' id="team1-color">
            <label for="team1-color">Color del equipo 1</label>
            <input type='color' id="team2-color">
            <label for="team2-color">Color del equipo 2</label>
            <button onclick="startGame()">Comenzar</button>
        </div>
    `)
}

const generateTables = () => {
    document.querySelector('.configuring-boats').style.display = "flex"
    document.querySelector('#boats-limit').innerText = boatsLimit

    playersDisplay.insertAdjacentHTML('beforeend', `
        <div id="team1">
            <div class="team-header">
                <div class="distintivo" style="background-color: ${team1Color}"></div>
                <h2>Equipo 1</h2>
            </div>
            
            ${players.filter(p => p.team == "team1").map(p =>
        `<div class="jugador">
                <div class="distintivo" style="background-color: ${p.color}"></div>
                <h3>${p.name}</h3>
            </div>`).join('')}

            <button class="configurar-barcos-team1" onclick="configureBoats('team1')">Configurar barcos</button>
        </div>
        <div id="team2">
            <div class="team-header">
                <div class="distintivo" style="background-color: ${team2Color}"></div>
                <h2>Equipo 2</h2>
            </div>
            ${players.filter(p => p.team == "team2").map(p =>
            `<div class="jugador">
                <div class="distintivo" style="background-color: ${p.color}"></div>
                <h3>${p.name}</h3>
            </div>`).join('')}
            <button class="configurar-barcos-team2" onclick="configureBoats('team2')">Configurar barcos</button>
        </div>
    `)
    for (let i = 0; i < casillas; i++) {
        team1Table.push([])
        team2Table.push([])
        team1TacticalTable.push([])
        team2TacticalTable.push([])

        tablerosDisplay.style.display = "grid"
        tablerosDisplay.style.gridTemplateColumns = `repeat(${casillas}, 1fr)`
        tablerosDisplay.style.gridTemplateRows = `repeat(${casillas}, 1fr)`
        for (let j = 0; j < casillas; j++) {
            team1Table[i].push(0)
            team2Table[i].push(0)
            team1TacticalTable[i].push(0)
            team2TacticalTable[i].push(0)
            tablerosDisplay.insertAdjacentHTML('beforeend', `
            <div class="casilla" id="casilla-${i}-${j}" class="team1">       
            </div>
        `)
        }

    }
}

const displayConfig = (team) => {
    let boatsPlaced = 0
    document.querySelector('#confirm-button').addEventListener('click', () => {
        if (boatsPlaced == boatsLimit) {
            confirmBoats(team)
            boatsPlaced = 0
        } else {
            alert("debes colocar todos los barcos")
            return;
        }
    })
    document.querySelector('#confirm-button').style.display = "block"
    document.querySelectorAll('.configuring-boats p')[0].innerText = `Configurando barcos para ${team}`

    document.querySelectorAll('.casilla').forEach(casilla => {
        casilla.addEventListener('click', () => {
            let y = casilla.id.split('-')[1]
            let x = casilla.id.split('-')[2]

            if (team == "team1") {
                if (team1Table[y][x] == 1) {
                    boatsPlaced--
                    casilla.style.backgroundColor = ""
                    casilla.style.backgroundImage = ""
                    team1Table[y][x] = 0
                    return;
                } else {
                    if (boatsPlaced >= boatsLimit) {
                        alert("Has alcanzado el limite de barcos")
                        return;
                    }
                    boatsPlaced++
                    casilla.style.backgroundColor = team1Color
                    casilla.style.backgroundImage = "url('./assets/img/battleship-removebg-preview.png')"
                    team1Table[y][x] = 1
                }
            } else {
                if (team2Table[y][x] == 1) {
                    boatsPlaced--
                    casilla.style.backgroundColor = ""
                    casilla.style.backgroundImage = ""
                    team2Table[y][x] = 0
                    return;
                } else {
                    if (boatsPlaced >= boatsLimit) {
                        alert("Has alcanzado el limite de barcos")
                        return;
                    }
                    boatsPlaced++
                    casilla.style.backgroundColor = team2Color
                    casilla.style.backgroundImage = "url('./assets/img/battleship-removebg-preview.png')"
                    team2Table[y][x] = 1
                }
            }
        }
        )
    })
}
const configureBoats = (team) => {
    //remove event listeners
    document.querySelector('#confirm-button').replaceWith(document.querySelector('#confirm-button').cloneNode(true))
    //prevent right click from triggering context menu
    document.querySelectorAll('.casilla').forEach(casilla => {
        casilla.style.backgroundColor = ""
        casilla.style.backgroundImage = ""
        //remove event listeners
        casilla.replaceWith(casilla.cloneNode(true))
        casilla.addEventListener('contextmenu', (e) => {
            e.preventDefault()
        })
    })

    displayConfig(team)
}

const confirmBoats = (team) => {
    document.querySelector('#confirm-button').style.display = "none"
    document.querySelectorAll('.configuring-boats p')[0].innerText = `Barcos para ${team} configurados`
    document.querySelector(`.configurar-barcos-${team}`).style.display = "none"

    document.querySelectorAll('.casilla').forEach(casilla => {
        casilla.style.backgroundColor = ""
        casilla.style.backgroundImage = ""
        casilla.replaceWith(casilla.cloneNode(true))
    })

    console.log(team1Table, team2Table)
    if (team == "team1") {
        hasTeam1Configured = true
    } else {
        hasTeam2Configured = true
    }
    if (hasTeam1Configured && hasTeam2Configured) {
        status = "configured"
        document.querySelector('#confirm-button').replaceWith(document.querySelector('#confirm-button').cloneNode(true))
        document.querySelector('#confirm-button').innerText = "Comenzar"
        document.querySelector('#confirm-button').style.display = "block"
        team1playerTurns.push(players.find(p => p.team == "team1"))
        team2playerTurns.push(players.find(p => p.team == "team2"))
        document.querySelector('#confirm-button').addEventListener('click', () => {
            startRound()
        })
    }
}
const displayTacticalTables = () => {

    document.querySelectorAll('.casilla').forEach((casilla) => {
        casilla.style.backgroundColor = ""
        casilla.style.backgroundImage = ""
        let y = casilla.id.split('-')[1]
        let x = casilla.id.split('-')[2]
        if (teamTurn == "team1") {
            if (team1TacticalTable[y][x] == 1) {
                casilla.style.backgroundColor = 'gray'
            }
            if (team1TacticalTable[y][x] == 2) {
                casilla.style.backgroundColor = 'red'
            }
        } else {
            if (team2TacticalTable[y][x] == 1) {
                casilla.style.backgroundColor = 'gray'
            }
            if (team2TacticalTable[y][x] == 2) {
                casilla.style.backgroundColor = 'red'
            }
        }
        //remove event listeners
        casilla.replaceWith(casilla.cloneNode(true))
    })
}

const win = (c) => {
    // Show explosion animation on hit
    if (c) {
        showHitAnimation(c)
    }
    document.querySelector('body').insertAdjacentHTML('beforeend', `
            <div id="turn-screen">
                <h2>${teamTurn == "team1" ? team1playerTurns[team1playerTurn].name : team2playerTurns[team2playerTurn].name}</h2>
                <h3>Ha ganado por el equipo ${teamTurn}!</h3>
                <button id="next-round-button" onclick="restartGame()">Jugar de nuevo</button>
            </div>
            `)
}

const hit = (c) => {
    // Show explosion animation on hit
    if (c) {
        showHitAnimation(c)
    }

    document.querySelectorAll('.casilla').forEach((casilla) => {
        casilla.replaceWith(casilla.cloneNode(true))
    })
    document.querySelector('body').insertAdjacentHTML('beforeend', `
            <div id="turn-screen">
                <h2>${teamTurn == "team1" ? team1playerTurns[team1playerTurn].name : team2playerTurns[team2playerTurn].name}</h2>
                <h3>Le ha dado a un barco!</h3>
                <button id="next-round-button" onclick="startRound()">Turno del enemigo</button>
            </div>
            `)
}
const miss = () => {
    document.querySelectorAll('.casilla').forEach((casilla) => {
        casilla.replaceWith(casilla.cloneNode(true))
    })
    document.querySelector('body').insertAdjacentHTML('beforeend', `
            <div id="turn-screen">
                <h2>${teamTurn == "team1" ? team1playerTurns[team1playerTurn].name : team2playerTurns[team2playerTurn].name}</h2>
                <h3>Le ha fallado!</h3>
                <button id="next-round-button" onclick="startRound()">Turno del enemigo</button>
            </div>
            `)
}
const attack = () => {
    document.querySelector('#turn-screen').remove()

    displayTacticalTables()

    document.querySelectorAll('.casilla').forEach((casilla) => {
        casilla.addEventListener('click', () => {
            let y = casilla.id.split('-')[1]
            let x = casilla.id.split('-')[2]
            if (teamTurn == "team1") {
                if (team1TacticalTable[y][x] == 1 || team1TacticalTable[y][x] == 2) {
                    alert("Ya has atacado a esta casilla")
                    return
                }
                if (team2Table[y][x] == 1) {
                    team2Table[y][x] = 0
                    team1TacticalTable[y][x] = 2
                    casilla.style.backgroundColor = 'red'
                    team2Boats--
                    if (team2Boats == 0) {
                        win(casilla)
                        return
                    }
                    hit(casilla)

                } else {
                    team1TacticalTable[y][x] = 1
                    casilla.style.backgroundColor = 'gray'
                    miss()
                }
                teamTurn = "team2"
                team1playerTurn++
                if (team1playerTurn == team1playerTurns.length) {
                    team1playerTurn = 0
                }
            } else {
                if (team2TacticalTable[y][x] == 1 || team2TacticalTable[y][x] == 2) {
                    alert("Ya has atacado a esta casilla")
                    return
                }
                if (team1Table[y][x] == 1) {
                    team1Table[y][x] = 0
                    team2TacticalTable[y][x] = 2
                    casilla.style.backgroundColor = 'red'
                    team1Boats--
                    if (team1Boats == 0) {
                        win(casilla)
                        return
                    }
                    hit(casilla)

                } else {
                    team2TacticalTable[y][x] = 1
                    casilla.style.backgroundColor = 'gray'
                    miss()
                }
                teamTurn = "team1"
                team2playerTurn++
                if (team2playerTurn == team2playerTurns.length) {
                    team2playerTurn = 0
                }
            }
        })
    })
}

const startRound = () => {
    status = "playing"
    console.log(teamTurn)
    if (document.querySelector('#turn-screen')) {
        document.querySelector('#turn-screen').remove()
    }

    document.querySelectorAll('.casilla').forEach((casilla) => {
        casilla.style.backgroundColor = ""
        casilla.style.backgroundImage = ""
        //remove event listeners
        casilla.replaceWith(casilla.cloneNode(true))
    })
    document.querySelector('.configuring-boats').style.display = "none"
    document.querySelector('body').insertAdjacentHTML('beforeend', `
        <div id="turn-screen">
            <h2>Turno de ${teamTurn == "team1" ? team1playerTurns[team1playerTurn].name : team2playerTurns[team2playerTurn].name}</h2>
            <h3>Del equipo ${teamTurn}</h3>
            <button id="next-round-button" onclick="attack()">Iniciar turno</button>
        </div>
    `)
}

const startGame = () => {
    casillas = document.querySelector('#game-casillas').value
    team1Color = document.querySelector('#team1-color').value
    team2Color = document.querySelector('#team2-color').value
    boatsLimit = document.querySelector('#boats-limit').value
    team1Boats = boatsLimit
    team2Boats = boatsLimit

    if (casillas <= 2) {
        alert("el tablero debe ser al menos de 3x3")
        return;
    }
    if (boatsLimit <= 0) {
        alert("el limite de barcos debe ser al menos 1")
        return;
    }
    if (boatsLimit > casillas * casillas) {
        alert("el limite de barcos debe ser menor al numero de casillas")
        return;
    }

    welcomeScreen.remove()
    console.log(casillas, team1Color, team2Color, boatsLimit)
    generateTables()
}

const restartGame = () => {
    document.querySelector('#turn-screen').remove()
    document.querySelector('.configuring-boats p').innerText = 'Empieza a configurar los barcos'
    document.querySelector('#confirm-button').replaceWith(document.querySelector('#confirm-button').cloneNode(true))
    document.querySelector('#confirm-button').innerText = 'Confirmar acomodo'
    document.querySelector('#confirm-button').style.display = 'none'
    team1playerTurn = 0
    team2playerTurn = 0
    team1playerTurns = []
    team2playerTurns = []
    team1Table = []
    team2Table = []
    team1TacticalTable = []
    team2TacticalTable = []
    team1Boats = boatsLimit
    team2Boats = boatsLimit
    teamTurn = "team1"
    status = "configuring"
    playersDisplay.innerHTML = ""
    tablerosDisplay.innerHTML = ""
    hasTeam1Configured = false
    hasTeam2Configured = false
    generateTables()
}

startButton.addEventListener('click', () => {
    welcomeScreen.querySelector('h1').innerText = "Crea tu jugador"
    welcomeScreen.querySelector('button').remove()
    welcomeScreen.insertAdjacentHTML('beforeend', `
        <div id="player-form" action="">
            <div class="player-input-row">
                <input type="color" id="player-color" value="#1E88E5">
                <input type="text" placeholder="Nombre del jugador" id="player-name">
            </div>
            <div class="team-selection">
                <label for="player-team1">
                    <input type="radio" id="player-team1" name="player-team" value="team1">
                    Equipo 1
                </label>
                <label for="player-team2">
                    <input type="radio" id="player-team2" name="player-team" value="team2">
                    Equipo 2
                </label>
            </div>
            <button onclick="createPlayer()">Crear Jugador</button>
        </div>

        <button onclick="continueConfiguring()">Continuar</button>
    `)
})

