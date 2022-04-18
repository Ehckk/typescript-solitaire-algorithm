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
 * Union reference type for all card collection objects
 */
type CardCollection = DrawNode | CardNode | CardCenterStack | CardSuitPile


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

class Board {
	element: HTMLDivElement
	draw: DrawNode
	discard: CardNode
	stacks: Array<CardCenterStack>
	wins: Array<CardSuitPile>
	selected: Selected
	faceDownCards: number
	consecutiveDrawCount: number
	auto: Auto
	loop: number | undefined

	constructor(element: HTMLDivElement) {
		this.element = element
		this.draw = new DrawNode('draw')
		this.discard = new CardNode('discard', false, false)
		this.stacks = []
		this.wins = []
		this.draw.setTargetNode(this.discard)
		this.selected = {
			stack: undefined,
			cards: []
		}
		this.faceDownCards = 0;
		this.consecutiveDrawCount = 0;
		this.auto = {
			enabled: false,
			wins: 0,
			losses: 0,
		}
		this.loop = undefined
		this.initBoard()
	} 

	initBoard() {
		let s = 0
		for (let suit in Suit) {
			this.wins.push(new CardSuitPile(`win_${suit.toLowerCase()}`, suit, s))
			s += 1
		}
		for (let i = 0; i < 7; i++) {
			this.stacks.push(new CardCenterStack(`stack_${i + 1}`, i))
		}
		this.startGame()
	}
	// TODO: put card array under createcards method, remove it as a class attr if you are gonna call createcards after every game
	createCards() {
		const cards: Array<Card> = []
		for (let suit in Suit) {
			for (let i = 13; i > 0; i--) {
				cards.push({
					suit: suit,
					value: i,
					element: createCardElement(this.element, suit, i),
					faceDown: true,
					stack: this.draw,
					faceDownUnderneath: false
				})
			}
		}
		return cards
	}

	startGame(): void {
		this.dealCards()
		this.updateBoard()
	}

	dealCards(): void {
		const cards = this.createCards()
		const randomCard = (): Card => cards.splice(Math.floor(Math.random() * cards.length), 1)[0]
		this.faceDownCards = 0
		for (let i = 0; i < 7; i++) {
			for (let j = 0; j <= i; j++) {
				const card = randomCard()
				j != 0 ? card.faceDownUnderneath = true : {}
				card.stack = this.stacks[i]
				this.stacks[i].addCard(card, i == j ? false : true)
				this.faceDownCards += 1
			}
		}
		while (cards.length > 0) {
			const card = randomCard()
			card.faceDownUnderneath = false
			card.stack = this.draw
			this.draw.addCard(card)	
		}
	}

	handleClickEvent(mX: number, mY: number) {
		this.moveHandler(mX, mY)
		this.updateBoard();
	}

	updateBoard() {
		this.stacks.forEach(stack => {
			if (stack.topCard()?.faceDown) {
				stack.topCard()!.faceDown = false
				stack.topCard()?.element.classList.remove('faceDown')
				this.faceDownCards -= 1
			}
		})
		// merge board with game
		// come up with less shittier function names
		if (this.faceDownCards == 0) {
			let isWin: boolean = true;
			[...this.stacks, this.discard, this.draw].forEach(stack => {
				if (isWin) {
					if (!stack.isEmpty()) {
						isWin = false
					}
				}
			})
			if (isWin) {
				if (this.auto.enabled) {
					this.auto.wins += 1
				}
				this.endGame(true)
			}
			// auto win
			return
		}
		// make sure to add autoLose
		if (this.consecutiveDrawCount > Math.ceil((this.draw.cards.length + this.discard.cards.length) * 1.5)) {
			this.auto.losses += 1
			this.endGame(false)
			return
		}
		if (this.auto.enabled) {
			setTimeout(autoMove, unitTime * 1000)
		}
	}

	failCheck() {
		// consecutive draw count
	}

	winCheck() {
		// TODO: lol
	}

	endGame(isWin: boolean): void	{
		if (this.auto.enabled) {
			// TODO: get rid of else blocks
			if (isWin) {
				console.log("Epic Win")
			} else {
				console.log("Big Fail")
			}
		}
		while (!this.draw.isEmpty()) {
			const card = this.draw.cards.pop()
			card?.element.remove()
		}
		while (!this.discard.isEmpty()) {
			const card = this.discard.cards.pop()
			card?.element.remove()
		}
		this.draw.cards = []
		this.discard.cards = []
		this.stacks.forEach(stack => {
			while (!stack.isEmpty()) {
				const card = stack.cards.pop()
				card?.element.remove()
			}
			stack.cards = []
		})
		this.wins.forEach(win => {
			while (!win.isEmpty()) {
				const card = win.cards.pop()
				card?.element.remove()
			}
			win.cards = []
		})
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
		this.startGame()
	}

