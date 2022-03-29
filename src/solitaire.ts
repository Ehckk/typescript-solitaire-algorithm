const selected : Card[] = [];
let flippedCardCount: number = 0;
let consecutiveDraws : number = 0;
let gameOver : boolean;

let autoLoop : ReturnType<typeof setInterval>;
let auto : boolean = false;
let autoWins = 0;
let autoLosses = 0;

let moveCount: number;
let totalMoves: number;

class Card {
	suit: string;
	value: number;
	name: string;
	element: HTMLDivElement;
	stack: CardStack | undefined;
	hasFlippedCardUnderneath: Boolean;

	constructor(suit: string, value: number) {
		this.suit = suit
		this.value = value
		this.name = `${suit}_${value}`
		this.element = createCardElement(this.suit, this.value)
		this.stack = undefined
		this.hasFlippedCardUnderneath = false
	}

	setStackTags(newStack: CardStack): void {
		const oldStack = this.stack
		if (oldStack != undefined) {
			this.element.classList.remove(this.stack.name)
		}
		this.stack = newStack;
		this.element.classList.add(this.stack.name);
		switch (true) {
			case this.stack.isDraw() && oldStack == undefined:
				this.element.style.top = '0px'
				break;
			case this.stack.isDraw() || this.stack.isDiscard():
				this.flipCard();
				this.element.style.top = '0px'
				break;
			case this.stack.isWin():
				this.element.style.top = `${(((unitDim * 7) * cardSuits.indexOf(this.suit)) + ((unitDim / 2) * cardSuits.indexOf(this.suit)) + (unitDim / 4))}px`
				break;
			case oldStack != undefined:
				if (this.isFlipped()) this.flipCard()
				this.element.style.top = `${(this.stack.cards.length) * 1.5 * unitDim}px`
				break;
			default:
				this.element.style.top = `${(this.stack.cards.length) * 1.5 * unitDim}px`
				break;
		}
	}

	flipCard(): boolean {
		return this.element.classList.toggle('flipped')
	}

	isFlipped(): boolean {
		return this.element.classList.contains('flipped')
	}

	isOnTop(): boolean {
		return this.stack.topCard() == this
	}

	isOnBottom(): boolean {
		return this.stack.cards[this.stack.cards.length - 1] == this
	}

	isRed(): boolean {
		return this.suit == 'diamond' || this.suit == 'heart'
	}

	isBlack(): boolean {
		return this.suit == 'spade' || this.suit == 'club'
	}

	isLowCard(card: Card): boolean {
		return this.value + 1 == card.value
	}

	isHighCard(card: Card): boolean {
		return this.value - 1 == card.value
	}

	isSameSuit(card: Card): boolean {
		return this.suit == card.suit
	}

	canMoveTo(card: Card, targetStack: CardStack): boolean {
		let valid = false
		switch (true) {
			case targetStack == this.stack: break;
			case targetStack.isWin() && !this.isOnTop(): break;
			case card == undefined && targetStack.isWin() && this.value == 1:
				valid = true;
				break;
			case card == undefined && targetStack.isStack() && this.value == 13:
				valid = true;
				break;
			case card == undefined: break;
			case card.isFlipped(): break;
			case targetStack.isWin() && this.isSameSuit(card) && this.isHighCard(card):
				valid = true;
				break;
			case this.isLowCard(card) && ((this.isBlack() && card.isRed()) || (this.isRed() && card.isBlack())):
				valid = true;
				break;
		}
		return valid
	}
}

class CardStack {
	name: string;
	cards: Card[];

	constructor(name: string) {
		this.name = name
		this.cards = []
	}

	addCardToStack(card: Card): void {
		card.setStackTags(this)
		this.setCardZ(document.querySelector(`#${card.element.id} > .card_body`))
		this.cards.unshift(card)
	}

	removeCardFromStack(): Card {
		const card = this.cards.shift();
		if (!this.isStack() || this.isEmpty()) return card 
		this.flipTopCard() 
		card.hasFlippedCardUnderneath = false;
		return card
	}

