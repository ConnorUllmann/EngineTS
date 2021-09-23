import { enumToList } from "./utils";

export enum Key {
    BACKSPACE = 'BACKSPACE',
    TAB = 'TAB',
    ENTER = 'ENTER',
    RETURN = 'RETURN',
    SHIFT = 'SHIFT',
    LSHIFT = 'LSHIFT',
    RSHIFT = 'RSHIFT',
    CTRL = 'CTRL',
    LCTRL = 'LCTRL',
    RCTRL = 'RCTRL',
    ALT = 'ALT',
    LALT = 'LALT',
    RALT = 'RALT',
    PAUSE_BREAK = 'PAUSE_BREAK',
    CAPS = 'CAPS',
    ESC = 'ESC',
    SPACE = 'SPACE',
    PAGE_UP = 'PAGE_UP',
    PAGE_DOWN = 'PAGE_DOWN',
    END = 'END',
    HOME = 'HOME',
    LEFT = 'LEFT',
    UP = 'UP',
    RIGHT = 'RIGHT',
    DOWN = 'DOWN',
    INSERT = 'INSERT',
    DELETE = 'DELETE',
    DASH = 'DASH',
    HYPHEN = 'HYPHEN',
    MINUS = 'MINUS',
    UNDERSCORE = 'UNDERSCORE',
    EQUALS = 'EQUALS',
    PLUS = 'PLUS',
    TICK = 'TICK',
    TILDA = 'TILDA',
    ZERO = 'ZERO',
    CLOSE_PAREN = 'CLOSE_PAREN',
    ONE = 'ONE',
    BANG = 'BANG',
    EXCLAMATION_POINT = 'EXCLAMATION_POINT',
    TWO = 'TWO',
    AT = 'AT',
    THREE = 'THREE',
    HASH = 'HASH',
    POUND = 'POUND',
    FOUR = 'FOUR',
    DOLLAR = 'DOLLAR',
    FIVE = 'FIVE',
    PERCENT = 'PERCENT',
    SIX = 'SIX',
    CARET = 'CARET',
    UP_CARET = 'UP_CARET',
    SEVEN = 'SEVEN',
    AMPERSAND = 'AMPERSAND',
    EIGHT = 'EIGHT',
    ASTERISK = 'ASTERISK',
    NINE = 'NINE',
    OPEN_PAREN = 'OPEN_PAREN',
    F1 = 'F1',
    F2 = 'F2',
    F3 = 'F3',
    F4 = 'F4',
    F5 = 'F5',
    F6 = 'F6',
    F7 = 'F7',
    F8 = 'F8',
    F9 = 'F9',
    F10 = 'F10',
    F11 = 'F11',
    F12 = 'F12',
    CONTEXT_MENU = 'CONTEXT_MENU',
    SELECT = 'SELECT',
    NUM_LOCK = 'NUM_LOCK',
    SCROLL_LOCK = 'SCROLL_LOCK',
    NUMPAD_ZERO = 'NUMPAD_ZERO',
    NUMPAD_ONE = 'NUMPAD_ONE',
    NUMPAD_TWO = 'NUMPAD_TWO',
    NUMPAD_THREE = 'NUMPAD_THREE',
    NUMPAD_FOUR = 'NUMPAD_FOUR',
    NUMPAD_FIVE = 'NUMPAD_FIVE',
    NUMPAD_SIX = 'NUMPAD_SIX',
    NUMPAD_SEVEN = 'NUMPAD_SEVEN',
    NUMPAD_EIGHT = 'NUMPAD_EIGHT',
    NUMPAD_NINE = 'NUMPAD_NINE',
    NUMPAD_DIVIDE = 'NUMPAD_DIVIDE',
    NUMPAD_MULTIPLY = 'NUMPAD_MULTIPLY',
    NUMPAD_SUBTRACT = 'NUMPAD_SUBTRACT',
    NUMPAD_ADD = 'NUMPAD_ADD',
    NUMPAD_ENTER = 'NUMPAD_ENTER',
    NUMPAD_DECIMAL = 'NUMPAD_DECIMAL',
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'D',
    E = 'E',
    F = 'F',
    G = 'G',
    H = 'H',
    I = 'I',
    J = 'J',
    K = 'K',
    L = 'L',
    M = 'M',
    N = 'N',
    O = 'O',
    P = 'P',
    Q = 'Q',
    R = 'R',
    S = 'S',
    T = 'T',
    U = 'U',
    V = 'V',
    W = 'W',
    X = 'X',
    Y = 'Y',
    Z = 'Z',
    COMMA = 'COMMA',
    LEFT_CARET = 'LEFT_CARET',
    SEMI_COLON = 'SEMI_COLON',
    COLON = 'COLON',
    PERIOD = 'PERIOD',
    RIGHT_CARET = 'RIGHT_CARET',
    FORWARD_SLASH = 'FORWARD_SLASH',
    QUESTION_MARK = 'QUESTION_MARK',
    OPEN_SQUARE_BRACKET = 'OPEN_SQUARE_BRACKET',
    CLOSE_SQUARE_BRACKET = 'CLOSE_SQUARE_BRACKET',
    OPEN_CURLY_BRACKET = 'OPEN_CURLY_BRACKET',
    CLOSE_CURLY_BRACKET = 'CLOSE_CURLY_BRACKET',
    BACK_SLASH = 'BACK_SLASH',
    DOUBLE_QUOTE = 'DOUBLE_QUOTE',
    SINGLE_QUOTE = 'SINGLE_QUOTE',
    APOSTROPHE = 'APOSTROPHE',
    LEFT_WINDOWS = 'LEFT_WINDOWS',
    RIGHT_WINDOWS = 'RIGHT_WINDOWS',
    BAR = 'BAR',
    PIPE = 'PIPE'
};
export const Keys = enumToList(Key);
export const KeysSet = new Set(Keys);