	targetSelected(): boolean {
		return this.selected.cards.length > 0
	}

	select(stack: CardCollection, cards: Array<Card>): void {
		cards.forEach(card => {
			card.element.classList.add('selected')
			this.selected.cards.push(card)
		})
		this.selected.stack = stack
	}

	deselect(): void {
		this.selected.cards.forEach(card => {
			card.element.classList.remove('selected')
		})
		this.selected.stack = undefined
		this.selected.cards = []
	}

	moveHandler(mX: number, mY: number): Move | void {
		const x: number = Math.floor(mX / (unitDim * 6.25))
		const y: number = Math.floor(mY / (unitDim * 9.25))
		let stack: CardCollection
		switch(true) {
			case x === 0 || (x === 1 && this.discard.isEmpty()):
				this.deselect()
				this.draw.drawCard()
				break;
			case x === 1 && !this.targetSelected():
				this.select(this.discard, [this.discard.topCard()!])
				break;
			case x === 9 && this.targetSelected() && this.selected.cards.length == 1 :
				const win: CardSuitPile = this.getWinFromSuit(this.selected.cards[0].suit)
				if (this.wins.find(win => win == this.selected.stack) == undefined) {
					this.makeMove({ card: win.topCard(), target: win })
				}
				this.deselect()
				break;
			case x === 9 && this.wins[y].topCard() != undefined:
				this.select(this.wins[y], [this.wins[y].topCard()!])
				break;
			case x > 1 && x < 9 && this.targetSelected():
				stack = this.stacks[x - 2]
				if (stack != this.selected.stack) {
					this.makeMove({ card: stack.topCard(), target: stack })
				}
				this.deselect()
				break;
			case x > 1 && x < 9:
				stack = this.stacks[x - 2]
				const cardY: number = Math.floor(mY / (unitDim * 1.5))
				const card: Card | undefined = stack.isEmpty() ? undefined : cardY >= stack.cardCount() ? stack.topCard() : stack.cards[cardY]
				if (card && !card.faceDown) {
					this.select(stack, stack.cards.slice(stack.cards.indexOf(card)))
				}
				break;
			default:
				this.deselect()
				break;
		}
	}

	makeMove(move: Move) {
		if (move.target.canMoveTo(this.selected.cards[0])) {
			const cards = []
			for (let i = this.selected.cards.length; i > 0; i--) {
				cards.push(this.selected.stack?.removeCard())
			}
			while (cards.length > 0) {
				if (move.target instanceof CardCenterStack) {
					move.target.addCard(cards.pop()!, false)
				} else {
					move.target.addCard(cards.pop()!)
				}
			}
		}
		this.deselect()
	}

	getWinFromSuit(suit: string): CardSuitPile {
		return this.wins.find(win => win.suit == suit)!
	}

	getMoveWeight(card: Card, target: CardCenterStack | CardSuitPile, cards: Array<Card>): number {
		let weight: number
		switch (true) {
			case this.faceDownCards == 0 && target instanceof CardSuitPile:
				weight = 2.5
				break;
			case this.faceDownCards == 0 && target instanceof CardCenterStack:
				weight = 0.1
				break;
			case target instanceof CardCenterStack && card.faceDownUnderneath:
				weight = 2 + (.5 * (card.stack.cardCount() + 1));
				break;
			case target.isEmpty() && card.value == 13 && (((card.stack instanceof CardCenterStack && !card.stack.isBottom(card)) || card.stack == this.discard)):
				weight = 1.6
				break;
			case target instanceof CardSuitPile && this.canCardOpenByWin(card, cards):
				weight = 1.7
				break;
			case card.stack instanceof CardCenterStack && this.canCardOpenByStack(card, cards):
				weight = 1.5
				break;	
			case target instanceof CardSuitPile:
				weight = 1.4
				break;
			case card.stack == this.discard:
				weight = 1.3
				break;
			default:
				weight = 1;
				break;
		} 
		return weight
	}

