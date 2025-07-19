// =======================
// MAIN CALCULATOR MANAGER
// =======================
class CalculatorManager {
    constructor() {
        this.calculator = null;
        this.converter = null;
        this.init();
    }

    init() {
        this.setupModeHandlers();
        this.initializeCalculator();
        this.initializeConverter();
        this.setInitialMode();
    }

    setupModeHandlers() {
        const radios = document.querySelectorAll('input[name="calc-type"]');
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) this.switchMode(radio.value);
            });
        });
    }

    switchMode(mode) {
        this.hideAllCalcs();
        this.resetClassicButtons();

        const display = document.getElementById('display');
        const modes = {
            units: () => {
                display?.classList.add('hidden');
                document.getElementById('units-calc')?.classList.remove('hidden');
            },
            classic: () => {
                display?.classList.remove('hidden');
                document.getElementById('classic-calc')?.classList.remove('hidden');
            },
            scientific: () => {
                display?.classList.remove('hidden');
                document.getElementById('scientific-calc')?.classList.remove('hidden');
            },
            binary: () => {
                display?.classList.remove('hidden');
                document.getElementById('classic-calc')?.classList.remove('hidden');
                this.enableBinaryMode();
            }
        };

        (modes[mode] || modes.classic)();
    }

    hideAllCalcs() {
        ['classic-calc', 'scientific-calc', 'units-calc'].forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
        });
    }

    resetClassicButtons() {
        document.querySelectorAll('#classic-calc .btn').forEach(btn => {
            btn.classList.remove('disabled');
            btn.disabled = false;
        });
    }

    enableBinaryMode() {
        const disabledChars = ['2', '3', '4', '5', '6', '7', '8', '9', '.'];
        document.querySelectorAll('#classic-calc .btn').forEach(btn => {
            if (disabledChars.includes(btn.textContent.trim())) {
                btn.classList.add('disabled');
                btn.disabled = true;
            }
        });
    }

    initializeCalculator() {
        const expression = document.getElementById('expression');
        const input = document.getElementById('current-input');
        const cursor = document.getElementById('cursor');

        if (expression && input && cursor) {
            this.calculator = new Calculator(expression, input, cursor);
        }
    }

    initializeConverter() {
        this.converter = new UnitsConverter();
        window.clearAll = () => this.converter.clearAll();
    }

    setInitialMode() {
        const checkedRadio = document.querySelector('input[name="calc-type"]:checked');
        const mode = checkedRadio?.value || 'classic';
        this.switchMode(mode);

        // Show first converter section by default
        document.querySelectorAll('#units-calc .converter-section').forEach((section, index) => {
            section.style.display = index === 0 ? 'block' : 'none';
        });
    }

    // Helper method to check if units mode is active
    isUnitsMode() {
        return document.getElementById('units')?.checked;
    }
}

// =======================
// CALCULATOR CLASS
// =======================
class Calculator {
    constructor(expressionEl, inputEl, cursorEl) {
        this.expressionEl = expressionEl;
        this.inputEl = inputEl;
        this.cursorEl = cursorEl;
        this.clearAll();
        this.bindEvents();
        this.attachClickCursorPositioning();
    }

    // State management
    clearAll() {
        Object.assign(this, {
            expression: '',
            input: '0',
            cursorPos: 1,
            operation: undefined,
            previous: ''
        });
        this.updateDisplay();
    }

    clearEntry() {
        this.input = '0';
        this.cursorPos = 1;
        this.updateDisplay();
    }

    // Input handling
    appendDigit(digit) {
        if (this.input === 'Error') this.clearError();

        const isBinary = this.isBinaryMode();
        if (isBinary && !['0', '1', '00'].includes(digit)) return;

        if (this.input === '0' && digit !== '.' && this.cursorPos === 1) {
            this.input = digit;
            this.cursorPos = digit.length;
        } else {
            if (!isBinary && digit === '.' && this.input.includes('.')) return;
            this.input = this.insertAtCursor(digit);
            this.cursorPos += digit.length;
        }
        this.updateDisplay();
    }

    appendFunction(func) {
        if (this.input === 'Error') this.clearError();

        if (['(', ')'].includes(func)) {
            this.insertParentheses(func);
            return;
        }

        if (func.endsWith('(')) {
            this.insertFunction(func);
        }
    }

