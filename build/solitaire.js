import { Suit, DrawNode, CardCenterStack, CardNode, CardSuitPile, unitDim, unitTime } from "./types";
class Board {
    constructor(element) {
        this.element = element;
        this.draw = new DrawNode('draw');
        this.discard = new CardNode('discard', false, false);
        this.stacks = [];
        this.wins = [];
        this.draw.setTargetNode(this.discard);
        this.selected = {
            stack: undefined,
            cards: []
        };
        this.faceDownCards = 0;
        this.consecutiveDrawCount = 0;
        this.auto = {
            enabled: false,
            wins: 0,
            losses: 0,
        };
        this.loop = undefined;
        this.initBoard();
    }
    initBoard() {
        let s = 0;
        for (let suit in Suit) {
            this.wins.push(new CardSuitPile(`win_${suit.toLowerCase()}`, suit, s));
            s += 1;
        }
        for (let i = 0; i < 7; i++) {
            this.stacks.push(new CardCenterStack(`stack_${i + 1}`, i));
        }
        this.startGame();
    }
    // TODO: put card array under createcards method, remove it as a class attr if you are gonna call createcards after every game
    createCards() {
        const cards = [];
        for (let suit in Suit) {
            for (let i = 13; i > 0; i--) {
                cards.push({
                    suit: suit,
                    value: i,
                    element: createCardElement(this.element, suit, i),
                    faceDown: true,
                    stack: this.draw,
                    faceDownUnderneath: false
                });
            }
        }
        return cards;
    }
    startGame() {
        this.dealCards();
        this.updateBoard();
    }
    dealCards() {
        const cards = this.createCards();
        const randomCard = () => cards.splice(Math.floor(Math.random() * cards.length), 1)[0];
        this.faceDownCards = 0;
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j <= i; j++) {
                const card = randomCard();
                j != 0 ? card.faceDownUnderneath = true : {};
                card.stack = this.stacks[i];
                if (i == j) {
                    this.stacks[i].addCard(card, false);
                }
                else {
                    this.stacks[i].addCard(card, true);
                    this.faceDownCards += 1;
                }
            }
        }
        while (cards.length > 0) {
            const card = randomCard();
            card.faceDownUnderneath = false;
            card.stack = this.draw;
            this.draw.addCard(card);
        }
    }
    handleClickEvent(mX, mY) {
        this.moveHandler(mX, mY);
        this.updateBoard();
    }
    updateBoard() {
        this.stacks.forEach(stack => {
            var _a, _b;
            if ((_a = stack.topCard()) === null || _a === void 0 ? void 0 : _a.faceDown) {
                stack.topCard().faceDown = false;
                (_b = stack.topCard()) === null || _b === void 0 ? void 0 : _b.element.classList.remove('faceDown');
                this.faceDownCards -= 1;
            }
        });
        // merge board with game
        // come up with less shittier function names
        if (this.faceDownCards == 0) {
            let isWin = true;
            this.wins.forEach(win => {
                if (win.cardCount() != 13) {
                    isWin = false;
                }
            });
            if (isWin) {
                if (this.auto.enabled) {
                    this.auto.wins += 1;
                }
                this.endGame(true);
                return;
            }
            // auto win
        }
        // make sure to add autoLose
        if (this.faceDownCards > 0) {
            if (this.consecutiveDrawCount > Math.ceil((1 + this.draw.cards.length + this.discard.cards.length) * 1.5)) {
                this.auto.losses += 1;
                this.endGame(false);
                return;
            }
        }
        if (this.auto.enabled) {
            setTimeout(autoMove, unitTime * 1000);
        }
    }
    failCheck() {
        // consecutive draw count
    }
    winCheck() {
        // TODO: lol
    }
    endGame(isWin) {
        if (this.auto.enabled) {
            // TODO: get rid of else blocks
            if (isWin) {
                console.log("Epic Win");
            }
            else {
                console.log("Big Fail");
            }
        }
        while (!this.draw.isEmpty()) {
            const card = this.draw.cards.pop();
            card === null || card === void 0 ? void 0 : card.element.remove();
        }
        while (!this.discard.isEmpty()) {
            const card = this.discard.cards.pop();
            card === null || card === void 0 ? void 0 : card.element.remove();
        }
        this.draw.cards = [];
        this.discard.cards = [];
        this.stacks.forEach(stack => {
            while (!stack.isEmpty()) {
                const card = stack.cards.pop();
                card === null || card === void 0 ? void 0 : card.element.remove();
            }
            stack.cards = [];
        });
        this.wins.forEach(win => {
            while (!win.isEmpty()) {
                const card = win.cards.pop();
                card === null || card === void 0 ? void 0 : card.element.remove();
            }
            win.cards = [];
        });
        // TODO: replace this shit with a general initBoard method, containing constructor initialization args
        // do something with isWin with auto
        // while (!this.draw.isEmpty()) {
        // 	const card = this.draw.removeCard()
        // 	card.faceDown = true
        // 	card.faceDownUnderneath = false
        // 	this.cards.push(card)
        // }
        // while (!this.discard.isEmpty()) {
        // 	const card = this.discard.removeCard()
        // 	card.faceDown = true
        // 	card.faceDownUnderneath = false
        // 	this.cards.push(card)
        // }
        // this.stacks.forEach(stack => {
        // 	while (!stack.isEmpty()) {
        // 		const card = stack.removeCard()
        // 		card.faceDown = true
        // 		card.faceDownUnderneath = false
        // 		this.cards.push(card)
        // 	}
        // })
        // this.wins.forEach(win => {
        // 	while (!win.isEmpty()) {
        // 		const card = win.removeCard()
        // 		card.faceDown = true
        // 		card.faceDownUnderneath = false
        // 		this.cards.push(card)
        // 	}
        // })
        // TODO: fix this bullshit like this is actually disgusting you fucking moron jesus christ
        this.startGame();
    }
    targetSelected() {
        return this.selected.cards.length > 0;
    }
    select(stack, cards) {
        cards.forEach(card => {
            card.element.classList.add('selected');
            this.selected.cards.push(card);
        });
        this.selected.stack = stack;
    }
    deselect() {
        this.selected.cards.forEach(card => {
            card.element.classList.remove('selected');
        });
        this.selected.stack = undefined;
        this.selected.cards = [];
    }
    moveHandler(mX, mY) {
        const x = Math.floor(mX / (unitDim * 6.25));
        const y = Math.floor(mY / (unitDim * 9.25));
        let stack;
        switch (true) {
            case x === 0 || (x === 1 && this.discard.isEmpty()):
                this.deselect();
                this.draw.drawCard();
                break;
            case x === 1 && !this.targetSelected():
                this.select(this.discard, [this.discard.topCard()]);
                break;
            case x === 9 && this.targetSelected() && this.selected.cards.length == 1:
                const win = this.getWinFromSuit(this.selected.cards[0].suit);
                if (this.wins.find(win => win == this.selected.stack) == undefined) {
                    this.makeMove({ card: win.topCard(), target: win });
                }
                this.deselect();
                break;
            case x === 9 && this.wins[y].topCard() != undefined:
                this.select(this.wins[y], [this.wins[y].topCard()]);
                break;
            case x > 1 && x < 9 && this.targetSelected():
                stack = this.stacks[x - 2];
                if (stack != this.selected.stack) {
                    this.makeMove({ card: stack.topCard(), target: stack });
                }
                this.deselect();
                break;
            case x > 1 && x < 9:
                stack = this.stacks[x - 2];
                const cardY = Math.floor(mY / (unitDim * 1.5));
                const card = stack.isEmpty() ? undefined : cardY >= stack.cardCount() ? stack.topCard() : stack.cards[cardY];
                if (card && !card.faceDown) {
                    this.select(stack, stack.cards.slice(stack.cards.indexOf(card)));
                }
                break;
            default:
                this.deselect();
                break;
        }
    }
    makeMove(move) {
        var _a;
        if (move.target.canMoveTo(this.selected.cards[0])) {
            const cards = [];
            for (let i = this.selected.cards.length; i > 0; i--) {
                cards.push((_a = this.selected.stack) === null || _a === void 0 ? void 0 : _a.removeCard());
            }
            while (cards.length > 0) {
                if (move.target instanceof CardCenterStack) {
                    move.target.addCard(cards.pop(), false);
                }
                else {
                    move.target.addCard(cards.pop());
                }
            }
        }
        this.deselect();
    }
    getWinFromSuit(suit) {
        return this.wins.find(win => win.suit == suit);
    }
    getMoveWeight(card, target, cards) {
        let weight;
        switch (true) {
            case this.faceDownCards == 0 && target instanceof CardSuitPile:
                weight = 2.5;
                break;
            case this.faceDownCards == 0 && target instanceof CardCenterStack:
                weight = 0.1;
                break;
            case target instanceof CardCenterStack && card.faceDownUnderneath:
                weight = 2 + (.5 * (card.stack.cardCount() + 1));
                break;
            case target.isEmpty() && card.value == 13 && (((card.stack instanceof CardCenterStack && !card.stack.isBottom(card)) || card.stack == this.discard)):
                weight = 1.6;
                break;
            case target instanceof CardSuitPile && this.canCardOpenByWin(card, cards):
                weight = 1.7;
                break;
            case card.stack instanceof CardCenterStack && this.canCardOpenByStack(card, cards):
                weight = 1.5;
                break;
            case target instanceof CardSuitPile:
                weight = 1.4;
                break;
            case card.stack == this.discard:
                weight = 1.3;
                break;
            default:
                weight = 1;
                break;
        }
        return weight;
    }
    canCardOpenByWin(card, cards) {
        const predicate = (card, card2) => {
            if (card != card2) {
                if (card2.stack instanceof CardCenterStack && card2.stack.topCard() == card2) {
                    if (card.faceDownUnderneath) {
                        if (card.value + 1 == card.value && card.suit == card2.suit) {
                            return true;
                            // TODO: instead of this, try to print boardstate as a 2d array and compare boardstates that way
                        }
                    }
                }
            }
            return false;
        };
        return cards.find((card2) => predicate(card, card2)) != undefined;
    }
    canCardOpenByStack(card, cards) {
        if (card.stack instanceof CardCenterStack && card.stack.isBottom(card)) {
            if (cards.find(card2 => (card2.faceDownUnderneath || card.stack == this.discard) && card2.value == 13 && card != card2)) {
                return true;
            }
            return false;
        }
        // TODO: fix this, it's vomit inducing
        const nextCard = card.stack.cards[card.stack.cards.findIndex((card2) => card == card2) - 1];
        return cards.find((card2) => card2.faceDownUnderneath && nextCard.value == card2.value + 1 && (((nextCard.suit == 'Spade' || nextCard.suit == 'Club') && (card2.suit == 'Heart' || card2.suit == 'Diamond')) || ((nextCard.suit == 'Heart' || nextCard.suit == 'Diamond') && (card2.suit == 'Spade' || card2.suit == 'Club')))) != undefined;
    }
}
function createCardElement(element, suit, value) {
    const cardNum = value == 1 ? 'A' : value == 11 ? 'J' : value == 12 ? 'Q' : value == 13 ? 'K' : `${value}`;
    const side = value > 10 ? 1 : value < 4 ? 0 : value < 10 ? Math.floor(value / 2) : 4;
    const center = value > 10 ? 0 : value < 4 ? value : value < 10 ? value - (Math.floor(value / 2) * 2) : 2;
    const card = document.createElement('div');
    const numL = document.createElement('h1');
    const numR = document.createElement('h1');
    const imgL = document.createElement('i');
    const imgR = document.createElement('i');
    card.classList.add('card', 'faceDown');
    card.setAttribute('suit', suit);
    card.setAttribute('value', `${value}`);
    card.setAttribute('id', `${suit}_${value}`);
    numL.innerText = cardNum;
    numR.innerText = cardNum;
    imgL.classList.add('outer');
    imgR.classList.add('outer');
    const sideL = document.createElement('div');
    const sideR = document.createElement('div');
    sideL.classList.add('side');
    sideR.classList.add('side', 'flip');
    const middle = document.createElement('div');
    middle.classList.add('center');
    const innerL = document.createElement('div');
    const innerM = document.createElement('div');
    const innerR = document.createElement('div');
    innerL.classList.add('inner');
    innerM.classList.add('inner');
    innerR.classList.add('inner');
    if (value > 10) {
        card.classList.add('face');
        innerR.classList.add('flip');
    }
    for (let i = (side * 2) + center; i > 0; i--) { // maybe do this in css with nth child or something
        const img = document.createElement('i');
        switch (true) {
            case value == 7 && i == 4:
                innerM.appendChild(img);
                innerM.appendChild(document.createElement('div'));
                break;
            case side != 0 && i > side + center && i <= side + center + (side / 2):
                img.classList.add('flip');
                innerL.appendChild(img);
                break;
            case i > side + center:
                innerL.appendChild(img);
                break;
            case side != 0 && i < side && i <= (side / 2):
                img.classList.add('flip');
                innerR.appendChild(img);
                break;
            case i <= side:
                innerR.appendChild(img);
                break;
            case center > 1 && i > side && i < side + center && i == side + 1:
                img.classList.add('flip');
                innerM.appendChild(img);
                break;
            default:
                innerM.appendChild(img);
                break;
        }
    }
    sideL.appendChild(numL);
    sideL.appendChild(imgL);
    sideR.appendChild(numR);
    sideR.appendChild(imgR);
    middle.appendChild(innerL);
    middle.appendChild(innerM);
    middle.appendChild(innerR);
    card.appendChild(sideL);
    card.appendChild(middle);
    card.appendChild(sideR);
    element.appendChild(card);
    return card;
}
const gameBoard = document.querySelector('.game_board');
const solitaire = new Board(gameBoard);
gameBoard.addEventListener('click', (e) => {
    // TODO: if !active ...
    // TODO: auto
    solitaire.handleClickEvent(e.clientX - Math.floor(gameBoard.getBoundingClientRect().left), e.clientY - Math.floor(gameBoard.getBoundingClientRect().top));
});
document.addEventListener('keydown', (e) => {
    if (e.key == 'c') {
        solitaire.auto.enabled = !solitaire.auto.enabled;
        if (solitaire.auto.enabled) {
            solitaire.deselect();
            console.log('Computer enabled');
            solitaire.updateBoard();
        }
        else {
            clearInterval(solitaire.loop);
            console.log(`Computer disabled \n${solitaire.auto.losses + solitaire.auto.wins} total games \nWins: ${solitaire.auto.wins} \nLosses: ${solitaire.auto.losses} \nWin percentage: ${Math.round((solitaire.auto.wins / (solitaire.auto.losses + solitaire.auto.wins)) * 100)}%`);
            solitaire.auto.wins = 0;
            solitaire.auto.losses = 0;
        }
    }
});
function autoMove() {
    //simplify the app
    // remove a lot of useless functions
    const possibleCards = [];
    const possibleMoves = [];
    if (!solitaire.discard.isEmpty()) {
        possibleCards.push(solitaire.discard.topCard());
    }
    solitaire.stacks.forEach(stack => {
        if (!stack.isEmpty()) {
            stack.cards.forEach(card => {
                if (card.faceDown == false) {
                    possibleCards.push(card);
                }
            });
        }
    });
    solitaire.wins.forEach(win => {
        if (!win.isEmpty()) {
            possibleCards.push(win.topCard());
        }
    });
    possibleCards.forEach(card => {
        [...solitaire.stacks, solitaire.getWinFromSuit(card.suit)].forEach(target => {
            if (!target.hasCard(card)) {
                if (target.canMoveTo(card)) {
                    const weight = solitaire.getMoveWeight(card, target, possibleCards);
                    possibleMoves.push({ card: card, target: target, weight: weight });
                }
            }
        });
    });
    let bestMove = undefined;
    possibleMoves.forEach(move => {
        if (bestMove == undefined) {
            bestMove = move;
        }
        if (bestMove != undefined) {
            if (move.weight > bestMove.weight) {
                bestMove = move;
            }
        }
    });
    switch (true) {
        case bestMove == undefined:
            //console.log('No valid moves detected, drawing')
            solitaire.draw.drawCard();
            solitaire.consecutiveDrawCount += 1;
            break;
        case bestMove.weight < 1.2:
            //console.log(`${bestMove!.card!.suit}_${bestMove!.card!.value} to ${bestMove!.target.name} (${bestMove!.target.topCard() == undefined ? 'none' : `${bestMove!.target.topCard()!.suit}_${bestMove!.target.topCard()!.value}`}) (${bestMove!.weight}) - Drawing instead`)
            solitaire.draw.drawCard();
            solitaire.consecutiveDrawCount += 1;
            break;
        case bestMove.card.stack instanceof CardCenterStack:
            const targetCards = bestMove.card.stack.cards.slice(bestMove.card.stack.cards.indexOf(bestMove.card));
            const cards = [];
            // TODO: find a better way to do this
            for (let i = targetCards.length; i > 0; i--) {
                cards.push((bestMove.card.stack.removeCard()));
            }
            while (cards.length > 0) {
                bestMove.target.addCard(cards.pop());
            }
            //console.log(`${bestMove!.card!.suit}_${bestMove!.card!.value} to ${bestMove!.target.name} (${bestMove!.target.topCard() == undefined ? 'none' : `${bestMove!.target.topCard()!.suit}_${bestMove!.target.topCard()!.value}`}) (${bestMove!.weight})`)
            solitaire.consecutiveDrawCount = 0;
            break;
        default:
            //console.log(`${bestMove!.card!.suit}_${bestMove!.card!.value} to ${bestMove!.target.name} (${bestMove!.target.topCard() == undefined ? 'none' : `${bestMove!.target.topCard()!.suit}_${bestMove!.target.topCard()!.value}`}) (${bestMove!.weight})`)
            bestMove.target.addCard(bestMove.card.stack.removeCard());
            solitaire.consecutiveDrawCount = 0;
            break;
    }
    solitaire.updateBoard();
}
