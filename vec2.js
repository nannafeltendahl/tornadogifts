export class Vec2 {

    // initialize a new vec2 with x and y coordinates
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // Method to add another vector
    add(vec) {
        return new Vec2(this.x + vec.x, this.y + vec.y);
    }

    // Method to subtract another vector
    subtract(vec) {
        return new Vec2(this.x - vec.x, this.y - vec.y);
    }

    // Method to multiply by a scalar
    multiply(scalar) {
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    // Method to calculate the magnitude of the vector
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}