const KeyCodeByKey: { [key in Key]: number } = {
    [Key.BACKSPACE]: 8,
    [Key.TAB]: 9,
    [Key.ENTER]: 13,
    [Key.RETURN]: 13,
    [Key.NUMPAD_ENTER]: 13,
    [Key.SHIFT]: 16,
    [Key.LSHIFT]: 16,
    [Key.RSHIFT]: 16,
    [Key.CTRL]: 17,
    [Key.LCTRL]: 17,
    [Key.RCTRL]: 17,
    [Key.ALT]: 18,
    [Key.LALT]: 18,
    [Key.RALT]: 18,
    [Key.PAUSE_BREAK]: 19,
    [Key.CAPS]: 20,
    [Key.ESC]: 27,
    [Key.SPACE]: 32,
    [Key.PAGE_UP]: 33,
    [Key.PAGE_DOWN]: 34,
    [Key.END]: 35,
    [Key.HOME]: 36,
    [Key.LEFT]: 37,
    [Key.UP]: 38,
    [Key.RIGHT]: 39,
    [Key.DOWN]: 40,
    [Key.INSERT]: 45,
    [Key.DELETE]: 46,
    [Key.CLOSE_PAREN]: 48,
    [Key.ZERO]: 48,
    [Key.EXCLAMATION_POINT]: 49,
    [Key.BANG]: 49,
    [Key.ONE]: 49,
    [Key.AT]: 50,
    [Key.TWO]: 50,
    [Key.POUND]: 51,
    [Key.HASH]: 51,
    [Key.THREE]: 51,
    [Key.DOLLAR]: 52,
    [Key.FOUR]: 52,
    [Key.PERCENT]: 53,
    [Key.FIVE]: 53,
    [Key.UP_CARET]: 54,
    [Key.CARET]: 54,
    [Key.SIX]: 54,
    [Key.AMPERSAND]: 55,
    [Key.SEVEN]: 55,
    [Key.ASTERISK]: 56,
    [Key.EIGHT]: 56,
    [Key.OPEN_PAREN]: 57,
    [Key.NINE]: 57,
    [Key.A]: 65,
    [Key.B]: 66,
    [Key.C]: 67,
    [Key.D]: 68,
    [Key.E]: 69,
    [Key.F]: 70,
    [Key.G]: 71,
    [Key.H]: 72,
    [Key.I]: 73,
    [Key.J]: 74,
    [Key.K]: 75,
    [Key.L]: 76,
    [Key.M]: 77,
    [Key.N]: 78,
    [Key.O]: 79,
    [Key.P]: 80,
    [Key.Q]: 81,
    [Key.R]: 82,
    [Key.S]: 83,
    [Key.T]: 84,
    [Key.U]: 85,
    [Key.V]: 86,
    [Key.W]: 87,
    [Key.X]: 88,
    [Key.Y]: 89,
    [Key.Z]: 90,
    [Key.LEFT_WINDOWS]: 91,
    [Key.RIGHT_WINDOWS]: 92,
    [Key.SELECT]: 93,
    [Key.CONTEXT_MENU]: 93,
    [Key.NUMPAD_ZERO]: 96,
    [Key.NUMPAD_ONE]: 97,
    [Key.NUMPAD_TWO]: 98,
    [Key.NUMPAD_THREE]: 99,
    [Key.NUMPAD_FOUR]: 100,
    [Key.NUMPAD_FIVE]: 101,
    [Key.NUMPAD_SIX]: 102,
    [Key.NUMPAD_SEVEN]: 103,
    [Key.NUMPAD_EIGHT]: 104,
    [Key.NUMPAD_NINE]: 105,
    [Key.NUMPAD_MULTIPLY]: 106,
    [Key.NUMPAD_ADD]: 107,
    [Key.NUMPAD_SUBTRACT]: 109,
    [Key.NUMPAD_DECIMAL]: 110,
    [Key.NUMPAD_DIVIDE]: 111,
    [Key.F1]: 112,
    [Key.F2]: 113,
    [Key.F3]: 114,
    [Key.F4]: 115,
    [Key.F5]: 116,
    [Key.F6]: 117,
    [Key.F7]: 118,
    [Key.F8]: 119,
    [Key.F9]: 120,
    [Key.F10]: 121,
    [Key.F11]: 122,
    [Key.F12]: 123,
    [Key.NUM_LOCK]: 144,
    [Key.SCROLL_LOCK]: 145,
    [Key.COLON]: 186,
    [Key.SEMI_COLON]: 186,
    [Key.PLUS]: 187,
    [Key.EQUALS]: 187,
    [Key.LEFT_CARET]: 188,
    [Key.COMMA]: 188,
    [Key.UNDERSCORE]: 189,
    [Key.MINUS]: 189,
    [Key.HYPHEN]: 189,
    [Key.DASH]: 189,
    [Key.RIGHT_CARET]: 190,
    [Key.PERIOD]: 190,
    [Key.QUESTION_MARK]: 191,
    [Key.FORWARD_SLASH]: 191,
    [Key.TILDA]: 192,
    [Key.TICK]: 192,
    [Key.OPEN_CURLY_BRACKET]: 219,
    [Key.OPEN_SQUARE_BRACKET]: 219,
    [Key.PIPE]: 220,
    [Key.BAR]: 220,
    [Key.BACK_SLASH]: 220,
    [Key.CLOSE_CURLY_BRACKET]: 221,
    [Key.CLOSE_SQUARE_BRACKET]: 221,
    [Key.APOSTROPHE]: 222,
    [Key.SINGLE_QUOTE]: 222,
    [Key.DOUBLE_QUOTE]: 222,
};
const KeysByKeyCode: { [keyCode: number]: Key[] } = Object.keys(KeyCodeByKey).reduce((acc, key) => {
    const keyCode = KeyCodeByKey[key];
    if(!(keyCode in acc))
        acc[keyCode] = [];
    acc[keyCode].push(key);
    return acc;
}, {} as { [key in Key]: number });

