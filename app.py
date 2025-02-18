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
    data = request.get_json()
    expression = data.get('expression')
    calc_type = data.get('type', 'standard')
    
    try:
        result = calculator.evaluate(expression, calc_type)
        # Save to history
        calc = Calculation(expression=expression, result=str(result), type=calc_type)
        db.session.add(calc)
        db.session.commit()
        return jsonify({'result': result, 'success': True})
    except Exception as e:
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
        return jsonify({'result': result, 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False})
    

if __name__ == '__main__':
    app.run(debug=True)