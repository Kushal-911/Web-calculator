import math
import re

def evaluate(expression, calc_type='standard'):
    """Evaluates mathematical expressions"""
    # some specific conventions define karne keliye ye hai
    expression = expression.replace('×', '*').replace('÷', '/')
    
    if calc_type == 'scientific':
        expression = handle_scientific_functions(expression)
    
    # expression validity checking keliye ye hai
    if not is_safe_expression(expression):
        raise ValueError("Invalid expression")
        
    return eval(expression)

def handle_scientific_functions(expr):
    """scientific function names change karke their math module equivalent compatibility meh change karna with math library"""
    replacements = {
        'sin': 'math.sin',
        'cos': 'math.cos',
        'tan': 'math.tan',
        'asin': 'math.asin',
        'acos': 'math.acos',
        'atan': 'math.atan',
        'log': 'math.log10',
        'ln': 'math.log',
        'sqrt': 'math.sqrt',
        '√': 'math.sqrt',
        '^': '**',
        'π': 'math.pi',
        'e': 'math.e',
        'abs': 'abs',
        '|x|': 'abs',
        'n!': 'math.factorial'
    }
    
    # Replace special characters and function names
    for old, new in replacements.items():
        if old in expr:
            if old == '|x|':
                # Special case for absolute value define karne keliye
                expr = expr.replace('|x|(', 'abs(')
            else:
                expr = expr.replace(old, new)
    
    return expr

def is_safe_expression(expr):
    """Check if the expression is safe to evaluate nhito execute nhi hoga"""
    if any(func in expr for func in ['math.', 'abs', 'factorial']):
        return True
    
    # Only allow: numbers, basic operators, parentheses - basically ek operator check hai
    allowed_pattern = r'^[\d\s+\-*/().]+$'
    return bool(re.match(allowed_pattern, expr))

def convert(value, from_unit, to_unit, conversion_type):
    conversions = {
        'length': {
            'm_to_ft': lambda x: x * 3.28084,
            'ft_to_m': lambda x: x / 3.28084,
            'm_to_cm': lambda x: x * 100,
            'cm_to_m': lambda x: x / 100,
            'ft_to_in': lambda x: x * 12,
            'in_to_ft': lambda x: x / 12,
            'cm_to_in': lambda x: x / 2.54,
            'in_to_cm': lambda x: x * 2.54,
        },
        'temperature': {
            'C_to_F': lambda x: (x * 9/5) + 32,
            'F_to_C': lambda x: (x - 32) * 5/9,
            'C_to_K': lambda x: x + 273.15,
            'K_to_C': lambda x: x - 273.15,
            'F_to_K': lambda x: (x - 32) * 5/9 + 273.15,
            'K_to_F': lambda x: (x - 273.15) * 9/5 + 32,
        },
        'weight': {
            'kg_to_lb': lambda x: x * 2.20462,
            'lb_to_kg': lambda x: x / 2.20462,
            'kg_to_g': lambda x: x * 1000,
            'g_to_kg': lambda x: x / 1000,
            'lb_to_oz': lambda x: x * 16,
            'oz_to_lb': lambda x: x / 16,
            'g_to_oz': lambda x: x / 28.3495,
            'oz_to_g': lambda x: x * 28.3495,
        },
        'time': {
            's_to_min': lambda x: x / 60,
            'min_to_s': lambda x: x * 60,
            'min_to_hr': lambda x: x / 60,
            'hr_to_min': lambda x: x * 60,
            'hr_to_day': lambda x: x / 24,
            'day_to_hr': lambda x: x * 24,
        },
        'volume': {
            'l_to_ml': lambda x: x * 1000,
            'ml_to_l': lambda x: x / 1000,
            'l_to_gal': lambda x: x * 0.264172,
            'gal_to_l': lambda x: x / 0.264172,
            'gal_to_oz': lambda x: x * 128,
            'oz_to_gal': lambda x: x / 128,
        },
        'speed': {
            'm/s_to_km/h': lambda x: x * 3.6,
            'km/h_to_m/s': lambda x: x / 3.6,
            'km/h_to_mph': lambda x: x * 0.621371,
            'mph_to_km/h': lambda x: x / 0.621371,
            'm/s_to_ft/s': lambda x: x * 3.28084,
            'ft/s_to_m/s': lambda x: x / 3.28084,
        }
    }
    
    conversion_key = f'{from_unit}_to_{to_unit}'
    
    if from_unit == to_unit:
        return float(value)
    
    if conversion_type in conversions and conversion_key in conversions[conversion_type]:
        return conversions[conversion_type][conversion_key](float(value))
    
    if conversion_type == 'length':
        if from_unit != 'm' and to_unit != 'm':
            value_in_m = conversions['length'][f'{from_unit}_to_m'](float(value))
            return conversions['length'][f'm_to_{to_unit}'](value_in_m)
    
    raise ValueError(f"Unsupported conversion: {from_unit} to {to_unit}")