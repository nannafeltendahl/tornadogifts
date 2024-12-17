/**
 * object that has both a length and a direction. origin (starting-point) is always (0, 0).
 */
export class Vec2 {
    /**
     * x-coordinate
     */
    x;

    /**
     * y-coordinate
     */
    y;

    /**
     * initialize a new vec2 with x and y coordinates
     * @param x coordinate on the x-axis
     * @param y coordinate on the y-axis
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * adds another vector to this vector and returns the result
     * @param vec the vector to add to this vector
     * @returns {Vec2} returns the to vectors added together
     */
    add(vec) {
        return new Vec2(this.x + vec.x, this.y + vec.y);
    }

    /**
     * subtracts another vector from this vector and returns the result
     * @param vec the vector to subtract from this vector
     * @returns {Vec2} returns this vector minus the given vector
     */
    subtract(vec) {
        return new Vec2(this.x - vec.x, this.y - vec.y);
    }

    /**
     * multiply this vector with a scalar (number)
     * @param scalar a number
     * @returns {Vec2} returns the vector multiplied with the given scalar (vector * scalar)
     */
    multiply(scalar) {
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    /**
     * Method to calculate the length of the vector
     * @returns {number} length of the vector
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}