	setCardZ(cardBody: HTMLDivElement) {
		switch (true) {
			case this.isDraw() && this.isEmpty(): 
				cardBody.style.zIndex = '0'; 
				break;
			case this.isDiscard() && this.isEmpty(): 
				cardBody.style.zIndex = '52'; 
				break;
			case this.isEmpty(): 
				cardBody.style.zIndex = '104'; 
				break;
			default: 
				let cardBefore: HTMLDivElement = document.querySelector(`#${this.cards[0].element.id} > .card_body`)
				cardBody.style.zIndex = `${(parseInt(cardBefore.style.zIndex) + 1)}`; 
				break;
		}
	}

	flipTopCard(): void {
		if (this.topCard().isFlipped()) {
			this.topCard().flipCard()
			flippedCardCount -= 1;
		}
	}

	topCard(): Card {
		return this.cards[0]
	}

	nextCard(card: Card): Card {
		return this.cards[card.stack.cards.indexOf(card) + 1]
	}

	isEmpty(): boolean {
		return this.cards.length == 0;
	}

	isSingle(): boolean {
		return this.cards.length == 1;
	}

	isDraw(): boolean {
		return this.name.startsWith('draw')
	}

	isDiscard(): boolean {
		return this.name.startsWith('discard')
	}

	isWin(): boolean {
		return this.name.startsWith('win')
	}

	isStack(): boolean {
		return this.name.startsWith('stack')
	}

	flippedCardsInStack(): number {
		let flippedCards = 0
		if (!this.isEmpty()) {
			this.cards.forEach(card => card.isFlipped() ? flippedCards += 1 : {})
		}
		return flippedCards
	}
}

function createCardElement(suit: string, value: number | string) {
	const card: HTMLDivElement = document.createElement('div'); 
	card.classList.add('card', 'flipped');
	card.setAttribute('suit', suit); 
	card.setAttribute('value', `${value}`); 
	card.setAttribute('id', `${suit}_${value}`);
	const body: HTMLDivElement = document.createElement('div'); 
	body.classList.add('card_body');
	const suitNumL: HTMLElement = document.createElement('i'); 
	const suitNumR: HTMLElement = document.createElement('i');
	suitNumL.classList.add('suit_num'); 
	suitNumR.classList.add('suit_num');
	const cardNum = (): string => (value == 1 ? 'A' : value == 11 ? 'J' : value == 12 ? 'Q' : value == 13 ? 'K' : `${value}`)
	suitNumL.innerText = cardNum(); 
	suitNumR.innerText = cardNum();
	const suitImgL: HTMLElement = document.createElement('i'); 
	const suitImgR: HTMLElement = document.createElement('i');
	suitImgL.classList.add('suit_img', 'outer')
	suitImgR.classList.add('suit_img', 'outer')
	const borderL: HTMLDivElement = document.createElement('div')
	const borderR: HTMLDivElement = document.createElement('div')
	borderL.classList.add('side', 'left')
	borderR.classList.add('side', 'right')
	const middle: HTMLDivElement = document.createElement('div'); 
	middle.classList.add('middle');
	const innerL: HTMLDivElement = document.createElement('div'); 
	const innerM: HTMLDivElement = document.createElement('div'); 
	const innerR: HTMLDivElement = document.createElement('div');
	innerL.classList.add('inner', 'left'); 
	innerM.classList.add('inner', 'center'); 
	innerR.classList.add('inner', 'right');
	const side: number = getSide(Number(value));
	const center: number = getCenter(Number(value));
	for (let i = 0; i < (side * 2) + center; i++) { // maybe do this in css with nth child or something
		const img = document.createElement('i'); 
		img.classList.add('suit_img', 'inner'); 
		switch (true) {
			case i < side:
				innerL.appendChild(img)
				break;
			case i >= side + center:
				innerR.appendChild(img)
				break;
			case i == 4 && (side * 2) + center == 7:
				innerM.appendChild(img)
				innerM.appendChild(document.createElement('div'))
				break;
			default:
				innerM.appendChild(img)
				break;
		}
	}
	borderL.appendChild(suitNumL); 
	borderL.appendChild(suitImgL); 
	borderR.appendChild(suitNumR); 
	borderR.appendChild(suitImgR);
	middle.appendChild(innerL); 
	middle.appendChild(innerM); 
	middle.appendChild(innerR);
	body.appendChild(borderL); 
	body.appendChild(middle); 
	body.appendChild(borderR)
	card.appendChild(body); 
	board.appendChild(card); 
	return card
}

