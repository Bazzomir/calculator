// ===== CALCULATOR STATE =====
let currentInput = '0';
let expression = '';
let cursorPosition = 1;
let isResultDisplayed = false;
let hasCalculated = false;
let shouldResetDisplay = false;
let currentMode = 'classic';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function () {
    initializeCalculator();
    setupEventListeners();
    setupConverters();
    updateDisplay();
});

function initializeCalculator() {
    const radios = document.querySelectorAll('input[name="calc-type"]');
    radios.forEach(radio => {
        radio.addEventListener('change', () => switchCalculator(radio.value));
    });
}

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyboardInput);
}

// ===== CALCULATOR SWITCHING =====
function switchCalculator(mode) {
    currentMode = mode;
    clearAll();

    const calculators = ['classic-calc', 'scientific-calc', 'binary-calc', 'units-calc'];
    calculators.forEach(calc => {
        const element = document.getElementById(calc);
        if (element) element.classList.add('hidden');
    });

    const conversion = document.getElementById('conversion');
    if (conversion) conversion.classList.add('hidden');

    switch (mode) {
        case 'classic':
        case 'scientific':
            showCalculatorMode(mode);
            break;
        case 'binary':
            showBinaryCalculator();
            break;
        case 'units':
            showUnitsCalculator();
            break;
    }
    updateDisplay();
}

function showCalculatorMode(mode) {
    document.getElementById(mode + '-calc').classList.remove('hidden');
    document.getElementById('display').classList.remove('hidden');
}

function showBinaryCalculator() {
    document.getElementById('binary-calc').classList.remove('hidden');
    const conversion = document.getElementById('conversion');
    if (conversion) conversion.classList.remove('hidden');
    document.getElementById('display').classList.remove('hidden');
    updateBinaryConversion();
}

function showUnitsCalculator() {
    document.getElementById('units-calc').classList.remove('hidden');
    document.getElementById('display').classList.add('hidden');
}

// ===== DISPLAY MANAGEMENT =====
function updateDisplay() {
    updateExpressionDisplay();
    updateCurrentInputDisplay();
    updateCursorPosition();

    if (currentMode === 'binary') {
        updateBinaryConversion();
    }
}

function updateExpressionDisplay() {
    const expressionElement = document.getElementById('expression');
    if (expressionElement) {
        // Clean up expression display - remove extra spaces and format properly
        const cleanExpression = expression.replace(/\s+/g, ' ').trim();
        expressionElement.textContent = cleanExpression;
    }
}

function updateCurrentInputDisplay() {
    const currentInputSpan = document.getElementById('current-input');
    if (currentInputSpan) {
        // Ensure we display clean, readable text
        let displayText = currentInput;
        
        // Format numbers with commas for readability (but not for binary or if it contains functions)
        if (currentMode !== 'binary' && !displayText.includes('(') && !displayText.includes('Error') && !isNaN(parseFloat(displayText.replace(/,/g, '')))) {
            const num = parseFloat(displayText.replace(/,/g, ''));
            if (Math.abs(num) >= 1000 && isFinite(num)) {
                displayText = formatNumberWithCommas(displayText);
            }
        }
        
        currentInputSpan.textContent = displayText;
    }
}

