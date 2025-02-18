
# Calculator Web Application

This is a web-based calculator application built using Flask. It supports standard and scientific calculations, unit conversions, and provides features like history tracking, export functionality, and more.

## Features

- **Standard and Scientific Calculations**: Perform basic arithmetic operations and advanced scientific calculations.
- **Unit Conversion**: Convert between different units of length, temperature, weight, time, volume, and speed.
- **Calculation History**: View the last 10 calculations performed.
- **Export Functionality**: Export calculation results and steps as PDF or CSV files.
- **Clear History**: Clear the calculation history with a single click.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/calculator-app.git
   cd calculator-app
   ```

2. **Set up a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   python app.py
   ```

5. **Access the application**:
   Open your browser and navigate to `http://127.0.0.1:5000/`.

## Configuration

The application uses a SQLite database for storing calculation history. The database configuration can be found in `config.py`.

## API Endpoints

- **GET `/`**: Renders the main calculator interface.
- **POST `/calculate`**: Performs a calculation based on the provided expression and type (standard or scientific).
- **POST `/convert`**: Converts a value from one unit to another.
- **POST `/convert-preview`**: Previews the result of a conversion without saving it to history.
- **POST `/clear-history`**: Clears the calculation history.
- **POST `/export-calculation`**: Exports the calculation result and steps as a PDF or CSV file.
- **GET `/get-history`**: Retrieves the last 10 calculations from the history.

## Dependencies

- Flask
- Flask-SQLAlchemy
- ReportLab (for PDF generation)
- Python-dotenv

## Deployment

The application can be deployed on Vercel using the provided `vercel.json` configuration file.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```

This `README.md` provides an overview of the project, installation instructions, configuration details, API endpoints, dependencies, deployment information, and contribution guidelines. You can customize it further based on your specific needs.
