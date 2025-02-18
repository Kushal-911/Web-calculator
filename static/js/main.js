class Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.currentExpression = '';
        this.currentMode = 'standard';
        this.initializeEventListeners();
        this.setupConversionUnits();
    }

    initializeEventListeners() {
        // Number buttons
        document.querySelectorAll('.btn.number').forEach(button => {
            button.addEventListener('click', () => this.appendNumber(button.textContent));
        });

        // Operator buttons
        document.querySelectorAll('.btn.operator').forEach(button => {
            button.addEventListener('click', () => this.appendOperator(button.textContent));
        });

        // Function buttons
        document.querySelectorAll('.btn.function').forEach(button => {
            button.addEventListener('click', () => this.appendFunction(button.textContent));
        });

        // Equals button
        document.querySelector('.btn.equals').addEventListener('click', () => this.calculate());

        // Clear button
        document.querySelector('.btn.clear').addEventListener('click', () => this.clear());

        // Backspace button
        document.querySelector('.btn.backspace').addEventListener('click', () => this.backspace());

        // Mode switching
        document.querySelectorAll('.mode-btn').forEach(button => {
            button.addEventListener('click', () => this.switchMode(button.dataset.mode));
        });
        // Clear history button
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());

        // History type tabs
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.filterHistory(e.target.dataset.type));
        });

        // Conversion handling
        const conversionPanel = document.getElementById('conversion-panel');
        if (conversionPanel) {
            document.getElementById('conversion-type').addEventListener('change', () => this.updateConversionUnits());
            document.getElementById('from-value').addEventListener('input', () => this.handleConversion());
            document.getElementById('from-unit').addEventListener('change', () => this.handleConversion());
            document.getElementById('to-unit').addEventListener('change', () => this.handleConversion());
        }
    }

    async clearHistory() {
        try {
            const response = await fetch('/clear-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                document.querySelector('.history-list').innerHTML = '';
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    filterHistory(type) {
        // Update active tab
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.type === type) {
                tab.classList.add('active');
            }
        });

        // Filter history items
        document.querySelectorAll('.history-item').forEach(item => {
            if (type === 'all' || item.dataset.type === type) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }


    setupConversionUnits() {
        this.conversionUnits = {
            length: ['m', 'ft', 'cm', 'in'],
            weight: ['kg', 'lb', 'g', 'oz'],
            temperature: ['C', 'F', 'K']
        };
    }

    updateConversionUnits() {
        const type = document.getElementById('conversion-type').value;
        const units = this.conversionUnits[type];
        
        const fromSelect = document.getElementById('from-unit');
        const toSelect = document.getElementById('to-unit');
        
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        
        units.forEach(unit => {
            fromSelect.add(new Option(unit, unit));
            toSelect.add(new Option(unit, unit));
        });
        
        this.handleConversion();
    }

    async handleConversion() {
        const value = document.getElementById('from-value').value;
        if (!value) return;

        const fromUnit = document.getElementById('from-unit').value;
        const toUnit = document.getElementById('to-unit').value;
        const type = document.getElementById('conversion-type').value;

        try {
            const response = await fetch('/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value: value,
                    from_unit: fromUnit,
                    to_unit: toUnit,
                    conversion_type: type
                })
            });

            const data = await response.json();
            if (data.success) {
                document.getElementById('result').textContent = data.result.toFixed(4);
            }
        } catch (error) {
            console.error('Conversion error:', error);
        }
    }

    appendNumber(number) {
        this.currentExpression += number;
        this.updateDisplay();
    }

    appendOperator(operator) {
        this.currentExpression += ` ${operator} `;
        this.updateDisplay();
    }

    appendFunction(func) {
        this.currentExpression += `${func}(`;
        this.updateDisplay();
    }

    

    async calculate() {
        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expression: this.currentExpression,
                    type: this.currentMode
                })
            });

            const data = await response.json();
            if (data.success) {
                this.currentExpression = data.result.toString();
                this.updateDisplay();
                this.updateHistory();
            } else {
                this.display.value = 'Error';
            }
        } catch (error) {
            console.error('Calculation error:', error);
            this.display.value = 'Error';
        }
    }

    updateHistory() {
        // Refresh the history panel - optional if you're using server-side rendering
        location.reload();
    }

    clear() {
        this.currentExpression = '';
        this.updateDisplay();
    }

    backspace() {
        this.currentExpression = this.currentExpression.trim();
        this.currentExpression = this.currentExpression.slice(0, -1);
        this.updateDisplay();
    }

    updateDisplay() {
        this.display.value = this.currentExpression;
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        // Show/hide relevant panels
        document.getElementById('scientific-pad').classList.toggle('hidden', mode !== 'scientific');
        document.getElementById('conversion-panel').classList.toggle('hidden', mode !== 'conversion');
        
        if (mode === 'conversion') {
            this.updateConversionUnits();
        }
    }
}



// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new Calculator();
});