export function KeyCodeForKey(key: Key): { keyCode: number, code?: string } {
    const keyCode = KeyCodeByKey[key];
    switch(key)
    {
        case Key.ENTER:
        case Key.RETURN:
            return { keyCode, code: 'Enter' }
        case Key.NUMPAD_ENTER:
            return { keyCode, code: 'NumpadEnter' };
        case Key.LSHIFT:
            return { keyCode, code: 'ShiftLeft' };
        case Key.RSHIFT:
            return { keyCode, code: 'ShiftRight' };
        case Key.LCTRL:
            return { keyCode, code: 'ControlLeft' };
        case Key.RCTRL:
            return { keyCode, code: 'ControlRight' };
        case Key.LALT:
            return { keyCode, code: 'AltLeft' };
        case Key.RALT:
            return { keyCode, code: 'AltRight' };
        case Key.DELETE:
            return { keyCode, code: 'Delete '};
        default:
            return { keyCode };
    }
}

export function KeysForKeyCode(keyCode: number, code?: string): Key[] {
    const result: Key[] = [];
    switch(keyCode)
    {
        case 13:
            if(code === 'Enter')
                result.push(Key.ENTER, Key.RETURN);
            if(code === 'NumpadEnter')
                result.push(Key.NUMPAD_ENTER);
            break;
        case 16:
            result.push(Key.SHIFT);
            if (code === 'ShiftLeft')
                result.push(Key.LSHIFT);
            else if (code === 'ShiftRight')
                result.push(Key.RSHIFT);
            break;
        case 17:
            result.push(Key.CTRL);
            if (code === 'ControlLeft')
                result.push(Key.LCTRL);
            else if (code === 'ControlRight')
                result.push(Key.RCTRL);
            break;
        case 18:
            result.push(Key.ALT);
            if (code === 'AltLeft')
                result.push(Key.LALT);
            else if (code === 'AltRight')
                result.push(Key.RALT);
            break;
        case 45:
            if (code === 'Numpad0')
                result.push(Key.NUMPAD_ZERO);
            else if(code === 'Insert')
                result.push(Key.INSERT);
            break;
        case 35:
            if (code === 'Numpad1')
                result.push(Key.NUMPAD_ONE);
            else if(code === 'End')
                result.push(Key.END);
            break;
        case 40:
            if (code === 'Numpad2')
                result.push(Key.NUMPAD_TWO);
            else if(code === 'ArrowDown')
                result.push(Key.DOWN);
            break;
        case 34:
            if (code === 'Numpad3')
                result.push(Key.NUMPAD_THREE);
            else if(code === 'PageDown')
                result.push(Key.DOWN);
            break;
        case 37:
            if (code === 'Numpad4')
                result.push(Key.NUMPAD_FOUR);
            else if(code === 'ArrowLeft')
                result.push(Key.LEFT);
            break;
        case 12:
            if (code === 'Numpad5')
                result.push(Key.NUMPAD_FIVE);
            break;
        case 39:
            if (code === 'Numpad6')
                result.push(Key.NUMPAD_SIX);
            else if(code === 'ArrowRight')
                result.push(Key.RIGHT);
            break;
        case 36:
            if (code === 'Numpad7')
                result.push(Key.NUMPAD_SEVEN);
            else if(code === 'Home')
                result.push(Key.HOME);
            break;
        case 38:
            if (code === 'Numpad8')
                result.push(Key.NUMPAD_EIGHT);
            else if(code === 'ArrowUp')
                result.push(Key.UP);
            break;
        case 33:
            if (code === 'Numpad9')
                result.push(Key.NUMPAD_NINE);
            else if(code === 'PageUp')
                result.push(Key.PAGE_UP);
            break;
        case 46:
            if (code === 'NumpadDecimal')
                result.push(Key.NUMPAD_DECIMAL);
            else if (code === 'Delete')
                result.push(Key.DELETE);
            break;
        default:
            result.push(...KeysByKeyCode[keyCode]);
            break;
    }
    return result;
}

