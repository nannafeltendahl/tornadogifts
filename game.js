import {gsap} from "./gsap/all.js";
import {Vec2} from "./vec2.js";

// get random number with decimals
function getRandomDecimalNumber(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * types of gifts
 * @type {[{src: string, name: string},{src: string, name: string},{src: string, name: string},{src: string, name: string},{src: string, name: string}]}
 */
const GIFT_TYPES = [
    {
        src: 'images/box.svg',
        name: 'Box'
    },
    {
        src: 'images/elfcap.svg',
        name: 'Elf Cap'
    },
    {
        src: 'images/porridge.svg',
        name: 'Porridge'
    },
    {
        src: 'images/ornament.svg',
        name: 'Ornament'
    },
    {
        src: 'images/pepermintstick.svg',
        name: 'Pepermintstick'
    }
];

/**
 * types of enemies
 * @type {[{src: string, name: string}]}
 */
const ENEMY_TYPES = [
    {
        src: 'images/bear.webp',
        name: 'Bear'
    }
];

/**
 * reasons for ending the game
 * @type {{PLAYER_HEALTH: string, TIMEOUT: string}}
 */
const STOP_REASON = {
    PLAYER_HEALTH: 'Player Health',
    TIMEOUT: 'Timeout',
};

/**
 * object to store the current state for game objects (gifts and enemies)
 */
class GameObjectData {
    constructor(position, velocity, ignoreTornado, isEnemy) {
        this.position = position;
        this.velocity = velocity;
        this.ignoreTornado = ignoreTornado;
        this.isEnemy = isEnemy;
    }
}

/**
 * object that holds the entire game state and functions to control the game
 */
export class Game {
    constructor() {
        // settings
        this.tornadoAnimationDuration = 7; // how long is each tornado animation
        this.tornadoMinimumRounds = 8; // minimum rounds to spin per tornado animation
        this.tornadoMaximumRounds = 25; // maximum rounds to spin per tornado animation
        this.maxGameTimeSeconds = 120; // how long is each round
        this.elfSpeed = 0.0025; // how fast can the elf move (part of game difficulty)
        this.gameObjectVelocityMin = 1; // how slow can the gifts move at the beginning of the game
        this.gameObjectVelocityMax = 3; // how fast can the gifts move at the beginning of the game
        this.velocityScaleOverTime = 3.0; // how much faster will everything move as the game progresses
        this.maximumGameObjectsInPlay = 7; // maximum amount of gifts in play (on the board)
        this.enemyFraction = 0.3; // chance for the tornado to release an enemy
        this.playerInitialHealth = 3; // how many hearts do the player have when the game begins

        // elements
        this.container = document.getElementById('game-container');
        this.player = document.getElementById('player');
        this.elf = document.getElementById('elf');
        this.tornado = document.getElementById('tornado');
        this.gameTimer = document.getElementById('game-timer');
        this.grizzly1 = document.getElementById("grizzly1");
        this.grizzly2 = document.getElementById("grizzly2");
        this.jinglerock = document.getElementById("jinglerock");
        this.jinglerock.volume = 0.3;
        this.bell = document.getElementById("bell");

        // events
        document.addEventListener('mousemove', this.onMouseMove.bind(this));

        this.resetGameState();
    }

    /**
     * resets various game state variables to their initial values, preparing the game for a new start
     */
    resetGameState() {
        this.isGameRunning = false; // stops the game
        this.playerY = 0; //resets the players vertical position to 0
        this.playerScore = 0; // resets the players score to 0
        this.playerHealth = this.playerInitialHealth; // resets to players health to full (three hearts)
        this.playerScoreElement = document.getElementById('player-score');
        this.elfY = 0; //resets the elf vertical position to 0
        this.elfScore = 0; // resets the elf score to 0
        this.elfScoreElement = document.getElementById('elf-score');

        // remove any existing game objects
        if (this.gameObjects) {
            this.gameObjects.forEach(gameObject => {
                this.removeGameObject(gameObject);
            });
        }

        this.gameObjects = new Set();
        this.globalVelocityScale = 1.0;
        this.nextGiftType = 0;
        this.nextEnemyType = 0;
    }

    /**
     * starts the game
     * @param difficulty difficulty of the game as a string ('easy', 'normal' or 'hard')
     */
    start(difficulty) {
        // stop game if it´s already running
        this.stop();

        // it runs the function resetGameState, that sets the score to zero
        this.resetGameState();

        // it hides all menus when the game is playing.
        this.showMenu(null);

        // if or else if statement to run the difficulty mode the player has chosen.
        if (difficulty === 'easy') {
            this.elfSpeed = 0.005; // how fast can the elf move (part of game difficulty)
            this.gameObjectVelocityMin = 1; // how slow can the gifts move at the beginning of the game
            this.gameObjectVelocityMax = 3; // how fast can the gifts move at the beginning of the game
            this.velocityScaleOverTime = 1.0; // how much faster will everything move as the game progresses
            this.maximumGameObjectsInPlay = 7; // maximum amount of gifts in play (on the board)
            this.enemyFraction = 0.3; // chance for the tornado to release an enemy

        } else if (difficulty === 'normal') {
            this.elfSpeed = 0.01; // how fast can the elf move (part of game difficulty)
            this.gameObjectVelocityMin = 1; // how slow can the gifts move at the beginning of the game
            this.gameObjectVelocityMax = 3; // how fast can the gifts move at the beginning of the game
            this.velocityScaleOverTime = 3.0; // how much faster will everything move as the game progresses
            this.maximumGameObjectsInPlay = 9; // maximum amount of gifts in play (on the board)
            this.enemyFraction = 0.4; // chance for the tornado to release an enemy

        } else if (difficulty === 'hard') {
            this.elfSpeed = 0.02; // how fast can the elf move (part of game difficulty)
            this.gameObjectVelocityMin = 1; // how slow can the gifts move at the beginning of the game
            this.gameObjectVelocityMax = 4; // how fast can the gifts move at the beginning of the game
            this.velocityScaleOverTime = 5.0; // how much faster will everything move as the game progresses
            this.maximumGameObjectsInPlay = 12; // maximum amount of gifts in play (on the board)
            this.enemyFraction = 0.7; // chance for the tornado to release an enemy
        }

        // I use the gsap.timeline function to control the different states in the game
        this.gameTimeline = gsap.timeline({

            // sets the maximum duration of the game
            duration: this.maxGameTimeSeconds,

            // bind the onGameUpdate function. Called by GSAP on every update of the timeline
            onUpdate: this.onGameUpdate.bind(this),

            // bind the onGameComplete function. Called by GSAP everytime the game is completed.
            onComplete: this.onGameComplete.bind(this)
        });

        // sets the game running to true
        this.isGameRunning = true;

        // update the amount of hearts displayed
        this.updatePlayerHealthDisplay();

        // rotate and scale the tornado while the game is running
        this.startTornado();

        // play the background music
        this.jinglerock.play();
    }

    /**
     * stops the game
     * @param reason the reason for stopping the game. see STOP_REASON for details
     */
    stop(reason) {
        if (!this.isGameRunning) {
            return;
        }

        // sets isGameRunning to false
        this.isGameRunning = false;

        // kill any existing animations
        gsap.killTweensOf(null);
        if (this.gameTimeline) {
            this.gameTimeline.kill();
        }
        // pauses the jinglerock sound
        this.jinglerock.pause();
        this.jinglerock.currentTime = 0;

        //remove all off the GameObjects from the canvas
        this.gameObjects.forEach(gameObject => {
            this.removeGameObject(gameObject);
        });
        // uses an if- else-if- statement to check for reasons for the game stop and then display the correct menu
        if (reason === STOP_REASON.PLAYER_HEALTH) {
            // show losser-eaten menu when the player lost all of it´s three hearts.
            this.showMenu('looser-eaten');
        } else {
            if (this.playerScore >= this.elfScore) {

                // shows the winner menu when the players score is higher than the elf score
                this.showMenu('winner-timeout');
            } else {
                // shows the looser menu the players score is lower than the elf score
                this.showMenu('looser-timeout');
            }
        }
    }

    /**
     * formats given seconds into a readable string
     * @param seconds seconds as a number
     * @returns {string} readable string in the format: 'minutes:seconds'
     */
    formatTime(seconds) {

        // rounds down the seconds to the nearest whole number
        const roundedSeconds = Math.floor(seconds);

        // rounds seconds up to a minute
        const minutes = Math.floor(roundedSeconds / 60);

        // calculates the remaining seconds after it has round up to minutes
        const remainingSeconds = roundedSeconds % 60;

        // Pad single-digit seconds with a leading zero.
        const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

        // Ensures that both minutes and seconds are displayed.
        return minutes + ':' + formattedSeconds;
    }

    /**
     * Updates the game while the game is running. Called by gsap at every tick of the main game timeline animation.
     */
    onGameUpdate() {

        // increases the velocity as the game progresses, the velocityScaleOverTime is different depending on the difficulty of the game
        this.globalVelocityScale = 1.0 + this.velocityScaleOverTime * this.gameTimeline.progress();

        //  Updates the state and positions of all game objects (gifts and enemies)
        this.updateGameObjects();

        // Update the position of the elf
        this.moveElf();

        // increases the audio speed of the sound as the game progresses
        this.jinglerock.playbackRate = 0.8 + 0.2 * this.velocityScaleOverTime * this.gameTimeline.progress();

        // counts down the time through the game progress, and displays the time as both minutes and seconds.
        this.gameTimer.innerHTML = this.formatTime(this.maxGameTimeSeconds * (1.0 - this.gameTimeline.progress()));
    }

    /**
     * stops the game when the time has run out. Called by gsap when the main game timeline animation completes.
     */
    onGameComplete() {
        this.stop(STOP_REASON.TIMEOUT);
    }

    /**
     * callback for whenever the player moves the mouse in the browser.
     * @param event
     */
    onMouseMove(event) {
        if (this.isGameRunning) {
            // allows the player to use the mouse movement (movePLayer), but only if the game is running.
            this.movePlayer(event);
        }
    }

    /**
     * gets a random velocity based on min and max velocity and scaled with the current global velocity scale.
     * @returns {Vec2}
     */
    getRandomVelocity() {
        return new Vec2(
            // 50 percent of going either towards the player or the elf on the x-axis
            getRandomDecimalNumber(0.0, 1.0) >= 0.5 ? 1.0 : -1.0,

            // sets a random velocity for the object on the y-axis
            getRandomDecimalNumber(-1.2, 1.2))

            // randomly scale the velocity
            .multiply(getRandomDecimalNumber(this.gameObjectVelocityMin, this.gameObjectVelocityMax))

            // also scale by the global scale for changing velocity during game progress
            .multiply(this.globalVelocityScale);
    }

    /**
     * creates a new game object (gift or enemy), sets a random velocity and direction and adds it to the container.
     * @param isEnemy true if the game object should be an enemy otherwise a gift.
     */
    createGameObject(isEnemy) {

        // random type of game object
        let gameObjectType;
        if (!isEnemy) {
            // Sets the type to a gift
            gameObjectType = GIFT_TYPES[this.nextGiftType]

            // loop over gift types starting from beginning to the end using the modula operator to never exceed the array size
            this.nextGiftType = (this.nextGiftType + 1) % GIFT_TYPES.length;
        } else {
            // Sets the type to an enemy
            gameObjectType = ENEMY_TYPES[this.nextEnemyType]
            // loop over enemy types starting from beginning to the end using modula operator to never exceed the array size
            this.nextEnemyType = (this.nextEnemyType + 1) % ENEMY_TYPES.length;
        }

        // create new element
        const gameObjectElement = document.createElement('img');

        // add a src to the img attribute
        gameObjectElement.src = gameObjectType.src;

        // adds an alt tag to the img equal to the name added to the specific src
        gameObjectElement.alt = gameObjectType.name;

        //adds a class to the img with the classname gameObject
        gameObjectElement.classList.add('gameObject');

        // creates a new instance off the GameObjectData class
        gameObjectElement.gameData = new GameObjectData(
            //  starting position set to center of container
            this.getRectCenter(this.container.getBoundingClientRect()),

            // starting velocity
            this.getRandomVelocity(),
            true,
            isEnemy
        );

        // add a style with the position to absolute to the gameObjectElement
        gameObjectElement.style.position = 'absolute';
        // sets the origin point from top-left to center
        gameObjectElement.style.transform = `translate(-50%, -50%) translate(${gameObjectElement.gameData.position.x}px, ${gameObjectElement.gameData.position.y}px)`;

        // add to container
        this.container.appendChild(gameObjectElement);

        // add to set for easy management
        this.gameObjects.add(gameObjectElement);
    }

    /**
     * finds the position of the gift closes to the element e.g.: The elf
     * @param element
     * @returns {Vec2}
     */
    getClosestGiftPositionInContainer(element) {
        // bottom-right position of the container
        const containerMaxBounds = this.getBottomRightPositionOfElementInContainer(this.container);

        // Top-left position of the element in the container
        const elementPosition = this.getTopLeftPositionOfElementInContainer(element);

        // bottom-right position of the element in the container
        const elementMaxBounds = this.getBottomRightPositionOfElementInContainer(element);

        // adds half the size of the element to the top-left position to get the center position
        const elementCenter = elementPosition.add(elementMaxBounds.subtract(elementPosition).multiply(0.5))

        // define a default game object far to the left, we will try to find a closer one
        let closestGameObject = new Vec2(-10000, containerMaxBounds.y / 2);

        // This loop iterates over each non-enemy (gift) in the gameObject and finds it´s position in the center.
        this.gameObjects.forEach(gameObject => {

                if (!gameObject.gameData.isEnemy) {

                    const gameObjectPosition = this.getTopLeftPositionOfElementInContainer(gameObject);
                    const gameObjectMaxBounds = this.getBottomRightPositionOfElementInContainer(gameObject);
                    // Here we find the center of the game object, the same way we did with the element above
                    const gameObjectCenter = gameObjectPosition.add(gameObjectMaxBounds.subtract(gameObjectPosition).multiply(0.5))

                    if (elementCenter.subtract(gameObjectCenter).length() < elementCenter.subtract(closestGameObject).length()) {
                        closestGameObject = gameObjectCenter;
                    }
                }
            }
        )

        return closestGameObject;
    }

    /**
     * Moves the player up or down
     * @param event
     */
    movePlayer(event) {
        // Retrieves the size and position og the container
        const containerRect = this.container.getBoundingClientRect();

        // Calculate the y coordinates based the mouses position. center the player vertically
        this.playerY = event.clientY - containerRect.top - this.player.offsetHeight / 2;

        //Ensures that the player dos`ent move below the top edge and bottom of the container
        this.playerY = Math.max(Math.min(this.playerY, containerRect.height - this.player.offsetHeight), 0);

        // uses GSAP animation to animate to players position on the y-axis.
        gsap.to(this.player, {y: this.playerY});
    }

    /**
     * moves the elf up or down
     */
    moveElf() {

        // gets position of the elf within the container
        const elfPosition = this.getTopLeftPositionOfElementInContainer(this.elf);

        // gets the maximum bounds of the elf within the container
        const elfMaxBounds = this.getBottomRightPositionOfElementInContainer(this.elf);

        // calculates the center off the elf
        const elfCenter = elfPosition.add(elfMaxBounds.subtract(elfPosition).multiply(0.5));

        // retrieves the position of the closest gift element to the elf
        const closestGift = this.getClosestGiftPositionInContainer(this.elf)

        // updates the elf´s y position to move towards the y position of the closest gift.
        this.elfY += (closestGift.y - elfCenter.y) * this.elfSpeed;

        // uses GSAP animation to animate the players position on the y-axis.
        gsap.set(this.elf, {y: this.elfY});
    }

    /**
     * compute if two boxes overlap given top-left and bottom-right coordinates.
     * @param topLeftA top left of box A
     * @param bottomRightA bottom right of box A
     * @param topLeftB top left of box B
     * @param bottomRightB bottom right of box B
     * @returns {boolean} true if the boxes overlap, otherwise false
     */
    doBoxesOverlap(topLeftA, bottomRightA, topLeftB, bottomRightB) {
        return topLeftA.x < bottomRightB.x &&
            bottomRightA.x > topLeftB.x &&
            topLeftA.y < bottomRightB.y &&
            bottomRightA.y > topLeftB.y;
    }

    /**
     * Updates the state of all game objects. Called on every tick while the game is running.
     */
    updateGameObjects() {

        // get scaled positions and bounds
        const containerPositionBottomRight = this.getBottomRightPositionOfElementInContainer(this.container);

        const playerPositionTopLeft = this.getTopLeftPositionOfElementInContainer(this.player);
        const playerPositionBottomRight = this.getBottomRightPositionOfElementInContainer(this.player);

        const elfPositionTopLeft = this.getTopLeftPositionOfElementInContainer(this.elf);
        const elfPositionBottomRight = this.getBottomRightPositionOfElementInContainer(this.elf);


        const tornadoPositionTopLeft = this.getTopLeftPositionOfElementInContainer(this.tornado);
        const tornadoPositionBottomRight = this.getBottomRightPositionOfElementInContainer(this.tornado);

        this.gameObjects.forEach(gameObject => {

            const gameObjectPositionTopLeft = this.getTopLeftPositionOfElementInContainer(gameObject);
            const gameObjectPositionBottomRight = this.getBottomRightPositionOfElementInContainer(gameObject);

            // gameObject collision with tornado
            const gameObjectOverlapsWithTornado = this.doBoxesOverlap(tornadoPositionTopLeft, tornadoPositionBottomRight, gameObjectPositionTopLeft, gameObjectPositionBottomRight);
            if (!gameObject.gameData.ignoreTornado && gameObjectOverlapsWithTornado) {
                gameObject.gameData.velocity = this.getRandomVelocity();
                gameObject.gameData.ignoreTornado = true;
            } else if (!gameObjectOverlapsWithTornado) {
                gameObject.gameData.ignoreTornado = false;
            }

            if (gameObjectOverlapsWithTornado) {
                gameObject.gameData.velocity = gameObject.gameData.velocity.multiply(1.01);
            }

            // gameObject collision with player
            if (this.doBoxesOverlap(playerPositionTopLeft, playerPositionBottomRight, gameObjectPositionTopLeft, gameObjectPositionBottomRight)
            ) {
                if (gameObject.gameData.isEnemy) {
                    this.playerHealth -= 1;
                    this.updatePlayerHealthDisplay();
                    if (this.playerHealth <= 0) {
                        this.grizzly2.play();
                        this.stop(STOP_REASON.PLAYER_HEALTH);
                    } else {
                        this.grizzly1.play();
                    }

                } else {
                    this.playerScore += 1;
                    this.bell.play();
                    this.updateScores(true, false);
                }

                this.removeGameObject(gameObject);
                return;
            }

            // gameObject collision with elf (ignore enemies)
            if (!gameObject.gameData.isEnemy && this.doBoxesOverlap(elfPositionTopLeft, elfPositionBottomRight, gameObjectPositionTopLeft, gameObjectPositionBottomRight)) {
                this.elfScore += 1;
                this.removeGameObject(gameObject);
                this.updateScores(false, true);
                return;
            }


            // bounce back gameObject if it hits left border
            if (gameObjectPositionTopLeft.x <= 0) {
                gameObject.gameData.velocity.x *= -1;
                gameObject.gameData.position.x -= gameObjectPositionTopLeft.x;
            }

            // bounce back gameObject if it hits right border
            if (gameObjectPositionBottomRight.x >= containerPositionBottomRight.x) {
                gameObject.gameData.velocity.x *= -1;
                gameObject.gameData.position.x -= containerPositionBottomRight.x - gameObjectPositionTopLeft.x;
            }

            // bounce back gameObject if it hits top border
            if (gameObjectPositionTopLeft.y <= 0) {
                gameObject.gameData.velocity.y *= -1;
                gameObject.gameData.position.y -= gameObjectPositionTopLeft.y;
            }

            // bounce back gameObject if it hits bottom border
            if (gameObjectPositionBottomRight.y >= containerPositionBottomRight.y) {
                gameObject.gameData.velocity.y *= -1;
                gameObject.gameData.position.y -= containerPositionBottomRight.y - gameObjectPositionTopLeft.y;
            }

            // update gameObject position in unscaled coordinates
            gameObject.gameData.position.x += gameObject.gameData.velocity.x;
            gameObject.gameData.position.y += gameObject.gameData.velocity.y;

            gsap.set(gameObject, {
                x: gameObject.gameData.position.x, y: gameObject.gameData.position.y, duration: 3
            });
        });
    }

    /**
     * Updates the score text for both the player and the elf. Also includes an animation.
     * @param flashPlayer Score of the player
     * @param flashElf Score of the elf
     */
    updateScores(flashPlayer, flashElf) {
        this.playerScoreElement.innerText = `${this.playerScore}`;
        this.elfScoreElement.innerText = `${this.elfScore}`;

        if (flashPlayer) {
            // uses gsap to animate the score text on the x-axis 5 times in half a second, when the player/elf gets a point
            gsap.to(this.playerScoreElement, {
                x: "+=20", // animate to the right
                yoyo: true, // back and forth like a yoyo
                repeat: 5, // how many back and forth
                duration: 0.05, // length of the animation
                ease: "power1.inOut", // smoothing
                onComplete: () => {
                    gsap.to(this.playerScoreElement, {x: 0, duration: 0.05}); // reset position
                }
            });
        }

        if (flashElf) {
            gsap.to(this.elfScoreElement, {
                x: "-=20", // animate to the left
                yoyo: true, // back and forth like a yoyo
                repeat: 5, // how many back and forth
                duration: 0.05, // length of the animation
                ease: "power1.inOut", // smoothing
                onComplete: () => {
                    gsap.to(this.elfScoreElement, {x: 0, duration: 0.05}); // reset position
                }
            });
        }
    }

    /**
     * Updates the visibility of each heart html-element based on current player health
     */
    updatePlayerHealthDisplay() {
        const playerHeartElements = document.getElementsByClassName('player-heart');
        // iterates over each hearth element with the class player-heart
        for (let i = 0; i < playerHeartElements.length; i++) {
            const playerHeartElement = playerHeartElements[i];

            // if the index i is less than this.playerHealth, then the heart should be displayed block (visible)
            if (i < this.playerHealth) {
                playerHeartElement.style.display = 'block';
            }
            // else it sets the display to block (invisible)
            else {
                playerHeartElement.style.display = 'none';
            }
        }
    }

    /**
     * Removes a game object from the container.
     * @param gameObject
     */
    removeGameObject(gameObject) {
        //checks if the game object exists in the gameObject
        if (this.gameObjects.has(gameObject)) {

            // removes the gameObject from the container
            this.container.removeChild(gameObject);

            // removes the gameObject from the gameObject collection
            this.gameObjects.delete(gameObject);
        }
    }

    /**
     * Callback for animating the tornado.
     * Scales the tornado size based on the game progress.
     * Creates new game objects based on settings.
     */
    onTornadoAnimationUpdate() {
        if (!this.isGameRunning) {
            return;
        }

        const progress = this.tornadoAnimation.progress();

        //calculates a scale for the tornado element
        const scale = 1.5 * (1 - Math.abs(progress * 2.0 - 1.0)) + 0.5

        //sets the scale of the tornado element using gsap
        gsap.set("#tornado", {scale: scale});

        const targetGiftCountInPlay = Math.round(this.maximumGameObjectsInPlay * progress);

        let giftCountInPlay = 0;
        let enemyCountInPlay = 0;

        //iterates through each game object and counts how many are gifts and how many are enemies
        this.gameObjects.forEach((gameObject) => {
            if (gameObject.gameData.isEnemy) {
                enemyCountInPlay += 1;
            } else {
                giftCountInPlay += 1;
            }
        });

        // calculates on how many enemies is currently in the game
        const totalCountInPlay = enemyCountInPlay + giftCountInPlay;
        const currentEnemyFraction = totalCountInPlay > 0 ? enemyCountInPlay / totalCountInPlay : 0.5;

        //it checks and then decides whether to create an enemy or a gift, based on the current amount of enemies
        if (this.gameObjects.size < targetGiftCountInPlay) {
            const isEnemy = currentEnemyFraction < this.enemyFraction;
            this.createGameObject(isEnemy);
        }
    }

    /**
     * Starts the tornado animation. Begins creating game objects.
     */
    startTornado() {
        if (!this.isGameRunning) {
            return;
        }

        const currentRotation = gsap.getProperty("#tornado", "rotation");

        // determines whether to rotate clockwise or backwards based on it´s current angle
        const rotationAngleToChange = (currentRotation > 0 ? -1.0 : 1.0)
            * getRandomDecimalNumber(360 * this.tornadoMinimumRounds, 360 * this.tornadoMaximumRounds) * this.globalVelocityScale;

        //using gsap to set the animation, so that the tornado spins 360 degrease, scales op and adds speed
        this.tornadoAnimation = gsap.to('#tornado', {
            rotation: currentRotation + rotationAngleToChange, // how the tornado should rotate
            duration: this.tornadoAnimationDuration, // the length of the animation
            ease: "power1.inOut", // to smooth acceleration and deceleration.
            onUpdate: this.onTornadoAnimationUpdate.bind(this), // updates during the animation
            onComplete: this.startTornado.bind(this) // creating a loop
        });
    }


    /** creates and returns a new vec2 object with the center of the rectangle (half its size)
     *
     * @param rect
     * @returns {Vec2}
     */
    getRectCenter(rect) {
        return new Vec2(
            rect.width / 2, // half the width
            rect.height / 2 // half the height
        );
    }

    /**
     * Gets the position of the element relative to the game container
     * @param elementPositionInWindow
     * @returns {Vec2}
     */
    getRelativePositionInContainer(elementPositionInWindow) {

        // we get the rectangle surrounding the container element
        const containerRect = this.container.getBoundingClientRect();

        //from the rectangle we get the top left position
        const containerPositionInWindow = new Vec2(containerRect.left, containerRect.top);

        // subtracts the container position from the element position to get the element position relative to the container
        return elementPositionInWindow.subtract(containerPositionInWindow);
    }

    /**
     * Gets the upper left coordinates of the element in the game container
     * @param element
     * @returns {Vec2}
     */
    getTopLeftPositionOfElementInContainer(element) {
        const elementRect = element.getBoundingClientRect();
        const elementPositionTopLeft = new Vec2(elementRect.left, elementRect.top);
        return this.getRelativePositionInContainer(elementPositionTopLeft);
    }

    /**
     * Gets the maximum coordinates to the lower right in the game container
     * @param element
     * @returns {Vec2}
     */
    getBottomRightPositionOfElementInContainer(element) {
        const elementRect = element.getBoundingClientRect();
        const elementPositionBottomRight = new Vec2(elementRect.right, elementRect.bottom);
        return this.getRelativePositionInContainer(elementPositionBottomRight);
    }

    /**
     * Displays the menu
     * @param id which section to show ('winner-timeout', 'looser-timeout', 'looser-eaten')
     */
    showMenu(id) {
        // hide all with the class menu-section. using an array for easier iteration
        const menuSection = Array.from(document.getElementsByClassName('menu-section'));

        // iterates through each element and sets it´s display to none, which hides all menu sections.
        menuSection.forEach(tornadoDifficultyElement => {
            tornadoDifficultyElement.style.display = 'none';
        });

        // display one by id
        if (id) {
            document.getElementById(id).style.display = 'block';
        }
    }
}
