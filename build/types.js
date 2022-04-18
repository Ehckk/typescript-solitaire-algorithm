const unitDim = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-dim'));
const unitTime = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-time'));
/**
 * Enum of card suits
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
    * Base class for a card stack object
    */
    constructor(name) {
        this.name = name;
        this.cards = [];
    }
    /**
     * Returns the card on top of the cardstack
     * @returns The card on top of the stack
     */
    topCard() {
        return this.cards[this.cards.length - 1];
    }
    /**
     * Returns the size of the card collection
     * @returns The number of cards in the collection
     */
    cardCount() {
        return this.cards.length;
    }
    /**
     * Pushes a card to the top of the stack
     * @param card The card added
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
     * Removes the top card of the stack and returns it
     * @returns The card removed
     */
    removeCard() {
        const card = this.cards.pop();
        card.element.classList.remove(this.name);
        return card;
    }
    /**
     * Checks if the stack is empty
     * @returns `true` if there are no cards in the stack, `false` otherwise
     */
    isEmpty() {
        return this.cards.length == 0;
    }
    /**
     * Checks if a given card is present in the collection
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
     * @param num Number associated with the stack, used to position the cards in the stack and determine the number of face-down cards in the stack initially
     */
    constructor(name, num) {
        super(name);
        this.num = num;
    }
    /**
     * Returns `true` if a card can be moved to this stack, per the rules of solitare
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
     * Adds a card to the CardStack of the center stack object
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
    removeCard() {
        var _a;
        if ((_a = this.topCard()) === null || _a === void 0 ? void 0 : _a.faceDownUnderneath) {
            this.topCard().faceDownUnderneath = false;
        }
        return super.removeCard();
    }
    isBottom(card) {
        return this.cards[0] == card;
    }
}
class CardSuitPile extends CardStack {
    /**
     * Represents a CardStack that can only have cards added to it if they are of the same suit
     * @extends CardStack
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
     * @extends CardStack
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
     * @extends CardNode
     */
    constructor(name) {
        super(name, true, true);
    }
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
     * Recycles every card from the discard node back into the draw pile
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
export { unitDim, unitTime, Suit, CardStack, CardCenterStack, CardSuitPile, CardNode, DrawNode };
