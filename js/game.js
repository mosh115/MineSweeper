'use strict'

var gBoard = []

var FLAG = '⛳';
var MINE = '💣';
var SMILE = '🙂'
var LOSE = '🙁'
var WIN = '😎'
var LIVE = '💖'
var HINT = '💡'



var gLevel = {
    SIZE: 4,
    MINES: 2,
    LIVES: 1,
    HINTS: 1,
    SAFE: 1
}

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    idTimer: null,
    lives: 0,
    hints: 0,
    isHint: false,
    mines: 2,
    safe: 1

}

function initGame() {
    gGame.isOn = true;
    gBoard = buildBoard();
    renderBoard(gBoard);
    addLivesAndHints()

    //Model 
    gGame.markedCount = gGame.mines;
    //Dom
    var elMarkedCount = document.querySelector('.markedCount')
    elMarkedCount.innerHTML = gGame.mines;


    var elBtnSafe = document.querySelector('#safe')
    elBtnSafe.innerText = `Safe click (${gGame.safe})`;


    //dom
    var elTimer = document.querySelector('.timer')
    elTimer.innerText = '00:00:00';


}

function buildBoard() {
    var board = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = {
                minesAroundCount: '',
                isShown: false,
                isMine: false,
                isMarked: false
            }
            board[i][j] = cell
        }
    }

    return board;
}

function setMinesNegsCount() {

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) continue
            var countMinesAround = findNegs({ i, j });
            if (countMinesAround > 0) gBoard[i][j].minesAroundCount = countMinesAround;
            else gBoard[i][j].minesAroundCount = '';
        }
    }
}

function findNegs(pos) {
    var countMines = 0

    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === pos.i && j === pos.j) continue;
            if (gBoard[i][j].isMine) countMines++
        }
    }
    return countMines;
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += `<tr class="row" >\n`
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j];
            // var id = 'cell-' + i + '-' + j;
            var className = `cell${i}-${j}`
            // className += (cell.isMine) ? ' mine' : ''
            className += (cell.isShown) ? ' shown' : ''
            // className += (cell.isMarked) ? ' marked' : ''
            var textCell = ''
            if (gBoard[i][j].isShown) {
                textCell = (board[i][j].isMine) ? MINE : board[i][j].minesAroundCount;
            }
            strHTML += `\t<td class="${className}" 
                            onclick="cellClicked(this, ${i}, ${j})"
                            onContextMenu=cellMarked(this,event,${i},${j}) >
                           ${textCell}
                         </td>\n`        }
        strHTML += `</tr>\n`
    }
    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHTML;

}

function cellClicked(elCell, i, j) {

    if (!gGame.isOn) return
    if (!gGame.shownCount) { // first time cell clicked
        addMines(i, j)
        setMinesNegsCount()
        setTimer();
    }
    if (gGame.isHint) {
        var negs = revealInHint({ i, j });
        setTimeout(unrevealInHint, 1000, negs)
        return;
    }

    var cell = gBoard[i][j];

    if (cell.isMarked || cell.isShown) return;

    if (cell.isMine) {
        //Model
        cell.isShown = true;
        gGame.shownCount++
        gGame.mines--
        gGame.markedCount--
        gGame.lives--
        //Dom
        removeLiveOrHint('lives')
        elCell.innerHTML = MINE;
        elCell.classList.add('shown');
        var elMarkedCount = document.querySelector('.markedCount')
        elMarkedCount.innerHTML = gGame.markedCount;

        elCell.classList.add('clicked');// add red botder if is Mine
        setTimeout(() => {
            elCell.classList.toggle('clicked') // remove red border
        }, 1000);

        if (!gGame.lives) {
            //Model
            gGame.isOn = false;
            clearInterval(gGame.idTimer);
            //Dom
            var elbuttonFace = document.querySelector('.face')
            elbuttonFace.innerHTML = LOSE;
            revealMines();
        }
    } else if (!cell.minesAroundCount) expandShown(i, j)// if cell is empty
    else { // if cell have a number

        //Model
        cell.isShown = true;
        gGame.shownCount++
        //Dom
        elCell.innerHTML = cell.minesAroundCount;
        elCell.classList.add('shown');
    }
    checkvictorious();
}