function formatNumberWithCommas(numStr) {
    if (numStr.includes('.')) {
        const [integer, decimal] = numStr.split('.');
        const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return formattedInteger + '.' + decimal;
    } else {
        return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

function updateCursorPosition() {
    const cursor = document.getElementById('cursor');
    if (!cursor) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '24px Courier New';

    const textAfterCursor = currentInput.substring(cursorPosition);
    const textWidth = context.measureText(textAfterCursor).width;

    cursor.style.right = textWidth + 'px';
    cursor.style.left = 'auto';
}

function updateBinaryConversion() {
    const decimal = document.getElementById('decimal');
    if (!decimal) return;

    if (currentInput === '' || currentInput === '0') {
        decimal.textContent = '0';
    } else {
        const decimalValue = parseInt(currentInput, 2);
        decimal.textContent = isNaN(decimalValue) ? 'Invalid' : decimalValue;
    }
}

// ===== INPUT HANDLING =====
function appendDigit(digit) {
    if (currentMode === 'binary' && digit !== '0' && digit !== '1') {
        return;
    }

    if (shouldResetDisplay || hasCalculated) {
        resetForNewInput();
    }

    if (digit === '.') {
        if (currentMode === 'binary') return;
        if (currentInput.includes('.')) return;
        insertCharacterAtCursor(digit);
        updateDisplay();
        return;
    }

    if (currentMode === 'binary') {
        insertCharacterAtCursor(digit);
    } else {
        if (currentInput === '0') {
            currentInput = digit;
            cursorPosition = 1;
        } else {
            insertCharacterAtCursor(digit);
        }
    }

    updateDisplay();
}

function insertCharacterAtCursor(char) {
    const beforeCursor = currentInput.substring(0, cursorPosition);
    const afterCursor = currentInput.substring(cursorPosition);
    currentInput = beforeCursor + char + afterCursor;
    cursorPosition++;
}

function deleteCharacterAtCursor() {
    if (hasCalculated) {
        return clearAll();
    }

    if (cursorPosition > 0) {
        const beforeCursor = currentInput.substring(0, cursorPosition - 1);
        const afterCursor = currentInput.substring(cursorPosition);
        currentInput = beforeCursor + afterCursor;
        cursorPosition--;

        if (currentInput === '') {
            currentInput = '0';
            cursorPosition = 1;
        }
    }

    updateDisplay();
}

function resetForNewInput() {
    currentInput = '';
    cursorPosition = 0;
    shouldResetDisplay = false;
    hasCalculated = false;
    isResultDisplayed = false;
}

// ===== OPERATORS =====
function appendOperator(op) {
    if (shouldResetDisplay) shouldResetDisplay = false;

    if (expression && !isNaN(parseFloat(currentInput.replace(/,/g, '')))) {
        calculate();
    }

    const cleanInput = currentInput.replace(/,/g, '');
    expression = cleanInput + ' ' + op + ' ';
    shouldResetDisplay = true;
    updateDisplay();
}

function inputOperator(op) {
    if (hasCalculated) {
        const cleanInput = currentInput.replace(/,/g, '');
        expression = cleanInput + ' ' + op + ' ';
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

    const operators = [' + ', ' - ', ' * ', ' / '];
    const hasOperator = operators.some(operator => expression.endsWith(operator));

    if (hasOperator) {
        expression = expression.slice(0, -3) + ' ' + op + ' ';
        updateDisplay();
        return;
    }

    const cleanInput = currentInput.replace(/,/g, '');
    if (cleanInput !== '' && cleanInput !== '0') {
        if (expression !== '' && !isResultDisplayed) {
            calculate();
        }
        expression = (expression || cleanInput) + ' ' + op + ' ';
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

// ===== CALCULATIONS =====
function calculate() {
    if (!expression && currentMode !== 'scientific') return;

    try {
        let result;

        if (currentMode === 'binary') {
            result = performBinaryCalculation();
            if (result === null) return;
            currentInput = result;
        } else {
            result = performStandardCalculation();
            if (isNaN(result) || !isFinite(result)) {
                throw new Error('Invalid calculation');
            }
            // Format result properly
            currentInput = formatCalculationResult(result);
        }

        expression = '';
        cursorPosition = currentInput.length;
        isResultDisplayed = true;
        hasCalculated = true;
        shouldResetDisplay = true;

        updateDisplay();
    } catch (error) {
        displayError();
    }
}

function formatCalculationResult(result) {
    // Handle very large or very small numbers
    if (Math.abs(result) >= 1e15 || (Math.abs(result) < 1e-6 && result !== 0)) {
        return result.toExponential(6);
    }
    
    // Handle regular numbers
    if (result % 1 === 0) {
        return result.toString();
    } else {
        // Remove trailing zeros from decimals
        return parseFloat(result.toFixed(10)).toString();
    }
}

function performBinaryCalculation() {
    const parts = expression.trim().split(' ');
    if (parts.length !== 3) return null;

    const [left, operator, right] = parts;
    const a = parseInt(left, 2);
    const b = parseInt(currentInput, 2);

    if (isNaN(a) || isNaN(b)) {
        alert('Invalid binary number');
        return null;
    }

    let result;
    switch (operator) {
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '*': result = a * b; break;
        case '/':
            if (b === 0) {
                alert('Cannot divide by zero');
                return null;
            }
            result = Math.floor(a / b);
            break;
        default: return null;
    }

    if (result < 0) {
        alert('Negative results not supported in binary calculator');
        return '0';
    }

    return result.toString(2);
}

function performStandardCalculation() {
    const cleanExpression = expression.replace(/,/g, '');
    const cleanCurrentInput = currentInput.replace(/,/g, '');
    let fullExpression = cleanExpression + cleanCurrentInput;

    // Replace mathematical symbols with JavaScript equivalents
    fullExpression = fullExpression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**');

    // Handle scientific functions properly
    fullExpression = replaceMathFunctions(fullExpression);

    // Handle factorial
    fullExpression = fullExpression.replace(/factorial\(([^)]+)\)/g, (match, num) => {
        return factorial(parseFloat(num));
    });

    // Handle percentage
    fullExpression = fullExpression.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');

    return eval(fullExpression);
}

function replaceMathFunctions(expression) {
    // Replace math functions with proper Math object calls
    const functionMap = {
        'sin(': 'Math.sin(',
        'cos(': 'Math.cos(',
        'tan(': 'Math.tan(',
        'sqrt(': 'Math.sqrt(',
        'log(': 'Math.log10(',
        'ln(': 'Math.log(',
        'exp(': 'Math.exp(',
        'π': Math.PI.toString(),
        'e': Math.E.toString()
    };

    let result = expression;
    for (const [func, replacement] of Object.entries(functionMap)) {
        result = result.replace(new RegExp(func.replace(/[()]/g, '\\$&'), 'g'), replacement);
    }

    return result;
}

function factorial(n) {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity; // Prevent overflow

    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function displayError() {
    currentInput = 'Error';
    expression = '';
    cursorPosition = 5;
    isResultDisplayed = true;
    hasCalculated = true;
    updateDisplay();
}

// ===== CLEAR FUNCTIONS =====
function clearAll() {
    currentInput = '0';
    expression = '';
    cursorPosition = 1;
    isResultDisplayed = false;
    hasCalculated = false;
    shouldResetDisplay = false;
    updateDisplay();
}

function clearEntry() {
    currentInput = '0';
    cursorPosition = 1;
    hasCalculated = false;
    updateDisplay();
}

function backspace() {
    deleteCharacterAtCursor();
}

// ===== SCIENTIFIC FUNCTIONS =====
function inputFunction(func) {
    if (shouldResetDisplay || isResultDisplayed) {
        resetForNewInput();
    }

    // Clean function input
    let functionString = func;
    if (!functionString.endsWith('(')) {
        functionString += '(';
    }

    if (currentInput === '0') {
        currentInput = functionString;
        cursorPosition = currentInput.length;
    } else {
        insertCharacterAtCursor(functionString);
    }

    updateDisplay();
}

function inputConstant(constant) {
    if (shouldResetDisplay || isResultDisplayed) {
        resetForNewInput();
    }
    
    let value;
    switch(constant) {
        case 'π':
            value = Math.PI.toString();
            break;
        case 'e':
            value = Math.E.toString();
            break;
        default:
            value = constant;
    }
    
    currentInput = value;
    cursorPosition = value.length;
    updateDisplay();
}

// ===== KEYBOARD SUPPORT =====
function handleKeyboardInput(event) {
    const selectedCalc = document.querySelector('input[name="calc-type"]:checked')?.value;
    if (!selectedCalc) return;

    if (['classic', 'scientific', 'binary'].includes(selectedCalc)) {
        event.preventDefault();
        handleCalculatorKeys(event, selectedCalc);
    }
}

function handleCalculatorKeys(event, calcType) {
    const key = event.key;

    if (key >= '0' && key <= '9') {
        appendDigit(key);
    }
    else if (key === '.' && calcType !== 'binary') {
        appendDigit('.');
    }
    else if (key === '+') {
        appendOperator('+');
    }
    else if (key === '-') {
        appendOperator('-');
    }
    else if (key === '*') {
        appendOperator('*');
    }
    else if (key === '/') {
        appendOperator('/');
    }
    else if (key === '%' && calcType !== 'binary') {
        appendOperator('%');
    }
    else if (key === '(' && calcType === 'scientific') {
        insertCharacterAtCursor('(');
        updateDisplay();
    }
    else if (key === ')' && calcType === 'scientific') {
        insertCharacterAtCursor(')');
        updateDisplay();
    }
    else if (key === 'Enter' || key === '=') {
        calculate();
    }
    else if (key === 'Escape') {
        clearAll();
    }
    else if (key === 'Delete') {
        clearEntry();
    }
    else if (key === 'Backspace') {
        backspace();
    }
    else if (key === 'ArrowLeft') {
        moveCursorLeft();
    }
    else if (key === 'ArrowRight') {
        moveCursorRight();
    }
}

function moveCursorLeft() {
    if (cursorPosition > 0) {
        cursorPosition--;
        updateDisplay();
    }
}

function moveCursorRight() {
    if (cursorPosition < currentInput.length) {
        cursorPosition++;
        updateDisplay();
    }
}

// ===== UNIT CONVERSIONS =====
const CONVERSIONS = {
    length: {
        mm: 1, cm: 10, m: 1000, km: 1000000,
        in: 25.4, ft: 304.8, yd: 914.4, mi: 1609344
    },
    weight: {
        mg: 1, g: 1000, kg: 1000000,
        oz: 28349.5, lb: 453592, ton: 1000000000
    }
};

function setupConverters() {
    setupConverter('length', CONVERSIONS.length);
    setupConverter('weight', CONVERSIONS.weight);
    setupTemperatureConverter();
    setupBinaryConverter();
    addResetButtons();
}

function setupConverter(type, conversions) {
    const input = document.getElementById(`${type}-input`);
    const from = document.getElementById(`${type}-from`);
    const to = document.getElementById(`${type}-to`);
    const result = document.getElementById(`${type}-result`);

    if (!input || !from || !to || !result) return;

    function convert() {
        const value = parseFloat(input.value);
        if (isNaN(value) || input.value === '') {
            result.textContent = '0';
            return;
        }

        const converted = (value * conversions[from.value]) / conversions[to.value];
        result.textContent = formatResult(converted);
    }

    [input, from, to].forEach(element => {
        element.addEventListener('input', convert);
        element.addEventListener('change', convert);
    });
}

function setupTemperatureConverter() {
    const elements = ['temp-input', 'temp-from', 'temp-to'].map(id =>
        document.getElementById(id)
    ).filter(Boolean);

    elements.forEach(element => {
        element.addEventListener('input', convertTemperature);
        element.addEventListener('change', convertTemperature);
    });
}

function convertTemperature() {
    const input = document.getElementById('temp-input');
    const from = document.getElementById('temp-from');
    const to = document.getElementById('temp-to');
    const result = document.getElementById('temp-result');

    if (!input || !from || !to || !result) return;

    const value = parseFloat(input.value);
    if (isNaN(value) || input.value === '') {
        result.textContent = '0';
        return;
    }

    let celsius;
    switch (from.value) {
        case 'F': celsius = (value - 32) * 5 / 9; break;
        case 'K': celsius = value - 273.15; break;
        default: celsius = value; break;
    }

    let finalResult;
    switch (to.value) {
        case 'F': finalResult = celsius * 9 / 5 + 32; break;
        case 'K': finalResult = celsius + 273.15; break;
        default: finalResult = celsius; break;
    }

    result.textContent = finalResult.toFixed(2);
}

function setupBinaryConverter() {
    const input = document.getElementById('binary-input');
    const from = document.getElementById('binary-from');
    const to = document.getElementById('binary-to');
    const result = document.getElementById('binary-result');

    if (!input || !from || !to || !result) return;

    function convertBinary() {
        const value = input.value.trim();
        if (value === '') {
            result.textContent = '0';
            return;
        }

        try {
            let decimalValue;

            if (from.value === 'binary') {
                if (!/^[01]+$/.test(value)) {
                    result.textContent = 'Invalid';
                    return;
                }
                decimalValue = parseInt(value, 2);
            } else {
                decimalValue = parseInt(value);
                if (isNaN(decimalValue) || decimalValue < 0) {
                    result.textContent = 'Invalid';
                    return;
                }
            }

            if (to.value === 'binary') {
                result.textContent = decimalValue.toString(2);
            } else {
                result.textContent = decimalValue.toString();
            }
        } catch (error) {
            result.textContent = 'Invalid';
        }
    }

    [input, from, to].forEach(element => {
        element.addEventListener('input', convertBinary);
        element.addEventListener('change', convertBinary);
    });
}

function addResetButtons() {
    const resetButtons = document.querySelectorAll('.reset-btn');

    resetButtons.forEach(button => {
        const container = button.closest('.converter-section') || button.parentElement;
        let converterType = '';

        if (container.querySelector('#length-input')) {
            converterType = 'length';
        } else if (container.querySelector('#weight-input')) {
            converterType = 'weight';
        } else if (container.querySelector('#temp-input')) {
            converterType = 'temp';
        } else if (container.querySelector('#binary-input')) {
            converterType = 'binary';
        }

        if (converterType) {
            button.addEventListener('click', () => resetConverter(converterType));
        }
    });
}

function resetConverter(type) {
    const input = document.getElementById(`${type}-input`);
    const result = document.getElementById(`${type}-result`);

    if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
    }

    if (result) {
        result.textContent = '0';
    }
}

function formatResult(number) {
    return parseFloat(number.toFixed(6)).toString();
}

// Reset functions for converters
function resetLengthConverter() {
    resetConverter('length');
}

function resetWeightConverter() {
    resetConverter('weight');
}

function resetTempConverter() {
    resetConverter('temp');
}

function resetBinaryConverter() {
    resetConverter('binary');
}

// ===== INITIALIZATION =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        initializeCalculator();
        setupEventListeners();
        setupConverters();
        updateDisplay();
    });
} else {
    initializeCalculator();
    setupEventListeners();
    setupConverters();
    updateDisplay();
}