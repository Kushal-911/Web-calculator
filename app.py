from flask import Flask, render_template, request, jsonify, send_file
from database import db, Calculation
import calculator
from config import Config
import tempfile
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from pathlib import Path

Path('instance').mkdir(exist_ok=True)

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
    calc_type = data.get('type', 'standard')  # get the selected mode
    is_continuation = data.get('is_continuation', False)
    previous_operation = data.get('previous_operation', '')
    
    try:
        # scientific expressions this karna by removing extra spaces
        if calc_type == 'scientific':
            expression = expression.replace('( ', '(').replace(' )', ')')
        
        # setting the current calcualtor to make sure that that standard is applied for the hsitory
        result = calculator.evaluate(expression, calc_type)
        
        if is_continuation and previous_operation:
            latest_calc = Calculation.query.filter_by(type=calc_type).order_by(Calculation.timestamp.desc()).first()
            if latest_calc:
                new_expression = previous_operation + ' → ' + expression
                latest_calc.expression = new_expression
                latest_calc.result = str(result)
                latest_calc.timestamp = datetime.utcnow()
                db.session.commit()
            else:
                # nothing much just a error handling where if you can not find a previous calculation then perform the calculation.
                calc = Calculation(expression=expression, result=str(result), type=calc_type)
                db.session.add(calc)
                db.session.commit()
        else:
            # Save to history as a new entry - calc_type ko use karke fetch karna
            calc = Calculation(expression=expression, result=str(result), type=calc_type)
            db.session.add(calc)
            db.session.commit()
        
        return jsonify({'result': result, 'success': True})
    except Exception as e:
        print(f"Calculation error: {str(e)}")  # error handling here
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
    
@app.route('/convert-preview', methods=['POST'])
def convert_preview():
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
    
    


@app.route('/clear-history', methods=['POST'])
def clear_history():
    try:
        Calculation.query.delete()
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/export-calculation', methods=['POST'])
def export_calculation():
    data = request.json
    format = data.get('format', 'pdf')
    expression = data.get('expression', '')
    result = data.get('result', '')
    calc_type = data.get('type', 'standard')
    steps = data.get('steps', [])
    
    # If steps weren't provided directly, generate them
    if not steps:
        steps = generate_calculation_steps(expression, result) ##### For future scope and purposes
    
    if format == 'pdf':
        return export_as_pdf(expression, result, steps, calc_type)
    else:
        return export_as_csv(expression, result, steps, calc_type)

def export_as_pdf(expression, result, steps, calc_type):
    temp_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
    temp_filename = temp_file.name
    temp_file.close()
    
    doc = SimpleDocTemplate(
        temp_filename,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    elements = []
    styles = getSampleStyleSheet()
    
    title = Paragraph(f"<b>Calculation Export</b>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    elements.append(Paragraph(f"<b>Type:</b> {calc_type.capitalize()}", styles['Normal']))
    elements.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    elements.append(Spacer(1, 24))
    
    elements.append(Paragraph("<b>Expression:</b>", styles['Heading2']))
    elements.append(Paragraph(expression, styles['Normal']))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("<b>Final Result:</b>", styles['Heading2']))
    elements.append(Paragraph(str(result), styles['Normal']))
    elements.append(Spacer(1, 24))
    
    # steps of calculation
    elements.append(Paragraph("<b>Calculation Steps:</b>", styles['Heading2']))
    elements.append(Spacer(1, 12))
    
    # steps arranged in table
    table_data = [['Step', 'Explanation', 'Expression', 'Result']]
    for step in steps:
        table_data.append([
            str(step.get('step', '-')), 
            step.get('explanation', '-'), 
            step.get('expression', '-'), 
            str(step.get('result', '-'))
        ])
    
    table = Table(table_data, colWidths=[40, 150, 170, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 24))
    
    elements.append(Spacer(1, 36))
    elements.append(Paragraph("Generated by Kushal's Calculator", styles['Normal']))
    
    # builds the pdf in the right place
    doc.build(elements)
    
    # pdf ko export karta hai in right format
    return send_file(
        temp_filename,
        as_attachment=True,
        download_name='calculation_export.pdf',
        mimetype='application/pdf'
    )


## the csv code is a bit faulty (will be fixed in the future)
def export_as_csv(expression, result, steps, calc_type):
    # ek temporary file banata hai for every history entry
    temp_file = tempfile.NamedTemporaryFile(suffix='.csv', delete=False)
    temp_filename = temp_file.name
    temp_file.close()
    
    # Write CSV data
    with open(temp_filename, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        
        # Metadata
        writer.writerow(['Calculation Export'])
        writer.writerow(['Type', calc_type.capitalize()])
        writer.writerow(['Date', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow([])
        
        writer.writerow(['Expression', expression])
        writer.writerow(['Final Result', result])
        writer.writerow([])
        
        # Steps identified by the expression container
        writer.writerow(['Step', 'Explanation', 'Expression', 'Result'])
        for step in steps:
            writer.writerow([
                step.get('step', '-'),
                step.get('explanation', '-'),
                step.get('expression', '-'),
                step.get('result', '-')
            ])
    
    return send_file(
        temp_filename,
        as_attachment=True,
        download_name='calculation_export.csv',
        mimetype='text/csv'
    )

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