function addMines(posI, posJ) {

    var countMines = 0

    while (countMines < gLevel.MINES) {
        var i = getRandomInt(0, gLevel.SIZE);
        var j = getRandomInt(0, gLevel.SIZE);

        if (i === posI && j === posJ || gBoard[i][j].isMine) continue
        //Model
        gBoard[i][j].isMine = true;
        countMines++
    }
}

function cellMarked(elCell, ev, i, j) {
    ev.preventDefault()
    if (!gGame.isOn || gGame.isHint) return

    var cell = gBoard[i][j];
    var elMarkedCount = document.querySelector('.markedCount')

    if (cell.isShown) return;

    if (!cell.isMarked) {

        //Model
        cell.isMarked = true;
        gGame.markedCount--

        //Dom
        elCell.innerHTML = FLAG;
        elMarkedCount.innerHTML = gGame.markedCount;
        checkvictorious();
    } else {

        //Model 
        cell.isMarked = false;
        gGame.markedCount++

        //Dom
        elMarkedCount.innerHTML = gGame.markedCount;
        elCell.innerHTML = '';
    }
}

function checkvictorious() {
    var size = gLevel.SIZE * gLevel.SIZE;
    if (gGame.shownCount === size - gGame.mines &&
        gGame.markedCount === 0) {
        //Model
        gGame.isOn = false;
        clearInterval(gGame.idTimer)
        saveBestScore();

        var elbuttonFace = document.querySelector('.face')
        elbuttonFace.innerHTML = WIN;
    }
}

function restartGame() {
    var elbtn = document.querySelector('.face')
    elbtn.innerText = SMILE
    var elLives = document.querySelector('#lives')
    elLives.innerHTML = '';
    clearInterval(gGame.idTimer)
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.lives = gLevel.LIVES;
    gGame.hints = gLevel.HINTS;
    gGame.mines = gLevel.MINES;
    gGame.safe = gLevel.SAFE;
    initGame();

}

function expandShown(posI, posj) {

    for (var i = posI - 1; i <= posI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = posj - 1; j <= posj + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (gBoard[i][j].isShown || gBoard[i][j].isMarked) continue;
            if (i === posI && j === posj || gBoard[i][j].minesAroundCount) {
                gBoard[i][j].isShown = true
                gGame.shownCount++
                //Dom
                var elCurrCell = document.querySelector(`.cell${i}-${j}`);
                elCurrCell.innerText = gBoard[i][j].minesAroundCount;
                elCurrCell.classList.add('shown');
            } else expandShown(i, j);

            // if (gBoard[i][j].isShown) continue
            //Model


        }
    }
}

function setTimer() {
    var elTimer = document.querySelector('.timer')
    gGame.idTimer = setInterval(countTimer, 1000);
    gGame.secsPassed = 0;
    function countTimer() {
        ++gGame.secsPassed;
        var hour = Math.floor(gGame.secsPassed / 3600);
        var minute = Math.floor((gGame.secsPassed - hour * 3600) / 60);
        var seconds = gGame.secsPassed - (hour * 3600 + minute * 60);
        if (hour < 10) hour = "0" + hour;
        if (minute < 10) minute = "0" + minute;
        if (seconds < 10) seconds = "0" + seconds;
        elTimer.innerText = hour + ":" + minute + ":" + seconds;
    }
}

function changeDifficult(elBtn) {

    gLevel.SIZE = Math.sqrt(elBtn.innerText);

    switch (gLevel.SIZE) {
        case 4:
            gLevel.MINES = 2;
            gLevel.LIVES = 1;
            gLevel.HINTS = 1;
            gLevel.SAFE = 1;
            break;
        case 8:
            gLevel.MINES = 12;
            gLevel.LIVES = 2;
            gLevel.HINTS = 2;
            gLevel.SAFE = 2;
            break;
        case 12:
            gLevel.MINES = 30;
            gLevel.LIVES = 3;
            gLevel.HINTS = 3;
            gLevel.SAFE = 3
            break;
        default:
            return;
    }
    restartGame();

}