    insertParentheses(paren) {
        if (this.input === '0') {
            this.input = paren;
            this.cursorPos = paren.length;
        } else {
            this.input = this.insertAtCursor(paren);
            this.cursorPos += paren.length;
        }
        this.updateDisplay();
    }

    insertFunction(func) {
        const isSimpleNumber = /^-?\d+(\.\d+)?$/.test(this.input.trim());

        if (isSimpleNumber && this.input !== '0') {
            this.input = func + this.input + ')';
            this.cursorPos = this.input.length;
        } else if (this.input === '0') {
            this.input = func;
            this.cursorPos = func.length;
        } else {
            this.input = this.insertAtCursor(func);
            this.cursorPos += func.length;
        }
        this.updateDisplay();
    }

    insertConstant(constant) {
        if (this.input === 'Error') this.clearError();

        const constants = { π: Math.PI, pi: Math.PI, e: Math.E };
        const value = constants[constant];
        if (!value) return;

        const isBinary = this.isBinaryMode();
        const valueStr = isBinary ? Math.floor(value).toString(2) : value.toString();

        if (this.input === '0') {
            this.input = valueStr;
            this.cursorPos = this.input.length;
        } else {
            this.input = this.insertAtCursor(valueStr);
            this.cursorPos += valueStr.length;
        }
        this.updateDisplay();
    }

    toggleSign() {
        if (this.input === '0') return;

        if (this.input.startsWith('-')) {
            this.input = this.input.slice(1);
            this.cursorPos = Math.max(0, this.cursorPos - 1);
        } else {
            this.input = '-' + this.input;
            this.cursorPos++;
        }
        this.updateDisplay();
    }

    // Navigation
    backspace() {
        if (this.cursorPos > 0) {
            this.input = this.input.slice(0, this.cursorPos - 1) + this.input.slice(this.cursorPos);
            this.cursorPos--;
            if (this.input === '' || this.input === '-') {
                this.input = '0';
                this.cursorPos = 1;
            }
            this.updateDisplay();
        }
    }

    moveCursor(direction) {
        if (direction === 'left') {
            this.cursorPos = Math.max(0, this.cursorPos - 1);
        } else {
            this.cursorPos = Math.min(this.input.length, this.cursorPos + 1);
        }
        this.updateDisplay();
    }

    // Operations
    chooseOperation(op) {
        if (this.input === 'Error') this.clearError();

        const constants = ['π', 'pi', 'e'];
        const unaryOps = ['sin', 'cos', 'tan', 'sqrt', 'exp', 'log', 'log10', 'ln', 'factorial'];

        if (constants.includes(op)) {
            this.insertConstant(op);
            return;
        }

        if (unaryOps.includes(op)) {
            this.performUnaryOperation(op);
            return;
        }

        if (!this.input || this.input === '-') return;

        if (this.operation && this.previous !== '') {
            this.expression = `${this.previous} ${op}`;
            this.operation = op;
            this.updateDisplay();
            return;
        }

        this.expression = `${this.input} ${op}`;
        this.operation = op;
        this.previous = this.input;
        this.input = '0';
        this.cursorPos = 1;
        this.updateDisplay();
    }

    performUnaryOperation(op) {
        const isBinary = this.isBinaryMode();
        const curr = isBinary ? parseInt(this.input, 2) : parseFloat(this.input);

        const operations = {
            sin: () => Math.sin(curr * (Math.PI / 180)),
            cos: () => Math.cos(curr * (Math.PI / 180)),
            tan: () => Math.tan(curr * (Math.PI / 180)),
            sqrt: () => Math.sqrt(curr),
            exp: () => Math.exp(curr),
            log: () => Math.log(curr),
            log10: () => Math.log10(curr),
            ln: () => Math.log(curr),
            factorial: () => this.factorial(curr)
        };

        const result = operations[op]?.();
        if (result === undefined) return;

        if (op === 'factorial' && (curr < 0 || !Number.isInteger(curr))) {
            this.setError();
            return;
        }

        if (isNaN(result) || !isFinite(result)) {
            this.setError();
            return;
        }

        this.input = isBinary ? Math.floor(result).toString(2) : result.toString();
        this.cursorPos = this.input.length;
        this.updateDisplay();
    }

