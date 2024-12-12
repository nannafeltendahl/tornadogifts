import {Game} from "./game.js";

export const game = new Game();
window.game = game; // make it easily accessible in browser console

// the code sets up an event listeners to start the game with the selected difficulty and it´s data, when the user clicks
document.addEventListener('DOMContentLoaded', (event) => {
    const tornadoDifficultyElements = Array.from(document.getElementsByClassName('tornado-difficulty'));
    tornadoDifficultyElements.forEach(tornadoDifficultyElement => {
        tornadoDifficultyElement.addEventListener('click', event => {
            const difficulty = event.target.getAttribute('data-difficulty');
            onDifficultySelected(difficulty);
        })
    });
});

function onDifficultySelected(difficulty) {
    game.start(difficulty);
}