const draw = new CardStack('draw')
const discard = new CardStack('discard')
const stacks = []
const wins = []
const board = document.querySelector('.game_board')
const cardSuits = ['spade', 'heart', 'club', 'diamond']
const unitDim = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-unit-dim'))
const unitTime = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-unit-time'))

const getSide = (value: number): number => value > 10 ? 1 : value < 4 ? 0 : value < 10 ? Math.floor(value / 2) : 4
const getCenter = (value: number): number => value > 10 ? 0 : value < 4 ? value : value < 10 ? value - (Math.floor(value / 2) * 2) : 2
const generateCardStacks = () => { 
	cardSuits.forEach(suit => wins.push(new CardStack(`win_${suit}`)));
	for (let i = 1; i <= 7; i++) { 
		stacks.push(new CardStack(`stack_${i}`));
	}
}

function dealCards(): void { 
	const cards: Card[] = []; 
	cardSuits.forEach(suit => cards.push(...getCardsForSuit(suit)));
	const pickACardAnyCard = (): Card => cards.splice(Math.floor(Math.random() * cards.length), 1)[0]
	for (let i = 1; i <= 7; i++) { 
		let stack  = stacks[i - 1]; 
		for (let j = 0; j < i; j++) { 
			let anyCard: Card = pickACardAnyCard(); 
			stack.addCardToStack(anyCard); 
			flippedCardCount += 1; 
			if (!anyCard.isOnBottom()) {
				anyCard.hasFlippedCardUnderneath = true; 
			}
			if (j == i - 1) {
				stack.flipTopCard();
			}
		}
	} 

	while (cards.length > 0) { 
		draw.addCardToStack(pickACardAnyCard()); 
	} 
}
const getCardsForSuit = (suit: string): Card[] => { const suitCards: Card[] = []; for (let value = 1; value < 14; value++) { suitCards.push(new Card(suit, value)) } return suitCards; }

document.addEventListener('keydown', e => {
	e.preventDefault(); 
	gameOver && e.key == ' ' ? startSolitaire() : !gameOver && e.key != 'c' ? {} : auto ? disableCom() : enableCom() 
})

const disableCom = () => { 
	auto = false; 
	clearInterval(autoLoop);
	console.log(`Computer disabled \n${autoLosses + autoWins} total games \n${totalMoves} total moves  \nWins: ${autoWins} \nLosses: ${autoLosses} \nWin percentage: ${Math.round((autoWins / (autoLosses + autoWins)) * 100)}% \nAverage moves per game: ${Math.round(totalMoves / autoLosses + autoWins)}`); 
}

const enableCom = () => { 
	auto = true; 
	autoLosses = 0; 
	autoWins = 0;
	moveCount = 0;
	totalMoves = 0;
	console.log('Computer enabled');
	autoLoop = setInterval(canComputerMove, unitTime * 1500)
}

document.addEventListener('click', e => {
	e.preventDefault()
	const target = e.target as HTMLDivElement
	const targetStack = getStackFromMx(e.clientX - Math.floor(board.getBoundingClientRect().left))
	if (targetStack == undefined) {
		deselectCards();
		return;
	}
	const targetCard = target.closest('.card') == null ? undefined : targetStack != wins ? getCardFromElement(target.closest('.card'), targetStack) : undefined
	e.shiftKey ? shiftMoveHandler(targetCard, targetStack) : moveHandler(targetCard, targetStack);
})

