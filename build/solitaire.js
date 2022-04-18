const unitDim = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-dim'));
const unitTime = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-time'));
/**
 * Represents the four card suits
 */
var Suit;
(function (Suit) {
    Suit["Spade"] = "spade";
    Suit["Heart"] = "heart";
    Suit["Club"] = "club";
    Suit["Diamond"] = "diamond";
})(Suit || (Suit = {}));
class CardStack {
    /**
     * Base class for a collection of cards
     *
     * @param name Name of the card stack
     */
    constructor(name) {
        this.name = name;
        this.cards = [];
    }
    /**
     * Returns the card on top of the cardstack
     *
     * @returns The card on top of the stack
     */
    topCard() {
        return this.cards[this.cards.length - 1];
    }
    /**
     * Returns the size of the card collection
     *
     * @returns The number of cards in the collection
     */
    cardCount() {
        return this.cards.length;
    }
    /**
     * Pushes a card to the top of the stack
     *
     * @param card The card to be added
     */
    addCard(card) {
        var _a;
        let zModifier = 0;
        switch (this.name) {
            case 'draw':
                zModifier = 0;
                break;
            case 'discard':
                zModifier = 24;
                break;
            case 'win':
                zModifier = 16;
                break;
            default:
                zModifier = 8;
                break;
        }
        card.element.style.zIndex = `${this.isEmpty() ? zModifier : zModifier + parseInt((_a = this.topCard()) === null || _a === void 0 ? void 0 : _a.element.style.zIndex) + 1}`;
        card.element.classList.add(this.name);
        this.cards.push(card);
    }
    /**
     * Pops the top card of the stack and returns it
     *
     * @returns The card that was removed
     */
    removeCard() {
        const card = this.cards.pop();
        card.element.classList.remove(this.name);
        return card;
    }
    /**
     * Checks if the stack is empty
     *
     * @returns `true` if there are no cards in the stack, `false` otherwise
     */
    isEmpty() {
        return this.cards.length == 0;
    }
    /**
     * Checks if a given card is present in the collection object
     *
     * @param card The card to cehck for
     * @returns `true` if the card exists in the stack, `false` otherwise
     */
    hasCard(card) {
        return this.cards.includes(card);
    }
}
class CardCenterStack extends CardStack {
    /**
     * Represents the center card stacks in solitaire
     * @extends CardStack
     *
     * @param num Number associated with the stack, used to position the cards in the stack and determine the number of face-down cards in the stack initially
     */
    constructor(name, num) {
        super(name);
        this.num = num;
    }
    /**
     * Returns `true` if a card can be moved to this stack, per the rules of solitare
     *
     * @param card The given card
     * @returns `true` if the given card is a 'King' and this stack has no cards in it OR if the top card in this stack of the opposite suit and of the value 1 higher than the given card
     */
    canMoveTo(card) {
        if (this.hasCard(card)) {
            return false;
        }
        if (this.cards.length == 0) {
            if (card.value == 13) {
                return true;
            }
            return false;
        }
        if (!card.faceDown) {
            if (((this.topCard().suit == 'Spade' || this.topCard().suit == 'Club') && (card.suit == 'Heart' || card.suit == 'Diamond')) || ((this.topCard().suit == 'Heart' || this.topCard().suit == 'Diamond') && (card.suit == 'Spade' || card.suit == 'Club'))) {
                return card.value + 1 == this.topCard().value;
            }
            return false;
        }
        return false;
    }
    /**
     * Adds a card to the CardStack of the center stack object, setting the css `top` style accordingly
     *
     * @param card The card to be added
     * @param faceDown If the cards being added are face-down or not, defaults to `false`
     */
    addCard(card, faceDown = false) {
        card.faceDown = faceDown;
        if (!card.faceDown) {
            card.element.classList.remove('faceDown');
        }
        card.element.style.top = `${unitDim * 1.5 * super.cardCount()}px`;
        card.stack = this;
        super.addCard(card);
    }
    /**
     * Removes the card from the top of the stack, changing the `faceDownUnderneath` property accordingly
     *
     * @returns The card removed
     */
    removeCard() {
        var _a;
        if ((_a = this.topCard()) === null || _a === void 0 ? void 0 : _a.faceDownUnderneath) {
            this.topCard().faceDownUnderneath = false;
        }
        return super.removeCard();
    }
    /**
     * Checks if a card is the bottom card within the stack
     *
     * @param card The card to check for
     * @returns `true` if the given card is on the bottom of the stack, `false` otherwise
     */
    isBottom(card) {
        return this.cards[0] == card;
    }
}
class CardSuitPile extends CardStack {
    /**
     * Represents a CardStack that can only have cards added to it if they are of the same suit
     *
     * @extends CardStack
     *
     * @param suit
     */
    constructor(name, suit, number) {
        super(name);
        this.suit = suit;
        this.number = number;
    }
    /**
     * Can the card in question be moved to the stack?
     * @param card
     * @returns `true` if the card in question can be moved to the stack
     */
    canMoveTo(card) {
        if (this.hasCard(card)) {
            return false;
        }
        if (this.isEmpty()) {
            if (card.value == 1) {
                return true;
            }
            return false;
        }
        if (card.value == this.topCard().value + 1) {
            return true;
        }
        return false;
        // TODO: use less undefined types
    }
    addCard(card) {
        card.element.style.top = `${unitDim * 9.25 * this.number}px`;
        card.stack = this;
        super.addCard(card);
    }
}
class CardNode extends CardStack {
    /**
     * Represents a unidirectional collection of cards that is drawn to/from another card collection, forming a chain of CardNodes
     *
     * @extends CardStack
     *
     * @param faceDown If true, the card objects in the node will be face down
     * @param singleton If true, card objects in this node cannot be removed from the chain from this node
     */
    constructor(name, faceDown, singleton) {
        super(name);
        this.faceDown = faceDown;
        this.singleton = singleton;
        this.target = undefined;
    }
    addCard(card) {
        card.element.style.top = '0px';
        card.stack = this;
        super.addCard(card);
    }
    /**
     * Sets the other node that this node will stack cards into
     * @param target The target CardNode
     */
    setTargetNode(target) {
        this.target = target;
    }
}
class DrawNode extends CardNode {
    /**
     * Represents a draw pile, which is adds cards to the target discard pile until empty, at which point the cards are recycled back into the draw pile]
     *
     * @extends CardNode
     */
    constructor(name) {
        super(name, true, true);
    }
    /**
     * Takes the top card of the Node and appends it to the target Node. if this node is empty, the cards from the targetNode are recylced
     * @returns None
     */
    drawCard() {
        var _a;
        if (super.isEmpty()) {
            this.recycleDraw();
            return;
        }
        const card = this.removeCard();
        card.faceDown = false;
        card.element.classList.remove('faceDown');
        (_a = this.target) === null || _a === void 0 ? void 0 : _a.addCard(card);
    }
    /**
     * Recycles every card from the discard Node back into this Node
     */
    recycleDraw() {
        var _a, _b;
        while (((_a = this.target) === null || _a === void 0 ? void 0 : _a.cardCount()) > 0) {
            const card = (_b = this.target) === null || _b === void 0 ? void 0 : _b.removeCard();
            card.faceDown = true;
            card.element.classList.add('faceDown');
            this.addCard(card);
        }
    }
}
class Board {
    /**
     * Represents a game of solitare
     *
     * @param element The HTML element that corresponds to the board
     */
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
        let s = 0;
        for (let suit in Suit) {
            this.wins.push(new CardSuitPile(`win_${suit.toLowerCase()}`, suit, s));
            s += 1;
        }
        for (let i = 0; i < 7; i++) {
            this.stacks.push(new CardCenterStack(`stack_${i + 1}`, i));
        }
        this.dealCards();
    }
    /**
     * Creates 52 card objects, 13 per suit for all 4 suits
     *
     * @returns An array containing all 52 created card elements
     */
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
    /**
     * Creates and deals cards:
     * - Creates cards
     * - For each stack, deals a number random cards to said stack equal to the stacks number (1 card in stack 1, 2 in stack 2, 3 in stack 3, etc)
     * - The last card in each stack is added faceUp, rest are added faceDown
     * - Once 28 total cards have been dealt to each CenterStack, the rest are added in a random order to the DrawNode
     * - Game starts with the first call to `updateBoard()`
     */
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
        this.updateBoard();
    }
    /**
     * Handles user click events
     *
     * @param mX X-position of user input
     * @param mY Y-position of user input
     */
    handleClickEvent(mX, mY) {
        this.moveHandler(mX, mY);
    }
    /**
     * Updates the board after each move:
     * - Checks if any faceDown cards can be flipped and flips them accordingly
     * - Checks if the position is won, resets game if it is
     * - Checks if the position is lost, resets game if it is
     * - Makes the next call to autoMove is auto is enabled
     *
     * @returns None
     */
    updateBoard() {
        this.stacks.forEach(stack => {
            var _a, _b;
            if ((_a = stack.topCard()) === null || _a === void 0 ? void 0 : _a.faceDown) {
                stack.topCard().faceDown = false;
                (_b = stack.topCard()) === null || _b === void 0 ? void 0 : _b.element.classList.remove('faceDown');
                this.faceDownCards -= 1;
            }
        });
        if (this.winCheck()) {
            console.log("Epic Win");
            if (this.auto.enabled) {
                this.auto.wins += 1;
            }
            this.endGame();
            return;
        }
        // TODO: come up with less shittier function names
        if (this.failCheck()) {
            console.log("Big Fail");
            if (this.auto.enabled) {
                this.auto.losses += 1;
            }
            this.endGame();
            return;
        }
        if (this.auto.enabled) {
            setTimeout(autoMove, unitTime * 1000);
        }
    }
    /**
     * Checks if the user has a "won" position
     * 1. The total amount of faceDown cards in the center stacks is equal to zero (this is a guaranteed winnable position in solitaire)
     * 2. Each win pile has all 13 cards in it (it is not possible for these cards to be out of order in the program, so checking just the number of cards if fine here)
     *
     * @returns `true` if position is won, `false` otherwise
     */
    winCheck() {
        if (this.faceDownCards == 0) {
            let isWin = true;
            this.wins.forEach(win => {
                if (isWin) {
                    if (win.cardCount() != 13) {
                        isWin = false;
                    }
                }
            });
            return isWin;
        }
        return false;
    }
    /**
     * Checks if the user has a "lost" position:
     * 1. The total amount of faceDown cards in the center stacks is more than zero (this is a guaranteed winnable position in solitaire)
     * 2. The draw pile has been drawn through an amount of times equal to `(1 + [total cards in DrawNode] + [total cards in DiscardNode]) * 1.5`, rounded up
     *
     * For the computer, the second condition will only be met if no better moves exist
     *
     * @returns `true` if position is lost, `false` otherwise
     */
    failCheck() {
        return this.faceDownCards > 0 && this.consecutiveDrawCount > Math.ceil((1 + this.draw.cards.length + this.discard.cards.length) * 1.5);
    }
    /**
     * Resets the game by destroying all card elements and recreating and redealing them
     */
    endGame() {
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
        this.dealCards();
    }
    /**
     * Checks if there are any cards currently selected
     *
     * @returns `true` if there are selected cards, `false` otherwise
     */
    hasSelected() {
        return this.selected.cards.length > 0;
    }
    /**
     * Selects cards
     *
     * @param stack The stack which the selected cards belong to
     * @param cards The cards to be selected
     */
    selectCards(stack, cards) {
        cards.forEach(card => {
            card.element.classList.add('selected');
            this.selected.cards.push(card);
        });
        this.selected.stack = stack;
    }
    /**
     * Deselects all cards
     */
    deselectCards() {
        this.selected.cards.forEach(card => {
            card.element.classList.remove('selected');
        });
        this.selected.stack = undefined;
        this.selected.cards = [];
    }
    /**
     * Handles the input of the user
     *
     * @param mX The x-position of the user input
     * @param mY The y-position of the user input
     */
    moveHandler(mX, mY) {
        const x = Math.floor(mX / (unitDim * 6.25));
        const y = Math.floor(mY / (unitDim * 9.25));
        let stack;
        switch (true) {
            case x === 0 || (x === 1 && this.discard.isEmpty()):
                this.deselectCards();
                this.draw.drawCard();
                break;
            case x === 1 && !this.hasSelected():
                this.selectCards(this.discard, [this.discard.topCard()]);
                break;
            case x === 9 && this.hasSelected() && this.selected.cards.length == 1:
                const win = this.getWinFromSuit(this.selected.cards[0].suit);
                if (this.wins.find(win => win == this.selected.stack) == undefined) {
                    this.makeMove({ card: win.topCard(), target: win });
                }
                this.deselectCards();
                break;
            case x === 9 && this.wins[y].topCard() != undefined:
                this.selectCards(this.wins[y], [this.wins[y].topCard()]);
                break;
            case x > 1 && x < 9 && this.hasSelected():
                stack = this.stacks[x - 2];
                if (stack != this.selected.stack) {
                    this.makeMove({ card: stack.topCard(), target: stack });
                }
                this.deselectCards();
                break;
            case x > 1 && x < 9:
                stack = this.stacks[x - 2];
                const cardY = Math.floor(mY / (unitDim * 1.5));
                const card = stack.isEmpty() ? undefined : cardY >= stack.cardCount() ? stack.topCard() : stack.cards[cardY];
                if (card && !card.faceDown) {
                    this.selectCards(stack, stack.cards.slice(stack.cards.indexOf(card)));
                }
                break;
            default:
                this.deselectCards();
                break;
        }
        this.updateBoard();
    }
    /**
     * Makes a given move on the board
     *
     * @param move The move to make
     */
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
        this.deselectCards();
    }
    /**
     * Finds a certain CardSuitPile based on the given suit and returns it
     *
     * @param suit The suit to fetch the corresponding pile for
     * @returns The CardSuitPile that corresponds the the given suit
     */
    getWinFromSuit(suit) {
        return this.wins.find(win => win.suit == suit);
    }
    /**
     * Gets the weight of a move given the state of the board, the current position of the card to move, the context with respect to faceDown cards, and other factors
     *
     * @param card The card to move
     * @param target The potential spot to move the card to
     * @param cards The other cards that could be moved
     * @returns A number value that corresponds to the weight of the move
     */
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
    /**
     * Checks if a card being moved to it's win pile can open a move that would result in a faceDown card being flipped
     *
     * @param card The card in question
     * @param cards The other cards that can be moved, for context
     * @returns `true` if the scenario is valid in the given context, `false` otherwise
     */
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
    /**
     * Checks if a card being moved to a given stack pile can open a move that would result in a faceDown card being flipped
     *
     * @param card The card in question
     * @param cards The other cards that can be moved, for context
     * @returns `true` if the scenario is valid in the given context, `false` otherwise
     */
    canCardOpenByStack(card, cards) {
        if (card.stack instanceof CardCenterStack && card.stack.isBottom(card)) {
            if (cards.find(card2 => (card2.faceDownUnderneath || card.stack == this.discard) && card2.value == 13 && card != card2)) {
                return true;
            }
            return false;
        }
        // TODO: fix this, it's vomit inducing
        const nextCard = card.stack.cards[card.stack.cards.findIndex(card2 => card == card2) - 1];
        return cards.find((card2) => card2.faceDownUnderneath && nextCard.value == card2.value + 1 && (((nextCard.suit == 'Spade' || nextCard.suit == 'Club') && (card2.suit == 'Heart' || card2.suit == 'Diamond')) || ((nextCard.suit == 'Heart' || nextCard.suit == 'Diamond') && (card2.suit == 'Spade' || card2.suit == 'Club')))) != undefined;
    }
}
/**
 * Creates a card element by styling HTML Divs and appends it to the board element
 *
 * @param boardElement The HTML element that represents the game Board
 * @param suit The suit of the card
 * @param value The value of the card
 * @returns The created card element
 */
function createCardElement(boardElement, suit, value) {
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
    boardElement.appendChild(card);
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
            solitaire.deselectCards();
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
// TODO: move auto shit to it's own object
/**
 * Represents a computer calculated
 * - Grabs every possible Card that can be moved (cards on top of Discard Node and each Win Pile (if any) and any face-up cards in Center Stacks)
 * - Compares each Card with the top card of each Center Stack and the card's corresponding win pile.
 * - Uses these comparisons to create a list of valid moves, according to solitaire rules
 * - Cehcks every possible move to find the move with the highest weight value given the context of the board and makes selects that move as the best move
 * - If there is no best move (no valid moves) or if the weight of the best move is less than 1.2, the computer draws a card instead
 * - Otherwise the bestMove is made, cards are updated accordingly
 */
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
export {};
