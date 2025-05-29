let currentInput = '0';
let expression = '';
let cursorPosition = 0;
let isResultDisplayed = false;
let hasCalculated = false;

// Calculator switching
document.querySelectorAll('input[name="calc-type"]').forEach(radio => {
    radio.addEventListener('change', switchCalculator);
});

function switchCalculator() {
    const selectedCalc = document.querySelector('input[name="calc-type"]:checked').value;

    // Hide all calculators
    document.getElementById('classic-calc').classList.add('hidden');
    document.getElementById('scientific-calc').classList.add('hidden');
    document.getElementById('binary-calc').classList.add('hidden');
    document.getElementById('units-calc').classList.add('hidden');

    // Show selected calculator
    if (selectedCalc === 'binary' || selectedCalc === 'units') {
        document.getElementById('calc-display').classList.add('hidden');
        document.getElementById(selectedCalc + '-calc').classList.remove('hidden');
    } else {
        document.getElementById('calc-display').classList.remove('hidden');
        document.getElementById(selectedCalc + '-calc').classList.remove('hidden');
        updateDisplay();
    }
}

function updateDisplay() {
    document.getElementById('expression').textContent = expression;
    const currentInputSpan = document.getElementById('current-input');
    const cursor = document.getElementById('cursor');

    currentInputSpan.textContent = currentInput;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '24px Courier New';

    const textAfterCursor = currentInput.substring(cursorPosition);
    const textWidth = context.measureText(textAfterCursor).width;
    cursor.style.right = textWidth + 'px';
    cursor.style.left = 'auto';
}