const moveHandler = (targetCard: Card, targetStack: CardStack) => {
	switch (true) {
		case targetStack == draw:
			drawNextCard();
			deselectCards();
			break;
		case targetCard == undefined:
			deselectCards();
			break;
		case selected.length == 1 && targetStack == getWinPile(targetCard.suit) && selected[0].canMoveTo(getWinPile(selected[0].suit).topCard(), getWinPile(selected[0].suit)):
			moveCardToWin(selected[0]);
			deselectCards();
			break;
		case selected.length > 0 && selected[0].canMoveTo(targetCard, targetStack):
			moveCardsToStack(selected, targetStack);
			deselectCards();
		case selected.length > 0:
			deselectCards();
			break;
		case !targetCard.isFlipped() && targetStack.isStack():
			selectCard([...sliceCardsFromStack(targetCard)])
			break;
		case targetStack != draw:
			selectCard([targetCard])
			break;
		default:
			deselectCards();
			break;
	}
}

const shiftMoveHandler = (targetCard: Card, targetStack: CardStack) => {
	if (selected.length > 0) deselectCards();
	if (targetStack == draw) {
		drawNextCard()
		return
	}
	if (targetCard == undefined) return;
	if (!targetCard.isFlipped()) {
		autoMove(targetCard)
	}
}

const getCardFromElement = (c: { getAttribute: (arg0: string) => any; }, targetStack: { cards: any[]; }) => { 
	let search = undefined; 
	if (search != undefined) return search;
	targetStack.cards.find((card: { value: any; suit: any; }) => card.value == c.getAttribute('value') && card.suit == c.getAttribute('suit'))
	return search; 
	// what
}

const moveCardsToStack = (cards: any[], stack: CardStack) => {
	sliceCardsFromStack(cards[0]).forEach((card: Card) => { card.stack.removeCardFromStack(); stack.addCardToStack(card) });
}

const moveCardToWin = (card: Card) => getWinPile(card.suit).addCardToStack(card.stack.removeCardFromStack());

const sliceCardsFromStack = (card: Card) => card.stack.cards.slice(0, card.stack.cards.indexOf(card) + 1).reverse()

const addCardsFromStackToList = (card: Card, stack: CardStack) => { 
	const cards = []; 
	stack.cards.forEach((stackedCard: Card) => { 
		if (stackedCard.stack.cards.indexOf(stackedCard) <= card.stack.cards.indexOf(card)) {
			cards.unshift(stackedCard)
		}
	});
	return cards 
}


const getStackFromMx = (mX: number) => {
	let stack = undefined
	switch (true) {
		case mX > 0 && mX <= unitDim * 5:
			stack = draw
			break;
		case mX <= unitDim * 10:
			stack = discard
			break;
		case mX > unitDim * 30.5:
			stack = wins
			break;
		default:
			for (let i = 7; i > 0; i--) { 
				if (stack == undefined) {
					if (mX > (80 * (i - 1)) && mX < (168 + (80 * i))) {
						stack = stacks[i - 1]
					}
				}
			}
	}
	return stack
}

const getWinPile = (suit: string): CardStack => wins.find(win => win.name == `win_${suit}`)

const drawNextCard = (): void => { 
	consecutiveDraws += 1; 
	if (draw.cards.length == 0) {
		for (let i = discard.cards.length; i > 0; i--) { 
			draw.addCardToStack(discard.removeCardFromStack())
		}
		return
	} 
	discard.addCardToStack(draw.removeCardFromStack()) 
}

const selectCard = (cards: Card[]): void => { 
	cards.forEach((card: Card) => {
		card.element.classList.add('selected'); 
		selected.push(card);
	})
}

const deselectCards = () => { 
	selected.forEach(card => card.element.classList.remove('selected')); 
	selected.length = 0 
}

// order stacks from least cards to most cards beforehand and iterate through that
// don't bother iterating through win piles if card is in win pile

