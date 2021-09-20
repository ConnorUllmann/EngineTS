import { KeysForKeyCode } from './keys';

export class Keyboard {
    public readonly down: { [id: string]: boolean } = {};
    public readonly pressed: { [id: string]: boolean } = {};
    public readonly released: { [id: string]: boolean } = {};
    public readonly repeating: { [id: string]: boolean } = {};

    public readonly downKeyCode: { [id: number]: boolean } = {};
    public readonly pressedKeyCode: { [id: number]: boolean }  = {};
    public readonly releasedKeyCode: { [id: number]: boolean }  = {};
    public readonly repeatingKeyCode: { [id: number]: boolean } = {};

    constructor() {}
    
    start() {
        const keyboard = this;
        document.addEventListener("keydown", (e: KeyboardEvent) => {
            keyboard.setKeyDown(e.keyCode, e.code, e.repeat);
        }, false);
        document.addEventListener("keyup", (e: KeyboardEvent) => {
            if(!e.repeat)
                keyboard.setKeyUp(e.keyCode, e.code);
        }, false);

        // Allows keyboard events to be passed into the game when it is inside an <iframe/>
        // e.g. document.getElementById('gameIframe').contentWindow.postMessage('down|16|ShiftLeft', '*')
        window.addEventListener('message', (e: MessageEvent) => {
            const commands = typeof e.data === 'string' ? e.data.split('|') : [];
            const keyCode = !commands[1] || commands[1] === '' ? null : Number(commands[1]);
            const code = !commands[2] || commands[2] === '' ? null : commands[2];
            const repeating = !commands[3] || commands[3] === '' ? false : Boolean(commands[3])
            if(commands[0] === 'down' && keyCode != null && code != null)
                keyboard.setKeyDown(keyCode, code, repeating);
            if(commands[0] === 'up' && keyCode != null && code != null)
                keyboard.setKeyUp(keyCode, code);
        }, false);
    };

    setKeyDown(keyCode: number, code?: string, repeating: boolean=false) {
        const keys = Keyboard.keysForKeyEvent(keyCode, code);

        if(repeating) {
            this.repeatingKeyCode[keyCode] = true;
            for(let i = 0; i < keys.length; i++)
                this.repeating[keys[i]] = true;
            return;
        }

        this.pressedKeyCode[keyCode] = true;
        this.downKeyCode[keyCode] = true;

        for(let i = 0; i < keys.length; i++)
        {
            let key = keys[i];
            this.pressed[key] = true;
            this.down[key] = true;
        }
    };

    setKeyUp(keyCode: number, code?: string) {
        this.releasedKeyCode[keyCode] = true;
        if(this.downKeyCode.hasOwnProperty(keyCode))
            delete this.downKeyCode[keyCode];
        
        const keys = Keyboard.keysForKeyEvent(keyCode, code);
        for(let i = 0; i < keys.length; i++)
        {
            let key = keys[i];
            this.released[key] = true;
            if(this.down.hasOwnProperty(key))
                delete this.down[key];
        }
    };

    update() {
        for(const property in this.pressedKeyCode)
            if(this.pressedKeyCode.hasOwnProperty(property))
                delete this.pressedKeyCode[property];
        
        for(const property in this.pressed)
            if(this.pressed.hasOwnProperty(property))
                delete this.pressed[property];

        for(const property in this.releasedKeyCode)
            if(this.releasedKeyCode.hasOwnProperty(property))
                delete this.releasedKeyCode[property];
            
        for(const property in this.released)
            if(this.released.hasOwnProperty(property))
                delete this.released[property];
        
        for(const property in this.repeating)
            if(this.repeating.hasOwnProperty(property))
                delete this.repeating[property];

        for(const property in this.repeatingKeyCode)
            if(this.repeatingKeyCode.hasOwnProperty(property))
                delete this.repeatingKeyCode[property];
    };

    private static keysForKeyEvent(keyCode: number, code?: string): (string | number)[] {
        const result: (string | number)[] = KeysForKeyCode(keyCode, code);
        result.push(keyCode, String.fromCharCode(keyCode).toLowerCase());
        return result;
    };
}