export const CharactersByKeyCode: { [key: number]: { lower: string, upper: string } } = {
    [9]: { lower: '\t', upper: '\t' },
    [13]: { lower: '\n', upper: '\n' },
    [32]: { lower: ' ', upper: ' ' },
    [48]: { lower: '0', upper: ')' },
    [49]: { lower: '1', upper: '!' },
    [50]: { lower: '2', upper: '@' },
    [51]: { lower: '3', upper: '#' },
    [52]: { lower: '4', upper: '$' },
    [53]: { lower: '5', upper: '%' },
    [54]: { lower: '6', upper: '^' },
    [55]: { lower: '7', upper: '&' },
    [56]: { lower: '8', upper: '*' },
    [57]: { lower: '9', upper: '(' },
    [65]: { lower: 'a', upper: 'A' },
    [66]: { lower: 'b', upper: 'B' },
    [67]: { lower: 'c', upper: 'C' },
    [68]: { lower: 'd', upper: 'D' },
    [69]: { lower: 'e', upper: 'E' },
    [70]: { lower: 'f', upper: 'F' },
    [71]: { lower: 'g', upper: 'G' },
    [72]: { lower: 'h', upper: 'H' },
    [73]: { lower: 'i', upper: 'I' },
    [74]: { lower: 'j', upper: 'J' },
    [75]: { lower: 'k', upper: 'K' },
    [76]: { lower: 'l', upper: 'L' },
    [77]: { lower: 'm', upper: 'M' },
    [78]: { lower: 'n', upper: 'N' },
    [79]: { lower: 'o', upper: 'O' },
    [80]: { lower: 'p', upper: 'P' },
    [81]: { lower: 'q', upper: 'Q' },
    [82]: { lower: 'r', upper: 'R' },
    [83]: { lower: 's', upper: 'S' },
    [84]: { lower: 't', upper: 'T' },
    [85]: { lower: 'u', upper: 'U' },
    [86]: { lower: 'v', upper: 'V' },
    [87]: { lower: 'w', upper: 'W' },
    [88]: { lower: 'x', upper: 'X' },
    [89]: { lower: 'y', upper: 'Y' },
    [90]: { lower: 'z', upper: 'Z' },
    [96]: { lower: '0', upper: '0' },
    [97]: { lower: '1', upper: '1' },
    [98]: { lower: '2', upper: '2' },
    [99]: { lower: '3', upper: '3' },
    [100]: { lower: '4', upper: '4' },
    [101]: { lower: '5', upper: '5' },
    [102]: { lower: '6', upper: '6' },
    [103]: { lower: '7', upper: '7' },
    [104]: { lower: '8', upper: '8' },
    [105]: { lower: '9', upper: '9' },
    [106]: { lower: '*', upper: '*' },
    [107]: { lower: '+', upper: '+' },
    [109]: { lower: '-', upper: '-' },
    [110]: { lower: '.', upper: '.' },
    [111]: { lower: '/', upper: '/' },
    [186]: { lower: ';', upper: ':' },
    [187]: { lower: '=', upper: '+' },
    [188]: { lower: ',', upper: '<' },
    [189]: { lower: '-', upper: '_' },
    [190]: { lower: '.', upper: '>' },
    [191]: { lower: '/', upper: '?' },
    [192]: { lower: '`', upper: '~' },
    [219]: { lower: '[', upper: '{' },
    [220]: { lower: '\\', upper: '|' },
    [221]: { lower: ']', upper: '}' },
    [222]: { lower: '\'', upper: '"' },
}