    calculate() {
        if (this.hasComplexExpression()) {
            this.evaluateComplexExpression();
        } else {
            this.evaluateBasicOperation();
        }
    }

    hasComplexExpression() {
        const complexIndicators = ['(', 'sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'ln', 'factorial'];
        return complexIndicators.some(indicator => this.input.includes(indicator));
    }

    evaluateComplexExpression() {
        const result = this.evaluateExpression(this.input);

        if (isNaN(result) || !isFinite(result)) {
            this.setError();
            return;
        }

        const isBinary = this.isBinaryMode();
        this.input = isBinary ? Math.floor(result).toString(2) : result.toString();
        this.cursorPos = this.input.length;
        this.resetOperation();
        this.updateDisplay();
    }

    evaluateBasicOperation() {
        if (!this.operation || this.previous === '' || this.input === '-') return;

        const isBinary = this.isBinaryMode();
        const prev = isBinary ? parseInt(this.previous, 2) : parseFloat(this.previous);
        const curr = isBinary ? parseInt(this.input, 2) : parseFloat(this.input);

        const operations = {
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '*': (a, b) => a * b,
            '/': (a, b) => b === 0 ? NaN : a / b,
            '%': (a, b) => a % b,
            '^': (a, b) => Math.pow(a, b),
            '**': (a, b) => Math.pow(a, b)
        };

        const result = operations[this.operation]?.(prev, curr);
        if (result === undefined) return;

        if (isNaN(result) || !isFinite(result)) {
            this.setError();
            return;
        }

        this.expression = `${this.previous} ${this.operation} ${this.input}`;
        this.input = isBinary ? this.formatBinaryResult(result) : result.toString();
        this.cursorPos = this.input.length;
        this.resetOperation();
        this.updateDisplay();
    }

    // Utility methods
    isBinaryMode() {
        return document.getElementById('binary')?.checked;
    }

    isUnitsMode() {
        return document.getElementById('units')?.checked;
    }

    clearError() {
        this.input = '0';
        this.cursorPos = 1;
    }

    setError() {
        this.input = 'Error';
        this.cursorPos = 5;
        this.resetOperation();
    }

    resetOperation() {
        this.operation = undefined;
        this.previous = '';
        this.expression = '';
    }

    insertAtCursor(text) {
        return this.input.slice(0, this.cursorPos) + text + this.input.slice(this.cursorPos);
    }

    formatBinaryResult(result) {
        const binaryResult = Math.floor(result).toString(2);
        const maxInputLength = Math.max(this.previous.length, this.input.length);
        const minBitWidth = Math.max(4, maxInputLength);
        return binaryResult.padStart(minBitWidth, '0');
    }

    factorial(n) {
        if (n < 0 || !Number.isInteger(n)) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    evaluateExpression(expr) {
        try {
            // Replace mathematical functions with JavaScript equivalents
            const replacements = {
                'sin(': 'Math.sin(',
                'cos(': 'Math.cos(',
                'tan(': 'Math.tan(',
                'sqrt(': 'Math.sqrt(',
                'exp(': 'Math.exp(',
                'log(': 'Math.log(',
                'log10(': 'Math.log10(',
                'ln(': 'Math.log(',
                'factorial(': 'this.factorial(',
                'π': 'Math.PI',
                '^': '**'
            };

            Object.entries(replacements).forEach(([find, replace]) => {
                expr = expr.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
            });

            // Convert degrees to radians for trig functions
            expr = expr.replace(/Math\.(sin|cos|tan)\(([^)]+)\)/g, (match, func, angle) => {
                return `Math.${func}((${angle}) * Math.PI / 180)`;
            });

            // Handle factorial function calls
            expr = expr.replace(/this\.factorial\(([^)]+)\)/g, (match, num) => {
                return this.factorial(parseFloat(num));
            });

            return eval(expr);
        } catch (error) {
            return NaN;
        }
    }