const getEveryPossibleCard = () => getCardsFromStacks(discard.isEmpty() ? [...getCardsFromWins([])] : [discard.topCard(), ...getCardsFromWins([])]);
// add something here that pushes down draw priority if consecutive draw count is really high
// then immediately reset it if a non-draw move is made

//instead of checking each card and seeing where it can go, check each stack and see what possible cards can match it
// const getPossibleStackCard = (targetCard) => { 
// 	if (targetCard.value == 1) return
// 	let possibleCard = 
// }

function sortStacksByFlippedCardCount(): CardStack[] {
	const stacksCopy = [...stacks]
	const orderedStacks = []
	while (stacksCopy.length > 0) {
		let mostFlippedCards = undefined
		stacksCopy.forEach(stack => {
			if (mostFlippedCards != undefined) {
				if (stack.flippedCardsInStack() > mostFlippedCards.flippedCardsInStack()) {
					mostFlippedCards = stack
				}
			}
			if (mostFlippedCards == undefined) {
				mostFlippedCards = stack
			}
		})
		orderedStacks.push(stacksCopy.splice(mostFlippedCards, 1)[0])
	}
	return orderedStacks
}

const getCardsFromStacks = (cards: any[]) => { 
	stacks.forEach(stack => { 
		if (!stack.isEmpty()) { 
			stack.cards.forEach((card: { isFlipped: () => any; }) => {
				if (!card.isFlipped()) {
					cards.push(card)
		 		}
			}); 
		}
	});
	return cards
}

const getCardsFromWins = (cards: any[]) => { 
	wins.forEach(win => {
		if (!win.isEmpty()) {
			win.cards.forEach((card: { isOnTop: () => any; }) => {
				if (card.isOnTop()) {
					cards.push(card)
				}
			})
		}
	}); 
	return cards 
}

const getBestMoveFromEveryCard = (cards: any[]) => { 
	let bestMove = undefined
	cards.forEach((card: Card) => {
		let targets = card.stack.isWin() ? sortStacksByFlippedCardCount() : sortStacksByFlippedCardCount().concat(getWinPile(card.suit))
		let thisMove = getBestMoveForCard(card, targets, cards)
		if (thisMove != undefined) {
			if (bestMove != undefined) {
				if (compareMoves(bestMove, thisMove)) {
					bestMove = thisMove
				}
			}
			if (bestMove == undefined) {
				bestMove = thisMove
			}
		}
	});
	return bestMove
}

const getBestMoveForCard = (card: Card, targets: CardStack[], cards?: Card[]) => { 
	let bestMove = undefined
	targets.forEach((target: CardStack) => {
		if (card.canMoveTo(target.topCard(), target)) {
			let thisMove = { card: card, target: target, weight: getMoveWeight(card, target, cards) }
			if (bestMove != undefined) {
				if (compareMoves(bestMove, thisMove)) {
					bestMove = thisMove
				}
			}
			if (bestMove == undefined) {
				bestMove = thisMove
			}
		}
	}); 
	return bestMove
}

// remember to remove the weird ordering BS 
const getMoveWeight = (card: Card, target: CardStack, cards: Card[]) => {
	let weight: number
	switch (true) {
		case flippedCardCount == 0 && target.isWin():
			weight = 2.5
			break;
		case flippedCardCount == 0 && target.isStack():
			weight = 0.1
			break;
		case card.stack.isStack() && card.hasFlippedCardUnderneath:
			weight = 2 + (.5 * (card.stack.flippedCardsInStack() + 1));
			break;
		case target.isEmpty() && card.value == 13 && ((!card.stack.isStack()) || !card.isOnBottom()):
			weight = 1.6
			break;
		case target.isWin() && canCardBeUsedToOpenByWin(card, cards):
			weight = 1.7
			break;
		case card.stack.isStack() && canCardBeUsedToOpenByStack(card, cards):
			weight = 1.5
			break;	
		case target.isWin():
			weight = 1.4
			break;
		case card.stack.isDiscard():
			weight = 1.3
			break;
		default:
			weight = 1;
			break;
	} 
	return weight
}

