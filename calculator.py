import math
import re

def evaluate(expression, calc_type='standard'):
    """Evaluates mathematical expressions"""
    # Clean the expression
    expression = expression.replace('×', '*').replace('÷', '/')
    
    if calc_type == 'scientific':
        # Handle scientific functions
        expression = handle_scientific_functions(expression)
    
    # Safety check before eval
    if not is_safe_expression(expression):
        raise ValueError("Invalid expression")
        
    return eval(expression)

def handle_scientific_functions(expr):
    """Replace scientific function names with their math module equivalents"""
    replacements = {
        'sin': 'math.sin',
        'cos': 'math.cos',
        'tan': 'math.tan',
        'log': 'math.log10',
        'ln': 'math.log',
        'sqrt': 'math.sqrt',
        '^': '**'
    }
    
    for old, new in replacements.items():
        expr = expr.replace(old, new)
    
    return expr

def is_safe_expression(expr):
    """Check if the expression is safe to evaluate"""
    # Only allow: numbers, basic operators, parentheses, and math functions
    allowed_pattern = r'^[\d\s+\-*/().]+$'
    return bool(re.match(allowed_pattern, expr))

def convert(value, from_unit, to_unit, conversion_type):
    """Handles unit conversions"""
    conversions = {
        'length': {
            'm_to_ft': lambda x: x * 3.28084,
            'ft_to_m': lambda x: x / 3.28084
        },
        'temperature': {
            'c_to_f': lambda x: (x * 9/5) + 32,
            'f_to_c': lambda x: (x - 32) * 5/9
        },
        'weight': {
            'kg_to_lb': lambda x: x * 2.20462,
            'lb_to_kg': lambda x: x / 2.20462
        }
    }
    
    conversion_key = f'{from_unit}_to_{to_unit}'
    if conversion_type in conversions and conversion_key in conversions[conversion_type]:
        return conversions[conversion_type][conversion_key](float(value))
    else:
        raise ValueError("Unsupported conversion")