    // Display methods
    formatNumber(num) {
        if (num === 'Error' || this.isBinaryMode() || this.hasComplexContent(num)) {
            return num;
        }

        const numValue = parseFloat(num);
        if (isNaN(numValue)) return num;

        if (Number.isInteger(numValue) && Math.abs(numValue) >= 1000) {
            return numValue.toLocaleString();
        }

        return num;
    }

    hasComplexContent(num) {
        const complexIndicators = ['(', 'sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'ln', 'factorial'];
        return complexIndicators.some(indicator => num.includes(indicator));
    }

    updateDisplay() {
        this.expressionEl.textContent = this.expression;
        this.inputEl.textContent = this.formatNumber(this.input);
        this.updateCursorPosition();
    }

    updateCursorPosition() {
        if (!this.cursorEl) return;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '24px Courier New';

        const displayInput = this.formatNumber(this.input);
        const displayCursorPos = this.rawToDisplayPosition(this.cursorPos);
        const textAfterCursor = displayInput.substring(displayCursorPos);
        const textWidth = context.measureText(textAfterCursor).width;

        this.cursorEl.style.right = textWidth + 'px';
        this.cursorEl.style.left = 'auto';
    }

    rawToDisplayPosition(rawPos) {
        if (!this.input || this.isBinaryMode() || this.hasComplexContent(this.input)) {
            return rawPos;
        }

        let commasBeforeCursor = 0;
        const numStr = this.input.replace(/[^0-9.]/g, '');

        if (numStr && !numStr.includes('.') && Math.abs(parseFloat(numStr)) >= 1000) {
            for (let i = 0; i < rawPos && i < numStr.length; i++) {
                const digitsFromRight = numStr.length - i - 1;
                if (digitsFromRight > 0 && digitsFromRight % 3 === 0) {
                    commasBeforeCursor++;
                }
            }
        }

        return rawPos + commasBeforeCursor;
    }

    displayToRawPosition(displayPos) {
        if (!this.input || this.isBinaryMode() || this.hasComplexContent(this.input)) {
            return displayPos;
        }

        let rawPos = 0;
        let currentDisplayPos = 0;

        for (let i = 0; i < this.input.length && currentDisplayPos < displayPos; i++) {
            if (currentDisplayPos === displayPos) break;
            currentDisplayPos++;
            rawPos++;

            const numStr = this.input.replace(/[^0-9.]/g, '');
            if (numStr && !numStr.includes('.') && Math.abs(parseFloat(numStr)) >= 1000) {
                const digitsFromRight = numStr.length - rawPos;
                if (digitsFromRight > 0 && digitsFromRight % 3 === 0 && rawPos < this.input.length) {
                    currentDisplayPos++;
                }
            }
        }

        return Math.min(rawPos, this.input.length);
    }

    attachClickCursorPositioning() {
        this.inputEl.addEventListener('click', (e) => {
            const rect = this.inputEl.getBoundingClientRect();
            const clickX = e.clientX - rect.left;

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            context.font = '24px Courier New';

            const displayInput = this.formatNumber(this.input);
            let bestDisplayPos = 0;
            let minDistance = Infinity;

            for (let i = 0; i <= displayInput.length; i++) {
                const textBeforeCursor = displayInput.substring(0, i);
                const textWidth = context.measureText(textBeforeCursor).width;
                const distance = Math.abs(clickX - textWidth);

                if (distance < minDistance) {
                    minDistance = distance;
                    bestDisplayPos = i;
                }
            }

            this.cursorPos = this.displayToRawPosition(bestDisplayPos);
            this.updateDisplay();
        });
    }

    // Event binding
    bindEvents() {
        // Button events
        const eventMappings = [
            ['[data-number]', 'click', (btn) => this.appendDigit(btn.dataset.number)],
            ['[data-operation]', 'click', (btn) => this.chooseOperation(btn.dataset.operation)],
            ['[data-function]', 'click', (btn) => this.appendFunction(btn.dataset.function)],
            ['[data-constant]', 'click', (btn) => this.insertConstant(btn.dataset.constant)],
            ['[data-equals]', 'click', () => this.calculate()],
            ['[data-all-clear]', 'click', () => this.clearAll()],
            ['[data-clear-entry]', 'click', () => this.clearEntry()],
            ['[data-delete]', 'click', () => this.backspace()],
            ['[data-sign]', 'click', () => this.toggleSign()]
        ];

        eventMappings.forEach(([selector, event, handler]) => {
            document.querySelectorAll(selector).forEach(element => {
                element.addEventListener(event, () => handler(element));
            });
        });

        // Keyboard events - FIXED: Only prevent default when not in units mode
        document.addEventListener('keydown', (e) => {
            // Don't intercept keyboard input when units mode is active
            if (this.isUnitsMode()) {
                return; // Allow normal typing in input fields
            }

            // Don't intercept if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            e.preventDefault();
            this.handleKeyboardInput(e);
        });
    }

    handleKeyboardInput(e) {
        const keyMappings = {
            digit: () => e.key >= '0' && e.key <= '9' && this.appendDigit(e.key),
            decimal: () => e.key === '.' && this.appendDigit('.'),
            parentheses: () => ['(', ')'].includes(e.key) && this.appendFunction(e.key),
            operations: () => ['+', '-', '*', '/', '%', '^'].includes(e.key) && this.chooseOperation(e.key),
            equals: () => ['Enter', '='].includes(e.key) && this.calculate(),
            clear: () => e.key === 'Escape' && this.clearAll(),
            backspace: () => ['Backspace', 'Delete'].includes(e.key) && this.backspace(),
            navigation: () => {
                if (e.key === 'ArrowLeft') this.moveCursor('left');
                if (e.key === 'ArrowRight') this.moveCursor('right');
            }
        };

        Object.values(keyMappings).forEach(handler => handler());
    }
}

// =======================
// UNITS CONVERTER CLASS
// =======================
class UnitsConverter {
    constructor() {
        // console.log('UnitsConverter constructor called!');
        this.rates = {
            length: {
                mm: 0.001, cm: 0.01, dm: 0.1, m: 1, dam: 10, hm: 100, km: 1000,
                in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344
            },
            mass: {
                mg: 0.001, cg: 0.01, dg: 0.1, g: 1, dag: 10, hg: 100, kg: 1000, ton: 1000000,
                gr: 0.06479891, oz: 28.3495, lb: 453.59237, st: 6350.29318,
                tonUS: 907184.74, tonUK: 1016046.91
            },
            volume: {
                ml: 0.001, cl: 0.01, dl: 0.1, l: 1, dal: 10, hl: 100, cubic: 1000,
                drop: 0.00005, "fl oz": 0.0295735, shot: 0.044, cup: 0.237,
                ptUS: 0.473176, ptUk: 0.568261, qtUS: 0.946353, qtUK: 1.13652,
                galUS: 3.78541, galUK: 4.54609
            }
        };
        this.sections = ['length', 'mass', 'temp', 'volume', 'binary'];
        this.init();
    }

