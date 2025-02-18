class Calculator {  /// main calculator function 
    constructor() {
        this.display = document.getElementById('display');
        this.historyExpression = document.getElementById('historyExpression');
        this.currentExpression = '';
        this.currentMode = 'standard';
        this.isContinuation = false; 
        this.previousOperation = ''; 
        this.initializeEventListeners();
        this.setupConversionUnits();
    }

    initializeEventListeners() {
        
        document.querySelectorAll('.btn.number').forEach(button => {
            button.addEventListener('click', () => this.appendNumber(button.textContent));
        });
    
        
        document.querySelectorAll('.btn.operator').forEach(button => {
            button.addEventListener('click', () => this.appendOperator(button.textContent));
        });
    
        
        document.querySelectorAll('.btn.function').forEach(button => {
            button.addEventListener('click', () => this.appendFunction(button.textContent));
        });
    
        
        document.querySelector('.btn.equals').addEventListener('click', () => this.calculate());
    
        document.querySelector('.btn.clear').addEventListener('click', () => this.clear());
    
        document.querySelector('.btn.backspace').addEventListener('click', () => this.backspace());
    
        document.querySelectorAll('.mode-btn').forEach(button => {
            button.addEventListener('click', () => this.switchMode(button.dataset.mode));
        });
        
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
    
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.filterHistory(e.target.dataset.type));
        });
    
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => this.loadHistoryItem(item));
        });
    
        const conversionPanel = document.getElementById('conversion-panel');
        if (conversionPanel) {
            document.getElementById('conversion-type').addEventListener('change', () => this.updateConversionUnits());
            
            document.getElementById('convert-button').addEventListener('click', () => this.performConversion());
            
            document.getElementById('from-value').addEventListener('input', () => this.previewConversion());
            document.getElementById('from-unit').addEventListener('change', () => this.previewConversion());
            document.getElementById('to-unit').addEventListener('change', () => this.previewConversion());
        }
    }

    async previewConversion() {
        const value = document.getElementById('from-value').value;
        if (!value) {
            document.getElementById('result').textContent = '';
            return;
        }
    
        const fromUnit = document.getElementById('from-unit').value;
        const toUnit = document.getElementById('to-unit').value;
        const type = document.getElementById('conversion-type').value;
    
        try {
            const result = await this.getConversionResult(value, fromUnit, toUnit, type);
            document.getElementById('result').textContent = result.toFixed(4);
        } catch (error) {
            console.error('Conversion preview error:', error);
            document.getElementById('result').textContent = 'Error';
        }
    }
    
    async getConversionResult(value, fromUnit, toUnit, type) {
        const response = await fetch('/convert-preview', {
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
            return data.result;
        } else {
            throw new Error(data.error || 'Conversion failed');
        }
    }
    
    async performConversion() {
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
                
                this.loadHistory();
            } else {
                console.error('Conversion error:', data.error);
                document.getElementById('result').textContent = 'Error: ' + data.error;
            }
        } catch (error) {
            console.error('Conversion error:', error);
            document.getElementById('result').textContent = 'Error';
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
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.type === type) {
                tab.classList.add('active');
            }
        });

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
        
        this.currentExpression = result;
        this.updateDisplay();
        
        this.showOperationDetails(item);
    }

    showOperationDetails(item) {
        const expression = item.querySelector('.expression').textContent;
        const result = item.querySelector('.result').textContent.replace('= ', '');
        const type = item.querySelector('.info .type').textContent;
        const timestamp = item.querySelector('.info .timestamp').textContent;
        
        this.createDetailsModal(expression, result, type, timestamp);
    }

    createDetailsModal(expression, result, type, timestamp) {
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
                    
                    <div class="export-controls">
                        <button id="export-calculation-btn" class="export-btn">Export Calculation</button>
                        <div id="export-options" class="export-options hidden">
                            <button class="export-option" data-format="pdf">PDF</button>
                            <button class="export-option" data-format="csv">CSV</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => modal.classList.add('active'), 10);
        
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
        
        this.setupStepTracking(modal, expression, result);
        this.setupExportButton(modal, expression, result, type);
    }

    setupExportButton(modal, expression, result, type) {
        const exportBtn = modal.querySelector('#export-calculation-btn');
        const exportOptions = modal.querySelector('#export-options');
        
        exportBtn.addEventListener('click', () => {
            exportOptions.classList.toggle('hidden');
        });
        
        const exportOptionButtons = modal.querySelectorAll('.export-option');
        exportOptionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.exportCalculationDetails(expression, result, type, e.target.dataset.format);
                exportOptions.classList.add('hidden');
            });
        });
    }

    async exportCalculationDetails(expression, result, type, format) {
        try {
            const steps = this.generateOperationSteps(expression, result);
            
            const response = await fetch('/export-calculation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expression: expression,
                    result: result,
                    type: type,
                    steps: steps,
                    format: format
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `calculation_export.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                const error = await response.text();
                console.error(`Export failed: ${error}`);
                alert(`Export failed: ${error}`);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('An error occurred while exporting the calculation.');
        }
    }
    
    setupStepTracking(modal, expression, result) {
        const timeline = modal.querySelector('#operation-timeline');
        const stepsList = modal.querySelector('#steps-list');
        const previewDisplay = modal.querySelector('#preview-display');
        const prevBtn = modal.querySelector('.prev-btn');
        const nextBtn = modal.querySelector('.next-btn');
        
        const steps = this.generateOperationSteps(expression, result);
        let currentStep = 0;
        
        this.updateTimeline(timeline, steps, currentStep);
        this.updateStepsList(stepsList, steps.length, currentStep);
        
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
        if (expression.includes('→')) {
            const steps = [];
            const parts = expression.split(' → ');
            let runningResult;
            
            for (let i = 0; i < parts.length; i++) {
                const currentPart = parts[i];
                
                if (i === 0) {
                    try {
                        runningResult = this.calculateExpression(currentPart);
                        steps.push({
                            expression: currentPart,
                            result: runningResult,
                            explanation: `Step 1: Calculate the initial expression`
                        });
                    } catch (e) {
                        console.error('Error calculating initial expression', e);
                        steps.push({
                            expression: currentPart,
                            result: 'Error',
                            explanation: `Step 1: Calculate the initial expression`
                        });
                        break;
                    }
                } else {
                    if (!isNaN(parseFloat(currentPart)) && 
                        currentPart.trim() === parseFloat(currentPart).toString()) {
                        runningResult = parseFloat(currentPart);
                        continue;
                    }
                    
                    if (/[\+\-\*\/×÷\^]/.test(currentPart)) {
                        try {
                            const modifiedExpr = currentPart
                                .replace(/^[\d\.]+/, runningResult)
                                .replace(/×/g, '*')
                                .replace(/÷/g, '/');
                                
                            runningResult = eval(modifiedExpr);
                            
                            steps.push({
                                expression: `${runningResult} (from ${currentPart})`,
                                result: runningResult,
                                explanation: `Step ${steps.length + 1}: Continue with ${currentPart}`
                            });
                        } catch (e) {
                            console.error('Error in continuation operation', e);
                            steps.push({
                                expression: currentPart,
                                result: 'Error',
                                explanation: `Step ${steps.length + 1}: Error in calculation`
                            });
                            break;
                        }
                    } else {
                        steps.push({
                            expression: currentPart,
                            result: currentPart,
                            explanation: `Step ${steps.length + 1}: Result`
                        });
                    }
                }
            }
            
            if (steps.length > 0 && steps[steps.length - 1].result !== result) {
                steps.push({
                    expression: `Final calculation`,
                    result: result,
                    explanation: `Final result`
                });
            }
            
            return steps;
        } else {
            const steps = [];
            
            if (!expression.includes('(') && expression.split(/[\+\-\*\/×÷]/g).length === 2) {
                steps.push({
                    expression: expression,
                    result: result,
                    explanation: 'Calculate the result'
                });
                return steps;
            }
            
            const parenthesisRegex = /\([^()]+\)/g;
            let match;
            let intermediateExpr = expression;
            let step = 1;
            
            while ((match = parenthesisRegex.exec(expression)) !== null) {
                const subExpr = match[0].slice(1, -1);
                let subResult;
                try {
                    subResult = this.calculateExpression(subExpr);
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
            
            // baki ke operations handle karne keliye
            steps.push({
                expression: intermediateExpr,
                result: result,
                explanation: `Step ${step}: Calculate final result`
            });
            
            return steps;
        }
    }
    
    // Helper method - expression calculation meh help karta hai
    calculateExpression(expr) {
        expr = expr.replace(/×/g, '*').replace(/÷/g, '/');
        
        try {
            return eval(expr);
        } catch (error) {
            console.error('Error calculating expression', expr, error);
            throw error;
        }
    }

    /// relevant dimensions and units define karne keliye
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
        
        document.getElementById('result').textContent = '';
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
        // extra spaces removal keliye...bohut bt hai isme
        this.currentExpression += operator;
        this.updateDisplay();
    }

    appendFunction(func) {
        // Add function without extra space...same bt tha isme bhi
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
                this.historyExpression.textContent = this.currentExpression + ' = ';
                
                if (!this.isContinuation) {
                    this.previousOperation = this.currentExpression;
                } else {
                    this.previousOperation = this.previousOperation + ' → ' + this.currentExpression;
                }
                
                this.isContinuation = true;
                
                // result ke sath curretn expression ko update karne keliye...so that next expression meh pahale ka continuation reh
                this.currentExpression = data.result.toString();
                this.updateDisplay();
                
                // Reload history without refreshing page.....very important for proper dom
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
        this.isContinuation = false;  // false taki continuation flag ko clear kar paye every time the dom is refreshed
        this.previousOperation = '';  // along with the previous one - ye operation ko reset karta hai and creates new segment for history operation
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
        // continuation state reset karta hai when changing state/mode from standard or scientific or conversion mode
        this.isContinuation = false;
        this.previousOperation = '';
        
        this.currentMode = mode;
        
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
                document.getElementById('standard-pad').classList.remove('hidden'); // Show standard pad with scientific calculator
                break;
            case 'conversion':
                document.getElementById('conversion-panel').classList.remove('hidden');
                break;
        }
    
        // Clear the display when switching modes
        this.clear();
        
        if (mode === 'conversion') {
            this.updateConversionUnits();
        }
    }

    initializeMode() {
        this.switchMode('standard');
    }
}

// initialization ko modify kiya to set initial mode
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new Calculator();
    calculator.initializeMode();
});