	canCardOpenByWin(card: Card, cards: Card[]) {
		const predicate = (card: Card, card2: Card): boolean => {
			if (card != card2) {
				if (card2.stack instanceof CardCenterStack && card2.stack.topCard() == card2) {
					if (card.faceDownUnderneath) {
						if (card.value + 1 == card.value && card.suit == card2.suit) {
							return true
							// TODO: instead of this, try to print boardstate as a 2d array and compare boardstates that way
						}
					}
				}
			}
			return false
		}
		return cards.find((card2: Card) => predicate(card, card2)) != undefined
	}

	canCardOpenByStack(card: Card, cards: Card[]) { 
		if (card.stack instanceof CardCenterStack && card.stack.isBottom(card)) {
			if (cards.find(card2 => (card2.faceDownUnderneath || card.stack == this.discard) && card2.value == 13 && card != card2)) {
				return true
			}
			return false
		} 

		// TODO: fix this, it's vomit inducing
		const nextCard = card.stack.cards[card.stack.cards.findIndex(card2 => card == card2) - 1]
		return cards.find((card2: Card) => card2.faceDownUnderneath && nextCard.value == card2.value + 1 && (((nextCard.suit == 'Spade' || nextCard.suit == 'Club') && (card2.suit == 'Heart' || card2.suit == 'Diamond')) || ((nextCard.suit == 'Heart' || nextCard.suit == 'Diamond') && (card2.suit == 'Spade' || card2.suit == 'Club')))) != undefined
	}

	// TODO: use a disableCom function + setInterval instead
	// TODO: merge Game and Board classes
	// TODO: have automove clear selected styles
	// TODO: if auto.enabled == true then reject user mouse input
}

