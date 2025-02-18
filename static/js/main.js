class Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.historyExpression = document.getElementById('historyExpression');
        this.currentExpression = '';
        this.currentMode = 'standard';
        this.isContinuation = false;  // Add this line
        this.previousOperation = ''; // Add this line
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

        // Add click event for history items
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => this.loadHistoryItem(item));
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

    loadHistoryItem(item) {
        const expression = item.querySelector('.expression').textContent;
        const result = item.querySelector('.result').textContent.replace('= ', '');
        
        // Set the current expression to the result for further calculations
        this.currentExpression = result;
        this.updateDisplay();
        
        // Show operation details in modal
        this.showOperationDetails(item);
    }

    showOperationDetails(item) {
        const expression = item.querySelector('.expression').textContent;
        const result = item.querySelector('.result').textContent.replace('= ', '');
        const type = item.querySelector('.info .type').textContent;
        const timestamp = item.querySelector('.info .timestamp').textContent;
        
        // Create and show modal
        this.createDetailsModal(expression, result, type, timestamp);
    }

    createDetailsModal(expression, result, type, timestamp) {
        // Create modal structure
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Operation Details</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detail-section">
                        <div class="operation-header">
                            <div class="operation-expression">${expression}</div>
                            <div class="operation-result">${result}</div>
                            <div class="operation-info">
                                <div><strong>Type:</strong> ${type}</div>
                                <div><strong>Time:</strong> ${timestamp}</div>
                            </div>
                        </div>
                        
                        <div class="operation-steps">
                            <h3>Step by Step</h3>
                            <div class="timeline" id="operation-timeline">
                                <!-- Steps will be populated here -->
                            </div>
                            <div class="tracking-controls">
                                <button class="tracking-btn prev-btn" disabled>Previous Step</button>
                                <button class="tracking-btn next-btn">Next Step</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="preview-section">
                        <h3>Calculator Preview</h3>
                        <div class="preview-calculator">
                            <div class="preview-display" id="preview-display">${expression}</div>
                            <div class="steps-list" id="steps-list">
                                <!-- Step numbers will be shown here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the body
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Close modal when clicking close button or outside
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        });
        
        // Set up tracking steps
        this.setupStepTracking(modal, expression, result);
    }
    
    setupStepTracking(modal, expression, result) {
        const timeline = modal.querySelector('#operation-timeline');
        const stepsList = modal.querySelector('#steps-list');
        const previewDisplay = modal.querySelector('#preview-display');
        const prevBtn = modal.querySelector('.prev-btn');
        const nextBtn = modal.querySelector('.next-btn');
        
        // Generate steps for the expression
        const steps = this.generateOperationSteps(expression, result);
        let currentStep = 0;
        
        // Initial step
        this.updateTimeline(timeline, steps, currentStep);
        this.updateStepsList(stepsList, steps.length, currentStep);
        
        // Set up button handlers
        prevBtn.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                this.updateTimeline(timeline, steps, currentStep);
                this.updateStepsList(stepsList, steps.length, currentStep);
                previewDisplay.textContent = steps[currentStep].expression;
                nextBtn.disabled = false;
                prevBtn.disabled = currentStep === 0;
            }
        });
        
        nextBtn.addEventListener('click', () => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                this.updateTimeline(timeline, steps, currentStep);
                this.updateStepsList(stepsList, steps.length, currentStep);
                previewDisplay.textContent = steps[currentStep].expression;
                prevBtn.disabled = false;
                nextBtn.disabled = currentStep === steps.length - 1;
            }
        });
    }
    
    updateTimeline(timeline, steps, currentStep) {
        timeline.innerHTML = '';
        for (let i = 0; i <= currentStep; i++) {
            const step = steps[i];
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-point"></div>
                <div class="timeline-step">
                    <div class="timeline-expression">${step.explanation}</div>
                    <div class="timeline-result">${step.expression} = ${step.result}</div>
                </div>
            `;
            timeline.appendChild(item);
        }
    }
    
    updateStepsList(stepsList, totalSteps, currentStep) {
        stepsList.innerHTML = '';
        for (let i = 0; i < totalSteps; i++) {
            const item = document.createElement('div');
            item.className = 'step-item';
            item.innerHTML = `
                <div class="step-number">${i + 1}</div>
                <div class="operation-details">Step ${i + 1}${i === currentStep ? ' (Current)' : ''}</div>
            `;
            if (i === currentStep) {
                item.classList.add('active');
            }
            stepsList.appendChild(item);
        }
    }
    
    generateOperationSteps(expression, result) {
        // Parse expression to generate steps
        const steps = [];
        let originalExpression = expression;
        
        // For simple expressions like 2 + 3, just add one step
        if (!expression.includes('(') && expression.split(/[\+\-\*\/]/).length === 2) {
            steps.push({
                expression: expression,
                result: result,
                explanation: 'Calculate the result'
            });
            return steps;
        }
        
        // For more complex expressions, break it down
        // This is a simplified approach - real parsing would be more complex
        
        // Handle parentheses first
        const parenthesisRegex = /\([^()]+\)/g;
        let match;
        let intermediateExpr = expression;
        let step = 1;
        
        while ((match = parenthesisRegex.exec(expression)) !== null) {
            const subExpr = match[0].slice(1, -1); // Remove parentheses
            let subResult;
            try {
                // Simple eval to get sub-result - in production, use a safer evaluation
                subResult = eval(subExpr.replace('×', '*').replace('÷', '/'));
            } catch(e) {
                subResult = 'Error';
            }
            
            steps.push({
                expression: subExpr,
                result: subResult,
                explanation: `Step ${step}: Calculate expression in parentheses`
            });
            
            intermediateExpr = intermediateExpr.replace(match[0], subResult);
            step++;
        }
        
        // Handle remaining operations
        steps.push({
            expression: intermediateExpr,
            result: result,
            explanation: `Step ${step}: Calculate final result`
        });
        
        return steps;
    }

    setupConversionUnits() {
        this.conversionUnits = {
            length: ['m', 'ft', 'cm', 'in'],
            weight: ['kg', 'lb', 'g', 'oz'],
            temperature: ['C', 'F', 'K'],
            time: ['s', 'min', 'hr', 'day'],
            volume: ['l', 'ml', 'gal', 'oz'],
            speed: ['m/s', 'km/h', 'mph', 'ft/s']
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
        // Add operators without extra spaces
        this.currentExpression += operator;
        this.updateDisplay();
    }

    appendFunction(func) {
        // Add function without extra space
        if (func === 'x²') {
            this.currentExpression += '^2';
        } else if (func === 'x³') {
            this.currentExpression += '^3';
        } else if (func === 'xʸ') {
            this.currentExpression += '^';
        } else if (func === '√') {
            this.currentExpression += 'sqrt(';
        } else if (func === 'π') {
            this.currentExpression += 'π';
        } else if (func === 'e') {
            this.currentExpression += 'e';
        } else if (func === '|x|') {
            this.currentExpression += 'abs(';
        } else if (func === 'n!') {
            this.currentExpression += '!';
        } else {
            this.currentExpression += func + '(';
        }
        this.updateDisplay();
    }

    async calculate() {
        try {
            // Prepare data to send, including continuation flag
            const requestData = {
                expression: this.currentExpression,
                type: this.currentMode,
                is_continuation: this.isContinuation,
                previous_operation: this.previousOperation
            };
            
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
    
            const data = await response.json();
            if (data.success) {
                // Save current expression to history expression
                this.historyExpression.textContent = this.currentExpression + ' = ';
                
                if (!this.isContinuation) {
                    // First calculation in a series - save the expression
                    this.previousOperation = this.currentExpression;
                } else {
                    // For continuations, add the current expression to the chain
                    this.previousOperation = this.previousOperation + ' → ' + this.currentExpression;
                }
                
                // Now we're in continuation mode for subsequent calculations
                this.isContinuation = true;
                
                // Update current expression with result for next calculation
                this.currentExpression = data.result.toString();
                this.updateDisplay();
                
                // Reload history without refreshing page
                this.loadHistory();
            } else {
                console.error('Calculation error:', data.error);
                this.display.value = 'Error: ' + data.error;
            }
        } catch (error) {
            console.error('Calculation error:', error);
            this.display.value = 'Error';
        }
    }

    async loadHistory() {
        try {
            const response = await fetch('/get-history');
            const data = await response.json();
            
            const historyList = document.querySelector('.history-list');
            historyList.innerHTML = '';
            
            data.history.forEach(calc => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.dataset.type = calc.type;
                historyItem.innerHTML = `
                    <div class="expression">${calc.expression}</div>
                    <div class="result">= ${calc.result}</div>
                    <div class="info">
                        <span class="type">${calc.type}</span>
                        <span class="timestamp">${calc.timestamp}</span>
                    </div>
                `;
                historyItem.addEventListener('click', () => this.loadHistoryItem(historyItem));
                historyList.prepend(historyItem);
            });
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    clear() {
        this.currentExpression = '';
        this.historyExpression.textContent = '';
        this.isContinuation = false;  // Reset continuation flag on clear
        this.previousOperation = '';  // Reset previous operation
        this.updateDisplay();
    }

    backspace() {
        if (this.currentExpression.length > 0) {
            this.currentExpression = this.currentExpression.slice(0, -1);
            this.updateDisplay();
        }
    }

    updateDisplay() {
        this.display.value = this.currentExpression;
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update UI - activate clicked button
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        // Hide all panels first
        document.getElementById('standard-pad').classList.add('hidden');
        document.getElementById('scientific-pad').classList.add('hidden');
        document.getElementById('conversion-panel').classList.add('hidden');

        // Show only the selected panel
        switch(mode) {
            case 'standard':
                document.getElementById('standard-pad').classList.remove('hidden');
                break;
            case 'scientific':
                document.getElementById('scientific-pad').classList.remove('hidden');
                document.getElementById('standard-pad').classList.remove('hidden'); // Show standard pad with scientific
                break;
            case 'conversion':
                document.getElementById('conversion-panel').classList.remove('hidden');
                break;
        }

        // Clear the display when switching modes
        this.clear();
        
        // Update conversion units if switching to conversion mode
        if (mode === 'conversion') {
            this.updateConversionUnits();
        }
    }

    initializeMode() {
        this.switchMode('standard');
    }
}

// Modify the initialization to set initial mode
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new Calculator();
    calculator.initializeMode(); // Set initial mode
});