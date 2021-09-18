import { enumToList } from "./utils";

export enum Button {
    A = 'A',
    B = 'B',
    X = 'X',
    Y = 'Y',
    LB = 'LB',
    RB = 'RB',
    LT = 'LT',
    RT = 'RT',
    SELECT = 'SELECT',
    BACK = 'BACK',
    START = 'START',
    L3 = 'L3',
    R3 = 'R3',
    UP = 'UP',
    DOWN = 'DOWN',
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
    LEFT_ANALOG_UP='LUP',
    LEFT_ANALOG_RIGHT='LRIGHT',
    LEFT_ANALOG_DOWN='LDOWN',
    LEFT_ANALOG_LEFT='LLEFT',
    RIGHT_ANALOG_UP='RUP',
    RIGHT_ANALOG_RIGHT='RRIGHT',
    RIGHT_ANALOG_DOWN='RDOWN',
    RIGHT_ANALOG_LEFT='RLEFT',
};
export const Buttons = enumToList(Button);

export type AnalogDirectionButton = 
    Button.LEFT_ANALOG_UP |
    Button.LEFT_ANALOG_RIGHT |
    Button.LEFT_ANALOG_DOWN |
    Button.LEFT_ANALOG_LEFT |
    Button.RIGHT_ANALOG_UP |
    Button.RIGHT_ANALOG_RIGHT |
    Button.RIGHT_ANALOG_DOWN |
    Button.RIGHT_ANALOG_LEFT;
export const AnalogDirectionButtons = [
    Button.LEFT_ANALOG_UP,
    Button.LEFT_ANALOG_RIGHT,
    Button.LEFT_ANALOG_DOWN,
    Button.LEFT_ANALOG_LEFT,
    Button.RIGHT_ANALOG_UP,
    Button.RIGHT_ANALOG_RIGHT,
    Button.RIGHT_ANALOG_DOWN,
    Button.RIGHT_ANALOG_LEFT,
];