function createCardElement(element: HTMLDivElement, suit: string, value: number): HTMLDivElement {
	const cardNum: string = value == 1 ? 'A' : value == 11 ? 'J' : value == 12 ? 'Q' : value == 13 ? 'K' : `${value}`;
	const side: number = value > 10 ? 1 : value < 4 ? 0 : value < 10 ? Math.floor(value / 2) : 4;
	const center: number = value > 10 ? 0 : value < 4 ? value : value < 10 ? value - (Math.floor(value / 2) * 2) : 2;
	const card: HTMLDivElement = document.createElement('div');
	const numL: HTMLElement = document.createElement('h1'); 
	const numR: HTMLElement = document.createElement('h1');
	const imgL: HTMLElement = document.createElement('i'); 
	const imgR: HTMLElement = document.createElement('i');
	card.classList.add('card', 'faceDown');
	card.setAttribute('suit', suit); 
	card.setAttribute('value', `${value}`); 
	card.setAttribute('id', `${suit}_${value}`);
	numL.innerText = cardNum; 
	numR.innerText = cardNum;
	imgL.classList.add('outer')
	imgR.classList.add('outer')
	const sideL: HTMLDivElement = document.createElement('div');
	const sideR: HTMLDivElement = document.createElement('div');
	sideL.classList.add('side');
	sideR.classList.add('side', 'flip');
	const middle: HTMLDivElement = document.createElement('div'); 
	middle.classList.add('center');
	const innerL: HTMLDivElement = document.createElement('div'); 
	const innerM: HTMLDivElement = document.createElement('div'); 
	const innerR: HTMLDivElement = document.createElement('div');
	innerL.classList.add('inner'); 
	innerM.classList.add('inner'); 
	innerR.classList.add('inner');
	if (value > 10) {
		card.classList.add('face')
		innerR.classList.add('flip')
	}
	for (let i = (side * 2) + center; i > 0; i--) { // maybe do this in css with nth child or something
		const img = document.createElement('i'); 
		switch (true) {
			case value == 7 && i == 4:
				innerM.appendChild(img)
				innerM.appendChild(document.createElement('div'))
				break;
			case side != 0 && i > side + center && i <= side + center + (side / 2):
				img.classList.add('flip')
				innerL.appendChild(img)
				break;
			case i > side + center:
				innerL.appendChild(img)
				break;
			case side != 0 && i < side && i <= (side / 2):
				img.classList.add('flip')			
				innerR.appendChild(img)	
				break;
			case i <= side:
				innerR.appendChild(img)
				break;
			case center > 1 && i > side && i < side + center && i == side + 1:
				img.classList.add('flip')			
				innerM.appendChild(img)
				break;
			default:
				innerM.appendChild(img)
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
	card.appendChild(sideR)
	element.appendChild(card); 
	return card
}

const gameBoard: HTMLDivElement = document.querySelector('.game_board')!
const solitaire = new Board(gameBoard);

gameBoard.addEventListener('click', (e: MouseEvent) => {
	// TODO: if !active ...
	// TODO: auto
	solitaire.handleClickEvent(e.clientX - Math.floor(gameBoard.getBoundingClientRect().left), e.clientY - Math.floor(gameBoard.getBoundingClientRect().top))
})

document.addEventListener('keydown', (e: KeyboardEvent) => {
	if (e.key == 'c') {
		solitaire.auto.enabled = !solitaire.auto.enabled;
		if (solitaire.auto.enabled) {
			solitaire.deselect()
			console.log('Computer enabled')
			solitaire.updateBoard()
		} else {
			clearInterval(solitaire.loop)
			console.log(`Computer disabled \n${solitaire.auto.losses + solitaire.auto.wins} total games \nWins: ${solitaire.auto.wins} \nLosses: ${solitaire.auto.losses} \nWin percentage: ${Math.round((solitaire.auto.wins / (solitaire.auto.losses + solitaire.auto.wins)) * 100)}%`);
			solitaire.auto.wins = 0
			solitaire.auto.losses = 0
		}
	}
})

function autoMove(): void {
	//simplify the app
	// remove a lot of useless functions
	const possibleCards: Array<Card> = []
	const possibleMoves: Array<Move> = []
	if (!solitaire.discard.isEmpty()) {
		possibleCards.push(solitaire.discard.topCard()!)
	}
	solitaire.stacks.forEach(stack => {
		if (!stack.isEmpty()) {
			stack.cards.forEach(card => {
				if (card.faceDown == false) {
					possibleCards.push(card)
				}
			})
		}
	})
	solitaire.wins.forEach(win => {
		if (!win.isEmpty()) {
			possibleCards.push(win.topCard()!)
		}
	})
	possibleCards.forEach(card => {
		[...solitaire.stacks, solitaire.getWinFromSuit(card.suit)].forEach(target => {
			if (!target.hasCard(card)) {
				if (target.canMoveTo(card)) {
					const weight = solitaire.getMoveWeight(card, target, possibleCards)
					possibleMoves.push({ card: card, target: target, weight: weight })
				}	
			}
		})
	})
	let bestMove: Move | undefined = undefined
	possibleMoves.forEach(move => {
		if (bestMove == undefined) {
			bestMove = move
		}
		if (bestMove != undefined) {
			if (move.weight! > bestMove.weight!) {
				bestMove = move
			}
		}
	})
	switch (true) {
		case bestMove == undefined:
			console.log('No valid moves detected, drawing')
			solitaire.draw.drawCard()
			solitaire.consecutiveDrawCount += 1
			break;
		case bestMove!.weight! < 1.2:
			console.log(`${bestMove!.card!.suit}_${bestMove!.card!.value} to ${bestMove!.target.name} (${bestMove!.target.topCard() == undefined ? 'none' : `${bestMove!.target.topCard()!.suit}_${bestMove!.target.topCard()!.value}`}) (${bestMove!.weight}) - Drawing instead`)
			solitaire.draw.drawCard()
			solitaire.consecutiveDrawCount += 1
			break;
		case bestMove!.card!.stack instanceof CardCenterStack:
			const targetCards: Array<Card> = bestMove!.card!.stack.cards.slice(bestMove!.card!.stack.cards.indexOf(bestMove!.card!))
			const cards: Array<Card> = []
			// TODO: find a better way to do this
			for (let i = targetCards.length; i > 0; i--) {
				cards.push((bestMove!.card!.stack.removeCard()))
			}
			while (cards.length > 0) {
				bestMove!.target.addCard(cards.pop()!)
			}
			console.log(`${bestMove!.card!.suit}_${bestMove!.card!.value} to ${bestMove!.target.name} (${bestMove!.target.topCard() == undefined ? 'none' : `${bestMove!.target.topCard()!.suit}_${bestMove!.target.topCard()!.value}`}) (${bestMove!.weight})`)
			solitaire.consecutiveDrawCount = 0
			break;
		default:
			console.log(`${bestMove!.card!.suit}_${bestMove!.card!.value} to ${bestMove!.target.name} (${bestMove!.target.topCard() == undefined ? 'none' : `${bestMove!.target.topCard()!.suit}_${bestMove!.target.topCard()!.value}`}) (${bestMove!.weight})`)
			bestMove!.target.addCard(bestMove!.card!.stack.removeCard())
			solitaire.consecutiveDrawCount = 0
			break;
	}
	solitaire.updateBoard()
}
