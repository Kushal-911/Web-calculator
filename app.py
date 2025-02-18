from flask import Flask, render_template, request, jsonify
from database import db, Calculation
import calculator
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    history = Calculation.query.order_by(Calculation.timestamp.desc()).limit(10)
    return render_template('index.html', history=history)

@app.route('/calculate', methods=['POST'])
def calculate():
    from datetime import datetime  # Make sure this import is at the top of your file
    
    data = request.get_json()
    expression = data.get('expression')
    calc_type = data.get('type', 'standard')
    is_continuation = data.get('is_continuation', False)
    previous_operation = data.get('previous_operation', '')
    
    try:
        # Fix scientific expressions by removing extra spaces
        if calc_type == 'scientific':
            expression = expression.replace('( ', '(').replace(' )', ')')
        
        result = calculator.evaluate(expression, calc_type)
        
        # Handle continuous calculations
        if is_continuation and previous_operation:
            # Find the most recent calculation to update
            latest_calc = Calculation.query.filter_by(type=calc_type).order_by(Calculation.timestamp.desc()).first()
            if latest_calc:
                # Update the expression to show continuation
                new_expression = previous_operation + ' → ' + expression
                latest_calc.expression = new_expression
                latest_calc.result = str(result)
                latest_calc.timestamp = datetime.utcnow()
                db.session.commit()
            else:
                # If for some reason we can't find the previous calculation, create a new one
                calc = Calculation(expression=expression, result=str(result), type=calc_type)
                db.session.add(calc)
                db.session.commit()
        else:
            # Save to history as a new entry
            calc = Calculation(expression=expression, result=str(result), type=calc_type)
            db.session.add(calc)
            db.session.commit()
        
        return jsonify({'result': result, 'success': True})
    except Exception as e:
        print(f"Calculation error: {str(e)}")  # Add this for debugging
        return jsonify({'error': str(e), 'success': False})
    
    
        
@app.route('/convert', methods=['POST'])
def convert():
    data = request.get_json()
    value = data.get('value')
    from_unit = data.get('from_unit')
    to_unit = data.get('to_unit')
    conversion_type = data.get('conversion_type')
    
    try:
        result = calculator.convert(value, from_unit, to_unit, conversion_type)
        # Save conversion to history
        expression = f"Convert {value} {from_unit} to {to_unit}"
        calc = Calculation(expression=expression, result=str(result), type='conversion')
        db.session.add(calc)
        db.session.commit()
        return jsonify({'result': result, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False})
    
@app.route('/clear-history', methods=['POST'])
def clear_history():
    try:
        Calculation.query.delete()
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/get-history', methods=['GET'])
def get_history():
    try:
        history = Calculation.query.order_by(Calculation.timestamp.desc()).limit(10)
        history_list = []
        for calc in history:
            history_list.append({
                'expression': calc.expression,
                'result': calc.result,
                'type': calc.type,
                'timestamp': calc.timestamp.strftime('%H:%M:%S')
            })
        return jsonify({'history': history_list, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

if __name__ == '__main__':
    app.run(debug=True)