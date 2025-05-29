let currentInput = '0';
let expression = '';
let cursorPosition = 0;
let isResultDisplayed = false;
let hasCalculated = false;
let shouldResetDisplay = false;
let currentMode = 'classic';

// Calculator switching
const radios = document.querySelectorAll('input[name="calc-type"]');
radios.forEach(radio => radio.addEventListener('change', () => switchCalculator(radio.value)));

function switchCalculator(mode) {
    currentMode = mode;
    clearAll();

    // Hide all calculators
    document.getElementById('classic-calc').classList.add('hidden');
    document.getElementById('scientific-calc').classList.add('hidden');
    document.getElementById('binary-calc').classList.add('hidden');
    document.getElementById('units-calc').classList.add('hidden');
    document.getElementById('conversion')?.classList.add('hidden');

    // Show selected calculator
    switch (mode) {
        case 'classic':
        case 'scientific':
            document.getElementById(mode + '-calc').classList.remove('hidden');
            document.getElementById('display').classList.remove('hidden');
            break;
        case 'binary':
            document.getElementById('binary-calc').classList.remove('hidden');
            document.getElementById('conversion')?.classList.remove('hidden');
            document.getElementById('display').classList.remove('hidden');
            updateBinaryConversion();
            break;
        case 'units':
            document.getElementById('units-calc').classList.remove('hidden');
            document.getElementById('display').classList.add('hidden');
            break;
    }
    updateDisplay();
}

function updateDisplay() {
    document.getElementById('expression').textContent = expression;
    const currentInputSpan = document.getElementById('current-input');
    const cursor = document.getElementById('cursor');
    currentInputSpan.textContent = currentInput;

    if (cursor) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '24px Courier New';
        const textAfterCursor = currentInput.substring(cursorPosition);
        const textWidth = context.measureText(textAfterCursor).width;
        cursor.style.right = textWidth + 'px';
        cursor.style.left = 'auto';
    }
}

function appendDigit(digit) {
    if (currentMode === 'binary' && digit !== '0' && digit !== '1') return;

    if (shouldResetDisplay || hasCalculated) {
        currentInput = '';
        shouldResetDisplay = false;
        hasCalculated = false;
        isResultDisplayed = false;
    }

    if (currentInput === '0' && digit !== '.') {
        currentInput = digit;
    } else {
        currentInput += digit;
    }

    updateDisplay();
    if (currentMode === 'binary') updateBinaryConversion();
}

function appendOperator(op) {
    if (shouldResetDisplay) shouldResetDisplay = false;

    if (expression && !isNaN(currentInput)) calculate();
    expression = currentInput + ' ' + op + ' ';
    shouldResetDisplay = true;
    updateDisplay();
}

function inputOperator(op) {
    if (hasCalculated) {
        expression = currentInput + ' ' + op + ' ';
        currentInput = '0';
        cursorPosition = 1;
        hasCalculated = false;
        isResultDisplayed = false;
        updateDisplay();
        return;
    }

    if (currentInput === '0' && op !== '-') return;

    if (currentInput === '-' && op !== '-') {
        currentInput = '0';
        cursorPosition = 1;
        return;
    }

    if (expression.endsWith(' + ') || expression.endsWith(' - ') || expression.endsWith(' * ') || expression.endsWith(' / ')) {
        expression = expression.slice(0, -3) + ' ' + op + ' ';
        updateDisplay();
        return;
    }

    if (currentInput !== '' && currentInput !== '0') {
        if (expression !== '' && !isResultDisplayed) calculate();
        expression = (expression || currentInput) + ' ' + op + ' ';
        currentInput = '0';
        cursorPosition = 1;
        isResultDisplayed = false;
        updateDisplay();
    } else if (op === '-' && currentInput === '0') {
        currentInput = '-';
        cursorPosition = 1;
        updateDisplay();
    }
}

function calculate() {
    if (!expression && currentMode !== 'scientific') return;

    try {
        let fullExpression = expression + currentInput;

        fullExpression = fullExpression.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
        fullExpression = fullExpression.replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln2/g, 'Math.LN2')
            .replace(/exp\(/g, 'Math.exp(');

        fullExpression = fullExpression.replace(/factorial\(([^)]+)\)/g, (match, num) => factorial(parseFloat(num)));
        fullExpression = fullExpression.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');

        if (currentMode === 'binary') {
            fullExpression = fullExpression.split(' ').map(part => part.match(/^[01]+$/) ? parseInt(part, 2).toString() : part).join(' ');
        }

        let result = eval(fullExpression);

        if (isNaN(result) || !isFinite(result)) throw new Error('Invalid calculation');

        currentInput = currentMode === 'binary' ? Math.floor(result).toString(2) : result.toString();
        expression = '';
        cursorPosition = currentInput.length;
        isResultDisplayed = true;
        hasCalculated = true;
        shouldResetDisplay = true;
        updateDisplay();
        if (currentMode === 'binary') updateBinaryConversion();
    } catch {
        currentInput = 'Error';
        expression = '';
        cursorPosition = 5;
        isResultDisplayed = true;
        hasCalculated = true;
        updateDisplay();
    }
}