function revealMines() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j]
            if (cell.isMine) {
                //Model 
                cell.isShown = true;
                //Dom
                var elCurrCell = document.querySelector(`.cell${i}-${j}`);
                elCurrCell.innerHTML = MINE;
                elCurrCell.classList.add('shown');
            }
        }
    }
}

function addLivesAndHints() {
    gGame.lives = 0;
    gGame.hints = 0
    var elLives = document.querySelector('#lives')
    elLives.innerHTML = '';
    var lives = ''
    var hints = ''
    for (var i = 0; i < gLevel.LIVES; i++) {
        lives += LIVE;
        hints += HINT
        //Model
        gGame.lives++
        gGame.hints++

    }
    //Dom
    elLives = document.querySelector('#lives')
    elLives.innerHTML = lives;
    var elHints = document.querySelector('#hints')
    elHints.innerHTML = hints;
}

function removeLiveOrHint(element) {
    var elElement = document.querySelector(`#${element}`)
    elElement.innerHTML = '';
    var el = ''
    switch (element) {
        case 'lives':
            el = LIVE;

            break;
        case 'hints':
            el = HINT;
            break
    }
    var str = ''
    for (var i = 0; i < gGame[element]; i++) {
        str += el;
    }

    elElement = document.querySelector(`#${element}`)
    elElement.innerHTML = str;
}

function hintClicked(elHints) {
    if (!gGame.isOn || !gGame.shownCount) return

    //Model
    gGame.isHint = !gGame.isHint;
    //Dom
    elHints.classList.toggle('hints');
}

function revealInHint(pos) {
    //Model
    gGame.hints--;
    //Dom
    removeLiveOrHint('hints');
    var elBtnHint = document.querySelector('.hints');
    elBtnHint.classList.remove('hints');

    // reveale
    var negs = []
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (gBoard[i][j].isShown) continue
            negs.push({ i, j })
            // all changes only in the dom
            var elCurrCell = document.querySelector(`.cell${i}-${j}`);
            if (gBoard[i][j].isMine) elCurrCell.innerHTML = MINE;
            else elCurrCell.innerHTML = gBoard[i][j].minesAroundCount
            elCurrCell.classList.add('shown');
        }
    }
    return negs;
}

function unrevealInHint(negs) {

    for (var i = 0; i < negs.length; i++) {
        var posI = negs[i].i;
        var posJ = negs[i].j;

        // all changes only in  the dom
        var elCurrCell = document.querySelector(`.cell${posI}-${posJ}`);
        if (gBoard[posI][posJ].isMarked) elCurrCell.innerHTML = FLAG;
        elCurrCell.innerHTML = ''
        elCurrCell.classList.remove('shown');
    }
    gGame.isHint = false

}

function safeClick(elBtnSafe) {

    if (!gGame.isOn || !gGame.shownCount || !gGame.safe) return

    var temp = 0
    while (temp < 1) {

        var i = getRandomInt(0, gLevel.SIZE)
        var j = getRandomInt(0, gLevel.SIZE)
        if (gBoard[i][j].isShown || gBoard[i][j].isMine ||
            gBoard[i][j].isMarked || !gBoard[i][j].minesAroundCount) continue

        temp++
    }

    //Model
    gGame.safe--
    //Dom
    var elCurrCell = document.querySelector(`.cell${i}-${j}`);
    elCurrCell.innerHTML = gBoard[i][j].minesAroundCount
    elCurrCell.classList.add('shown');
    setTimeout(() => {
        elCurrCell.innerHTML = ''
        elCurrCell.classList.remove('shown');
    }, 1000)
    elBtnSafe.innerText = `Safe click (${gGame.safe})`;

}

function saveBestScore() {


    localStorage.setItem("lastname", "Smith");


}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

