import esprima
import ast  # To safely parse the string representation of dictionaries
import csv
import sys


def parse_js_code(file_path):
    """Parses JavaScript code from a file."""
    try:
        with open(file_path, 'r') as file:
            code = file.read()
        # Remove $ExpectError comments
        code = code.replace('$ExpectError', '')
        print("Debug: JavaScript code being parsed:\n", code)  # Debug statement
        parsed = esprima.parse(code, loc=True, sourceType="module")
        return code, parsed
    except Exception as e:
        raise ValueError(f"Failed to parse JavaScript file: {e}")


def extract_test_block(node, target_line, code):
    """Extracts the test block containing the target line."""
    if hasattr(node, 'loc'):
        start_line = node.loc.start.line
        end_line = node.loc.end.line
        if start_line <= target_line <= end_line:
            if node.type == 'CallExpression':
                if hasattr(node.callee, 'name') and node.callee.name in [
                    'it', 'test', 'beforeEach', 'afterEach', 'xit', 'xdescribe', 'fdescribe'
                ]:
                    return format_test_block(code, start_line, end_line)
                elif node.callee.type == 'MemberExpression':
                    object_name = getattr(node.callee.object, 'name', None)
                    property_name = getattr(node.callee.property, 'name', None)
                    if object_name == 'describe' and property_name in ['only', 'skip']:
                        return format_test_block(code, start_line, end_line)

            if node.type == 'VariableDeclarator' and hasattr(node, 'init') and node.init:
                if node.init.type in ['ArrowFunctionExpression', 'FunctionExpression']:
                    return format_test_block(code, start_line, end_line)
                elif node.init.type == 'CallExpression':
                    callee = node.init.callee
                    object_name = getattr(callee.object, 'name', None)
                    property_name = getattr(callee.property, 'name', None)
                    if object_name == 'jest' and property_name == 'spyOn':
                        return format_test_block(code, start_line, end_line)

    for child in traverse_ast(node):
        result = extract_test_block(child, target_line, code)
        if result:
            return result
    return None


def format_test_block(code, start_line, end_line):
    """Formats the test block for output."""
    test_code = code.splitlines()[start_line - 1:end_line]
    return {
        "test": "\n".join(test_code),
        "start": start_line,
        "end": end_line
    }


def traverse_ast(node):
    """Traverses the AST recursively."""
    for key in node.__dict__:
        child = getattr(node, key)
        if isinstance(child, list):
            for sub_child in child:
                if isinstance(sub_child, esprima.nodes.Node):
                    yield sub_child
        elif isinstance(child, esprima.nodes.Node):
            yield child


def find_parent_test_method(file_path, target_line):
    """Finds the parent test method containing the target line."""
    try:
        code, parsed = parse_js_code(file_path)
        for node in parsed.body:
            result = extract_test_block(node, target_line, code)
            if result:
                return result
        return {"error": "No test method found containing the specified line."}
    except FileNotFoundError:
        return {"error": f"File not found: {file_path}"}
    except ValueError as e:
        return {"error": f"Parsing error: {e}"}
    except Exception as e:
        return {"error": f"Unexpected error: {e}"}


def process_csv(input_csv, output_csv):
    """Processes the input CSV and writes results to the output CSV."""
    with open(input_csv, 'r') as infile, open(output_csv, 'w', newline='') as outfile:
        reader = csv.DictReader(infile)
        fieldnames = ['A (filename)', 'B (test)', 'C (start: ... end: ....)']
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            file_path, target_line = construct_file_path_and_line(row)
            if not file_path or not target_line:
                writer.writerow({
                    'A (filename)': file_path or "Invalid file path",
                    'B (test)': "Error: Invalid 'Lines' format",
                    'C (start: ... end: ....)': ''
                })
                continue

            result = find_parent_test_method(file_path, target_line)
            if "error" in result:
                writer.writerow({
                    'A (filename)': file_path,
                    'B (test)': result['error'],
                    'C (start: ... end: ....)': ''
                })
            else:
                writer.writerow({
                    'A (filename)': file_path,
                    'B (test)': result['test'],  # Include the original method code here
                    'C (start: ... end: ....)': f"start: {result['start']} end: {result['end']}"
                })


def construct_file_path_and_line(row):
    """Constructs the file path and extracts the target line from the CSV row."""
    try:
        print("Debug: Processing row:", row)  # Debug statement
        repo_name = row['Repository'].split('/')[-1]
        project_path = "/home/gabriel/Desktop/research/projects/"
        file_path = f"{project_path}{repo_name}{row['File']}"

        lines_data = ast.literal_eval(row['Lines'])
        target_line = lines_data.get('startLine') or lines_data.get('line')
        return file_path, target_line
    except (ValueError, SyntaxError, KeyError) as e:
        print("Debug: Error processing row:", e)  # Debug statement
        return None, None


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python method_script.py <input_csv> <output_csv>")
        sys.exit(1)

    input_csv = sys.argv[1]
    output_csv = sys.argv[2]
    process_csv(input_csv, output_csv)