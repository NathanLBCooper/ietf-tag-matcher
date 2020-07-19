import { expect } from "chai";
import { isNullOrWhitespace } from "./stringUtils";

describe("string utils", () => {
    it("isNullOrWhitespace is false for strings with content", () => {
        const validStrings = [" one", "two", "   three  "];
        for (const str of validStrings) {
            expect(isNullOrWhitespace(str)).false;
        }
    });

    it("isNullOrWhitespace is true for null", () => {
        expect(isNullOrWhitespace(undefined)).true;
        expect(isNullOrWhitespace(null)).true;
    });

    it("isNullOrWhitespace is true for whitespace", () => {
        expect(isNullOrWhitespace("  ")).true;
    });

    it("isNullOrWhitespace is true for empty string", () => {
        expect(isNullOrWhitespace("")).true;
    });

});