const canCardBeUsedToOpenByWin = (card: Card, cards: Card[]) => cards.find((card2: Card) => card2.isOnTop() && card.hasFlippedCardUnderneath && card.isLowCard(card2) && card.isSameSuit(card2)) != undefined

const canCardBeUsedToOpenByStack = (card: Card, cards: Card[]) => { 
	if (card.isOnBottom()) {
		return cards.find((card2: Card) => card2.value == 13 && card != card2 && !card2.isOnBottom()) != undefined;
	} 
	const nextCard = card.stack.nextCard(card)
	if (nextCard.isFlipped()) return false
	return cards.find((card2: Card) => card2.hasFlippedCardUnderneath && (nextCard.isHighCard(card2) && ((card2.isBlack() && nextCard.isRed()) || (card2.isRed() && nextCard.isBlack())))) != undefined
}

const compareMoves = (move1: { weight: number; }, move2: { card?: any; target?: any; weight: any; }) => {
	// true if move2 is better
	// false if move1 is better
	return move1.weight < move2.weight
}

const autoMove = (card: Card) => {
	if (card.stack.isWin()) {
		getBestAutoMove(getBestMoveForCard(card, sortStacksByFlippedCardCount()))
		return
	} 
	getBestAutoMove(getBestMoveForCard(card, [...sortStacksByFlippedCardCount(), getWinPile(card.suit)]))
}
const getBestAutoMove = (moves: { target: CardStack, card: Card }[]) => moves.length == 0 ? {} : makeBestMove(moves[0])

const computerMove = () => {
	const cards = getEveryPossibleCard()
	const bestMove = getBestMoveFromEveryCard(cards)  
	if (bestMove == undefined || bestMove.weight < 1.2) {
		draw.cards.length + discard.cards.length > 0 ? drawNextCard() : endGameFail('No possible moves')
		return
	}
	console.log(`${bestMove.card.name} (${bestMove.card.stack.name}) to ${bestMove.target.name} (${bestMove.weight})`)
	moveCount += 1
	makeBestMove(bestMove) 
}

const makeBestMove = (move: { target: CardStack, card: Card }) => { consecutiveDraws = 0; move.target.isStack() ? moveCardsToStack(addCardsFromStackToList(move.card, move.card.stack), move.target) : moveCardToWin(move.card) }

// // css shake animation when no valid moves
// // make a bunch of css animations

const startSolitaire = () => {
	flippedCardCount = 0
	if (stacks.length == 0) {
		generateCardStacks()
	}
	dealCards()
	gameOver= false
	moveCount = 0;
	if (auto) {
		autoLoop = setInterval(canComputerMove, unitTime * 1000)
	}
	//window.requestAnimationFrame(mainSolitaire)
}

const isWin = () => { 
	let isWin = true; 
	wins.forEach(win => { 
		if (isWin) {
			if (win.cards.length != 13) {
				isWin = false
			}
		}
	}); 
	return isWin 
}

const canComputerMove = () => {
	if (isWin()) {
		console.log('Epic win'); 
		clearInterval(autoLoop); 
		autoWins += 1; 
		deleteCards(); 
		startSolitaire();
		return
	}
	if (consecutiveDraws > (Math.floor((draw.cards.length + discard.cards.length) * 1.5))) {
		endGameFail('No legal moves')
		return
	}
	computerMove();
}
// insert something here
// what fucking something

const endGameFail = (message: string) => { 
	console.log(`Game over: ${message}`); 
	clearInterval(autoLoop); 
	autoLosses += 1;
	totalMoves += moveCount;
	deleteCards(); 
	startSolitaire();
}

// make more efficient ai algorithm for if win vs not win
const deleteCards = () => { 
	document.querySelectorAll('.card').forEach(card => card.remove()); 
	stacks.forEach(stack => stack.cards.length = 0); 
	wins.forEach(win => win.cards.length = 0); 
	discard.cards.length = 0; 
	draw.cards.length = 0; 
}

startSolitaire()