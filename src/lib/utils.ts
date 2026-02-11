import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toRoman(num: number): string {
    if (num <= 0) return num.toString();
    const roman: [string, number][] = [
        ["M", 1000], ["CM", 900], ["D", 500], ["CD", 400],
        ["C", 100], ["XC", 90], ["L", 50], ["XL", 40],
        ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]
    ];
    let result = "";
    for (const [letter, value] of roman) {
        while (num >= value) {
            result += letter;
            num -= value;
        }
    }
    return result;
}
