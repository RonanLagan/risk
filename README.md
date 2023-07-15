##### About the project

This project uses react, express, websockets and tailwinds css to create a multiplayer version of the game risk.

To run this app, go in the client folder, run npm start and go in the server folder and run node index.js

This is an older project and the files are not very well organized

https://en.wikipedia.org/wiki/Risk_(game)

### Implemented RULES (2-6 players)

# Armies
- Infantry: Worth 1
- Cavalry: Worth 5
- Artilery: Worth 10

# Cards
- 42 Territory cards marked with infantry, cavalery, or artilery
- 2 "wild" cards (all 3 pictures but no territory)

# Setup
- Each player selects a color
- Infantry per players
    - 2 players: 
    - 3 players: 35 per player
    - 4 players: 30 per plaer
    - 5 players: 25 per player
    - 6 players: 20 per player
- Everyone roles a dice, whoever rolls the highest number places one infantry from their pile and places it on a territory on the board
- Clockwise from first player, everyone places one army on a territory until all 42 territories are occupied
- After all territories are occupied, place the rest of your armies where you want
- Whoever placed the first army takes the first turn

# Steps in a turn
- Get and place new armies
    - Number of territories / 3 (rounded)
    - You always receive at least 3 armies even if you have less than 9 territories
    - Continents:
        - Australia, South america: 2,
        - Africa: 3
        - North America, Europe: 5
        - Asia: 7
- Attack if you chose, by rolling the dice
    - You can only attack territories you touch
    - You must have 2 armies in a territory to attack
    - You can stop attacking a territory at any time
    - You can attack as many territories as you want during a turn
    - Attacking
        - Attacker and defender need to announce how many dice they want to roll
        - Attacker
            - Roll 1, 2 or 3 red dice. You need one more army in your territory than the amount of dice you roll
        - Defender
            - Roll 1 or 2 white dice. To roll 2, he needs at least 2 armies in the territory under attack.
        - Dice
            - Highest pair of each goes against each other. (Ex: 5 for attacker and 4 for defender, attackers wins)
            - If defender defends with 2 dice, we use the 2nd highest dice of the attacker
            - If it's a tie, the defender wins
            - Attacker can't lose more than 2 armies in a roll
        - If you win an attack, move in at least the amount of dice you rolled to the territory (you must always leave at least one army behind in the previous territory)
            - If you eliminate an opponent, you collect any cards he had
- Fortify
    - Move troops from (only one territory) to (only one other territory)
- Get a card if you took a territory
    - Card combos:
        - 3 same cards
        - 1 of each card
        - 2 cards + wild card
    - Card values
        1. 4
        2. 6
        3. 8
        4. 10
        5. 12
        6. 15
        etc. 5 more than previous
    - If any of the cards you turn in has a territory you own, you get 2 extra armies, which you must place on that territory
- Winning
    - Winner is whoever controls 42 territories on the board


<!-- TURN STEPS -->
- 0: Give armies to players and let them place them
- 1: Place cards (currently skip from 0 to 2, do cards later)
- 2: Attack
- 3: Fortify
(At end of turn, in goNextTurn, give a card to players if they attacked in that turn)