function factorial(n) {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    return Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1);
}

function clearAll() {
    currentInput = '0';
    expression = '';
    cursorPosition = 1;
    isResultDisplayed = false;
    hasCalculated = false;
    shouldResetDisplay = false;
    updateDisplay();
    if (currentMode === 'binary') updateBinaryConversion();
}

function clearEntry() {
    currentInput = '0';
    cursorPosition = 1;
    hasCalculated = false;
    updateDisplay();
    if (currentMode === 'binary') updateBinaryConversion();
}

function backspace() {
    if (hasCalculated) return clearAll();
    currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
    updateDisplay();
    if (currentMode === 'binary') updateBinaryConversion();
}

function inputFunction(func) {
    if (shouldResetDisplay || isResultDisplayed) {
        currentInput = '';
        shouldResetDisplay = false;
        isResultDisplayed = false;
    }
    currentInput += func;
    updateDisplay();
}

function inputConstant(constant) {
    if (shouldResetDisplay || isResultDisplayed) {
        currentInput = '';
        shouldResetDisplay = false;
        isResultDisplayed = false;
    }
    currentInput = (constant === 'π' ? Math.PI : Math.E).toString();
    updateDisplay();
}

function updateBinaryConversion() {
    const binaryValue = currentInput === '0' ? '0' : currentInput;
    document.getElementById('decimal').textContent = binaryValue.match(/^[01]+$/) ? parseInt(binaryValue, 2) : 'Invalid';
}

// Keyboard support
document.addEventListener('keydown', function (event) {
    const selectedCalc = document.querySelector('input[name="calc-type"]:checked').value;

    if (selectedCalc === 'classic' || selectedCalc === 'scientific') {
        event.preventDefault();

        if (event.key >= '0' && event.key <= '9') {
            appendDigit(event.key);
        } else if (event.key === '.') {
            appendDigit('.');
        } else if (event.key === '+') {
            appendOperator('+');
        } else if (event.key === '-') {
            appendOperator('-');
        } else if (event.key === '*') {
            appendOperator('*');
        } else if (event.key === '/') {
            appendOperator('/');
        } else if (event.key === '%') {
            appendOperator('%');
        } else if (event.key === '(' && selectedCalc === 'scientific') {
            inputFunction('(');
        } else if (event.key === ')' && selectedCalc === 'scientific') {
            inputFunction(')');
        } else if (event.key === 'Enter' || event.key === '=') {
            calculate();
        } else if (event.key === 'Escape') {
            clearAll();
        } else if (event.key === 'Delete') {
            clearEntry();
        } else if (event.key === 'Backspace') {
            backspace();
        } else if (event.key === 'ArrowLeft') {
            if (cursorPosition > 0) {
                cursorPosition--;
                updateDisplay();
            }
        } else if (event.key === 'ArrowRight') {
            if (cursorPosition < currentInput.length) {
                cursorPosition++;
                updateDisplay();
            }
        }
    }
});

// Unit Conversions
const lengthConversions = { mm: 1, cm: 10, m: 1000, km: 1000000, in: 25.4, ft: 304.8, yd: 914.4, mi: 1609344 };
const weightConversions = { mg: 1, g: 1000, kg: 1000000, oz: 28349.5, lb: 453592, ton: 1000000000 };

function setupConverter(type, conversions) {
    const input = document.getElementById(`${type}-input`);
    const from = document.getElementById(`${type}-from`);
    const to = document.getElementById(`${type}-to`);
    const result = document.getElementById(`${type}-result`);

    function convert() {
        const value = parseFloat(input.value);
        if (isNaN(value)) return result.textContent = '0';
        const converted = (value * conversions[from.value]) / conversions[to.value];
        result.textContent = converted.toFixed(6).replace(/\.?0+$/, '');
    }

    [input, from, to].forEach(el => {
        el.addEventListener('input', convert);
        el.addEventListener('change', convert);
    });
}

function convertTemperature() {
    const value = parseFloat(document.getElementById('temp-input').value);
    if (isNaN(value)) return document.getElementById('temp-result').textContent = '0';

    const from = document.getElementById('temp-from').value;
    const to = document.getElementById('temp-to').value;

    let c = from === 'F' ? (value - 32) * 5 / 9 : from === 'K' ? value - 273.15 : value;
    let result = to === 'F' ? c * 9 / 5 + 32 : to === 'K' ? c + 273.15 : c;
    document.getElementById('temp-result').textContent = result.toFixed(2);
}

['temp-input', 'temp-from', 'temp-to'].forEach(id => {
    document.getElementById(id).addEventListener('input', convertTemperature);
    document.getElementById(id).addEventListener('change', convertTemperature);
});

setupConverter('length', lengthConversions);
setupConverter('weight', weightConversions);

updateDisplay();
