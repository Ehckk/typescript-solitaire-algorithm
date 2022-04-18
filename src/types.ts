const unitDim: number = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-dim'))
const unitTime: number = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-time'))
/**
 * Enum of card suits
 */
enum Suit {
	Spade = "spade",
	Heart = "heart",
	Club = "club", 
	Diamond = "diamond",
} 

/**
 * Represents a playing card
 */
interface Card {
	suit: string,
	value: number,
	element: HTMLDivElement
	faceDown: boolean
	stack: CardCollection
	faceDownUnderneath: boolean
}


/**
 * Represents selected objects on the board
 */
interface Selected {
	stack: CardCollection | undefined
	cards: Array<Card>
}

/**
 * Represents a possible move on the board
 */
interface Move {
	card: Card | undefined,
	target: CardCenterStack | CardSuitPile,
	weight?: number
}

/**
 * Represents a solitaire board state
 */
// TODO: use this for idk something ig
interface BoardState {
	draw: DrawNode
	discard: CardNode
	stacks: Array<CardCenterStack>
	wins: Array<CardSuitPile>
}

interface Auto {
	enabled: boolean
	wins: number
	losses: number
}

class CardStack {
	name: string
	cards: Array<Card>

	/**
 	* Base class for a card stack object
 	*/
	constructor(name: string) {
		this.name = name
		this.cards = []
	}

	/**
	 * Returns the card on top of the cardstack
	 * @returns The card on top of the stack
	 */
	topCard(): Card | undefined {
		return this.cards[this.cards.length - 1]
	}

	/**
	 * Returns the size of the card collection
	 * @returns The number of cards in the collection
	 */
	cardCount(): number {
		return this.cards.length
	}

	/**
	 * Pushes a card to the top of the stack
	 * @param card The card added
	 */
	addCard(card: Card): void {
		let zModifier = 0
		switch (this.name) {
			case 'draw':
				zModifier = 0
				break;
			case 'discard':
				zModifier = 24
				break;
			case 'win':
				zModifier = 16
				break;
			default:
				zModifier = 8
				break;
		}
		card.element.style.zIndex = `${this.isEmpty() ? zModifier : zModifier + parseInt(this.topCard()?.element.style.zIndex!) + 1}`;
		card.element.classList.add(this.name)
		this.cards.push(card)	
	}

	/**
	 * Removes the top card of the stack and returns it
	 * @returns The card removed 
	 */
	removeCard(): Card {
		const card: Card = this.cards.pop()!
		card.element.classList.remove(this.name)
		return card
	}

	/**
	 * Checks if the stack is empty
	 * @returns `true` if there are no cards in the stack, `false` otherwise
	 */
	isEmpty() {
		return this.cards.length == 0
	}

	/**
	 * Checks if a given card is present in the collection
	 * @param card The card to cehck for
	 * @returns `true` if the card exists in the stack, `false` otherwise
	 */
	hasCard(card: Card): boolean {
		return this.cards.includes(card)
	}
}

class CardCenterStack extends CardStack {
	num: number

	/**
	 * Represents the center card stacks in solitaire
	 * @extends CardStack
	 * @param num Number associated with the stack, used to position the cards in the stack and determine the number of face-down cards in the stack initially
	 */
	constructor(name: string, num: number) {
		super(name)
		this.num = num
	}

	/**
	 * Returns `true` if a card can be moved to this stack, per the rules of solitare
	 * @param card The given card
	 * @returns `true` if the given card is a 'King' and this stack has no cards in it OR if the top card in this stack of the opposite suit and of the value 1 higher than the given card 
	 */
	canMoveTo(card: Card) {
		if (this.hasCard(card)) {
			return false
		}
		if (this.cards.length == 0) {
			if (card.value == 13) {
				return true
			}
			return false
		}
		if (!card.faceDown) {
			if (((this.topCard()!.suit == 'Spade' || this.topCard()!.suit == 'Club') && (card.suit == 'Heart' || card.suit == 'Diamond')) || ((this.topCard()!.suit == 'Heart' || this.topCard()!.suit == 'Diamond') && (card.suit == 'Spade' || card.suit == 'Club'))) {
				return card.value + 1 == this.topCard()!.value
			}
			return false
		}
		return false
	}