    init() {
        // console.log('UnitsConverter init called!')
        this.setupRadioSwitching();
        this.setupConverters();
        this.setupReverseButtons();
        this.setupResetButtons();
    }

    setupRadioSwitching() {
        document.querySelectorAll('input[name="unit-type"]').forEach(radio => {
            radio.addEventListener('change', e => this.showSection(e.target.value));
        });
    }

    setupConverters() {
        ['length', 'mass', 'volume'].forEach(type => this.setupBasicConverter(type));
        this.setupTemperatureConverter();
        this.setupBinaryConverter();
    }

    setupReverseButtons() {
        // Setup reverse buttons using data-type attribute
        document.querySelectorAll('.reverse-btn[data-type]').forEach(btn => {
            const type = btn.dataset.type;
            btn.addEventListener('click', () => this.reverseUnits(type));
        });
    }

    reverseUnits(type) {
        const fromSelect = document.getElementById(`${type}-from`);
        const toSelect = document.getElementById(`${type}-to`);

        // Swap the values
        [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];

        // Trigger conversion based on type
        if (type === 'temp') {
            this.convertTemp();
        } else if (type === 'binary') {
            this.convertBinary();
        } else {
            // For length, mass, volume - trigger the input event
            const inputId = this.getInputId(type);
            const input = document.getElementById(inputId);
            if (input && input.value) {
                input.dispatchEvent(new Event('input'));
            }
        }
    }