function inputNumber(num) {
    if (hasCalculated) {
        currentInput = '0';
        expression = '';
        hasCalculated = false;
        isResultDisplayed = false;
    }

    if (currentInput === '0' && num !== '.') {
        currentInput = num;
        cursorPosition = 1;
    } else {
        currentInput = currentInput.slice(0, cursorPosition) + num + currentInput.slice(cursorPosition);
        cursorPosition += num.length;
    }
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

    if (currentInput === '0' && op !== '-') {
        return;
    }

    if (currentInput === '-' && op !== '-') {
        currentInput = '0';
        cursorPosition = 1;
        return;
    }

    if (expression.endsWith(' + ') || expression.endsWith(' - ') ||
        expression.endsWith(' * ') || expression.endsWith(' / ')) {
        expression = expression.slice(0, -3) + ' ' + op + ' ';
        updateDisplay();
        return;
    }

    if (currentInput !== '' && currentInput !== '0') {
        if (expression !== '' && !isResultDisplayed) {
            calculate();
        }
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

function inputFunction(func) {
    if (isResultDisplayed) {
        currentInput = '0';
        expression = '';
        isResultDisplayed = false;
        hasCalculated = false;
    }

    if (currentInput === '0') {
        currentInput = func;
        cursorPosition = func.length;
    } else {
        currentInput = currentInput.slice(0, cursorPosition) + func + currentInput.slice(cursorPosition);
        cursorPosition += func.length;
    }
    updateDisplay();
}

function inputConstant(constant) {
    if (isResultDisplayed) {
        currentInput = '0';
        expression = '';
        isResultDisplayed = false;
        hasCalculated = false;
    }

    let value = constant === 'π' ? Math.PI.toString() : Math.E.toString();

    if (currentInput === '0') {
        currentInput = value;
        cursorPosition = value.length;
    } else {
        currentInput = currentInput.slice(0, cursorPosition) + value + currentInput.slice(cursorPosition);
        cursorPosition += value.length;
    }
    updateDisplay();
}

function calculate() {
    try {
        let fullExpression = expression + currentInput;

        // Replace display operators
        fullExpression = fullExpression.replace(/×/g, '*');
        fullExpression = fullExpression.replace(/\^/g, '**');

        // Handle scientific functions
        fullExpression = fullExpression.replace(/sin\(/g, 'Math.sin(');
        fullExpression = fullExpression.replace(/cos\(/g, 'Math.cos(');
        fullExpression = fullExpression.replace(/tan\(/g, 'Math.tan(');
        fullExpression = fullExpression.replace(/sqrt\(/g, 'Math.sqrt(');
        fullExpression = fullExpression.replace(/log\(/g, 'Math.log10(');
        fullExpression = fullExpression.replace(/log10\(/g, 'Math.log10(');
        fullExpression = fullExpression.replace(/exp\(/g, 'Math.exp(');
        fullExpression = fullExpression.replace(/ln2/g, 'Math.LN2');

        // Handle factorial
        fullExpression = fullExpression.replace(/factorial\(([^)]+)\)/g, (match, num) => {
            return factorial(parseFloat(num));
        });

        // Handle percentage
        fullExpression = fullExpression.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');

        let result = eval(fullExpression);

        if (isNaN(result) || !isFinite(result)) {
            throw new Error('Invalid calculation');
        }

        expression = fullExpression + ' = ';
        currentInput = result.toString();
        cursorPosition = currentInput.length;
        isResultDisplayed = true;
        hasCalculated = true;
        updateDisplay();
    } catch (error) {
        currentInput = 'Error';
        cursorPosition = 5;
        isResultDisplayed = true;
        hasCalculated = true;
        updateDisplay();
    }
}

function factorial(n) {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function clearAll() {
    currentInput = '0';
    expression = '';
    cursorPosition = 1;
    isResultDisplayed = false;
    hasCalculated = false;
    updateDisplay();
}

function clearEntry() {
    currentInput = '0';
    cursorPosition = 1;
    hasCalculated = false;
    updateDisplay();
}

function backspace() {
    if (hasCalculated) {
        clearAll();
        return;
    }

    if (cursorPosition > 0) {
        currentInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition);
        cursorPosition--;
        if (currentInput === '' || currentInput === '-') {
            currentInput = '0';
            cursorPosition = 1;
        }
        updateDisplay();
    }
}

// Keyboard support
document.addEventListener('keydown', function (event) {
    const selectedCalc = document.querySelector('input[name="calc-type"]:checked').value;

    if (selectedCalc === 'classic' || selectedCalc === 'scientific') {
        event.preventDefault();

        if (event.key >= '0' && event.key <= '9') {
            inputNumber(event.key);
        } else if (event.key === '.') {
            inputNumber('.');
        } else if (event.key === '+') {
            inputOperator('+');
        } else if (event.key === '-') {
            inputOperator('-');
        } else if (event.key === '*') {
            inputOperator('*');
        } else if (event.key === '/') {
            inputOperator('/');
        } else if (event.key === '%') {
            inputOperator('%');
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

// Binary calculator
document.getElementById('decimal-input').addEventListener('input', function () {
    const decimal = parseInt(this.value);
    if (!isNaN(decimal)) {
        document.getElementById('binary-input').value = decimal.toString(2);
    } else {
        document.getElementById('binary-input').value = '';
    }
});

document.getElementById('binary-input').addEventListener('input', function () {
    const binary = this.value.replace(/[^01]/g, '');
    this.value = binary;
    if (binary) {
        document.getElementById('decimal-input').value = parseInt(binary, 2);
    } else {
        document.getElementById('decimal-input').value = '';
    }
});

// Unit converters
const lengthConversions = {
    mm: 1,
    cm: 10,
    m: 1000,
    km: 1000000,
    in: 25.4,
    ft: 304.8,
    yd: 914.4,
    mi: 1609344
};

const weightConversions = {
    mg: 1,
    g: 1000,
    kg: 1000000,
    oz: 28349.5,
    lb: 453592,
    ton: 1000000000
};

function setupConverter(type, conversions) {
    const input = document.getElementById(type + '-input');
    const fromSelect = document.getElementById(type + '-from');
    const toSelect = document.getElementById(type + '-to');
    const result = document.getElementById(type + '-result');

    function convert() {
        const value = parseFloat(input.value);
        if (isNaN(value)) {
            result.textContent = '0';
            return;
        }

        const fromUnit = fromSelect.value;
        const toUnit = toSelect.value;

        if (type === 'temp') {
            result.textContent = convertTemperature(value, fromUnit, toUnit).toFixed(2);
        } else {
            const baseValue = value * conversions[fromUnit];
            const convertedValue = baseValue / conversions[toUnit];
            result.textContent = convertedValue.toFixed(6).replace(/\.?0+$/, '');
        }
    }

    input.addEventListener('input', convert);
    fromSelect.addEventListener('change', convert);
    toSelect.addEventListener('change', convert);
}

function convertTemperature(value, from, to) {
    let celsius;

    switch (from) {
        case 'F':
            celsius = (value - 32) * 5 / 9;
            break;
        case 'K':
            celsius = value - 273.15;
            break;
        default:
            celsius = value;
    }

    switch (to) {
        case 'F':
            return celsius * 9 / 5 + 32;
        case 'K':
            return celsius + 273.15;
        default:
            return celsius;
    }
}

setupConverter('length', lengthConversions);
setupConverter('weight', weightConversions);

// Temperature converter
const tempInput = document.getElementById('temp-input');
const tempFrom = document.getElementById('temp-from');
const tempTo = document.getElementById('temp-to');
const tempResult = document.getElementById('temp-result');

function convertTemp() {
    const value = parseFloat(tempInput.value);
    if (isNaN(value)) {
        tempResult.textContent = '0';
        return;
    }
    tempResult.textContent = convertTemperature(value, tempFrom.value, tempTo.value).toFixed(2);
}

tempInput.addEventListener('input', convertTemp);
tempFrom.addEventListener('change', convertTemp);
tempTo.addEventListener('change', convertTemp);

updateDisplay();