	/**
	 * Adds a card to the CardStack of the center stack object
	 * @param card The card to be added
	 * @param faceDown If the cards being added are face-down or not, defaults to `false`
	 */
	addCard(card: Card, faceDown: boolean=false) {
		card.faceDown = faceDown
		if (!card.faceDown) {
			card.element.classList.remove('faceDown')
		}
		card.element.style.top = `${unitDim * 1.5 * super.cardCount()}px`;
		card.stack = this
		super.addCard(card)
	}

	removeCard(): Card {
		if (this.topCard()?.faceDownUnderneath) {
			this.topCard()!.faceDownUnderneath = false
		}
		return super.removeCard()
	}

	isBottom(card: Card): boolean {
		return this.cards[0] == card
	} 
}

class CardSuitPile extends CardStack {
	suit: string
	number: number

	/**
	 * Represents a CardStack that can only have cards added to it if they are of the same suit
	 * @extends CardStack
	 * @param suit 
	 */
	constructor(name: string, suit: string, number: number) {
		super(name)
		this.suit = suit
		this.number = number
	}

	/**
	 * Can the card in question be moved to the stack?
	 * @param card 
	 * @returns `true` if the card in question can be moved to the stack
	 */
	canMoveTo(card: Card): boolean {
		if (this.hasCard(card)) {
			return false
		}
		if (this.isEmpty()) {
			if (card.value == 1) {
				return true
			}
			return false
		}
		if (card.value == this.topCard()!.value + 1) {
			return true
		}
		return false
		// TODO: use less undefined types
	}

	addCard(card: Card) {
		card.element.style.top = `${unitDim * 9.25 * this.number}px`
		card.stack = this
		super.addCard(card)
	}
}

class CardNode extends CardStack {
	faceDown: boolean
	singleton: boolean
	target?: CardNode

	/**
	 * Represents a unidirectional collection of cards that is drawn to/from another card collection, forming a chain of CardNodes
	 * @extends CardStack
	 * @param faceDown If true, the card objects in the node will be face down 
	 * @param singleton If true, card objects in this node cannot be removed from the chain from this node 
	 */
	constructor(name: string, faceDown: boolean, singleton: boolean) {
		super(name)
		this.faceDown = faceDown
		this.singleton = singleton
		this.target = undefined
	}

	addCard(card: Card): void {
		card.element.style.top = '0px';
		card.stack = this
		super.addCard(card)
	}

	/**
	 * Sets the other node that this node will stack cards into 
	 * @param target The target CardNode
	 */
	setTargetNode(target: CardNode) {
		this.target = target
	}	
}

class DrawNode extends CardNode {
	/**
	 * Represents a draw pile, which is adds cards to the target discard pile until empty, at which point the cards are recycled back into the draw pile]
	 * @extends CardNode
	 */
	constructor(name: string) {
		super(name, true, true)
	}

	drawCard() {
		if (super.isEmpty()) {
			this.recycleDraw()
			return
		}
		const card: Card = this.removeCard()
		card.faceDown = false
		card.element.classList.remove('faceDown')
		this.target?.addCard(card)
	}

	/**
	 * Recycles every card from the discard node back into the draw pile
	 */
	recycleDraw(): void {
		while (this.target?.cardCount()! > 0) {
			const card: Card = this.target?.removeCard()!
			card.faceDown = true
			card.element.classList.add('faceDown')
			this.addCard(card)
		}
	}
}

/**
 * Union reference type for all card collection objects
 */
type CardCollection = DrawNode | CardNode | CardCenterStack | CardSuitPile

export { unitDim, unitTime, Card, Selected, Suit, Move, BoardState, Auto, CardStack, CardCenterStack, CardSuitPile, CardNode, DrawNode, CardCollection }