    getInputId(type) {
        const inputMap = {
            'length': 'length-input',
            'mass': 'mass-input',
            'volume': 'volume-input'
        };
        return inputMap[type];
    }

    showSection(type) {
        document.querySelectorAll('#units-calc .converter-section').forEach((section, i) => {
            section.style.display = this.sections[i] === type ? 'block' : 'none';
        });
    }

    setupBasicConverter(type) {
        const convert = () => {
            const val = +document.getElementById(`${type}-input`).value;
            const from = document.getElementById(`${type}-from`).value;
            const to = document.getElementById(`${type}-to`).value;

            if (!val) {
                document.getElementById(`${type}-result`).textContent = '0';
                return;
            }

            const result = (val * this.rates[type][from]) / this.rates[type][to];
            document.getElementById(`${type}-result`).textContent = this.formatResult(result);
        };

        [`${type}-input`, `${type}-from`, `${type}-to`].forEach(id => {
            document.getElementById(id)?.addEventListener('input', convert);
        });
    }

    setupTemperatureConverter() {
        const elements = ['temp-input', 'temp-from', 'temp-to'];
        elements.forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.convertTemp());
        });
    }

    setupBinaryConverter() {
        const elements = ['binary-input', 'binary-from', 'binary-to'];
        elements.forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.convertBinary());
        });
    }

    convertTemp() {
        const val = +document.getElementById('temp-input').value;
        const from = document.getElementById('temp-from').value;
        const to = document.getElementById('temp-to').value;

        if (!val && val !== 0) {
            document.getElementById('temp-result').textContent = '0';
            return;
        }

        // Convert to Celsius first
        const toCelsius = {
            C: (temp) => temp,
            F: (temp) => (temp - 32) * 5 / 9,
            K: (temp) => temp - 273.15
        };

        // Convert from Celsius to target
        const fromCelsius = {
            C: (temp) => temp,
            F: (temp) => temp * 9 / 5 + 32,
            K: (temp) => temp + 273.15
        };

        const celsius = toCelsius[from](val);
        const result = fromCelsius[to](celsius);

        document.getElementById('temp-result').textContent = result.toFixed(2);
    }

    convertBinary() {
        const val = document.getElementById('binary-input').value.trim();
        const from = document.getElementById('binary-from').value;
        const to = document.getElementById('binary-to').value;

        if (!val) {
            document.getElementById('binary-result').textContent = '0';
            return;
        }

        try {
            const bases = { bin: 2, dec: 10, hex: 16 };
            const decimal = parseInt(val, bases[from]);
            const result = decimal.toString(bases[to]);
            document.getElementById('binary-result').textContent = to === 'hex' ? result.toUpperCase() : result;
        } catch {
            document.getElementById('binary-result').textContent = 'Error';
        }
    }

    formatResult(val) {
        const absVal = Math.abs(val);
        if (absVal >= 1000000 || (absVal < 0.001 && val !== 0)) {
            return val.toExponential(3);
        }
        return val.toFixed(val % 1 === 0 ? 0 : 3);
    }

    setupResetButtons() {
        // Debug: Check if we can find the buttons
        // console.log('Looking for reset buttons...');
        const resetButtons = document.querySelectorAll('.reset-btn');
        // console.log('Found reset buttons:', resetButtons.length);

        const resetButtonsWithAction = document.querySelectorAll('.reset-btn[data-action="clear"]');
        // console.log('Found reset buttons with data-action:', resetButtonsWithAction.length);

        // Try both approaches
        resetButtons.forEach((btn, index) => {
            // console.log(`Reset button ${index}:`, btn);
            btn.addEventListener('click', () => {
                console.log('Reset button clicked!');
                this.clearAll();
            });
        });
    }

    clearAll() {
        const selectors = [
            '#units-calc input[type="number"]',
            '#units-calc input[type="text"]'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(input => input.value = '');
        });

        document.querySelectorAll('#units-calc [id$="result"]').forEach(span => {
            span.textContent = '0';
        });
    }

}

// =======================
// INITIALIZATION
// =======================
// window.unitsConverter = new UnitsConverter();
document.addEventListener('DOMContentLoaded', () => {
    new CalculatorManager();
    // new UnitsConverter();
});