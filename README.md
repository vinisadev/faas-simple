# Simple FaaS (Function as a Service) Server

A lightweight Function as a Service server that supports multiple programming languages (Python, JavaScript, and Ruby). This server allows you to register, execute, and manage functions through a simple REST API.

## Table of Contents
- [Installation](#installation)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Supported Languages](#supported-languages)
- [Examples](#examples)
- [Error Handling](#error-handling)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Python (optional, for Python functions)
- Ruby (optional, for Ruby functions)

### Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd simple-faas
```

2. Install dependencies:
```bash
yarn install
# or
npm install
```

3. Start the server:
```bash
yarn start
# or
npm start
```

The server will start on port 3000 by default.

## API Reference

### Register a Function
Register a new function with the FaaS server.

**Endpoint:** `POST /register`

**Request Body:**
```json
{
    "name": "string",
    "language": "string",
    "code": "string",
    "entryPoint": "string"
}
```

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| name | string | Name of the function | Yes |
| language | string | Programming language ("python", "javascript", "node", or "ruby") | Yes |
| code | string | Source code of the function | Yes |
| entryPoint | string | Entry point function name | Yes |

**Response:**
```json
{
    "functionId": "string",
    "message": "Function registered successfully"
}
```

### Execute a Function
Execute a registered function with provided input.

**Endpoint:** `POST /execute/:functionId`

**URL Parameters:**
- `functionId`: The unique identifier returned when registering the function

**Request Body:**
```json
{
    // Any JSON object that your function expects as input
}
```

**Response:**
```json
{
    "result": "any"
}
```

### List Functions
Get a list of all registered functions.

**Endpoint:** `GET /functions`

**Response:**
```json
{
    "functionId": {
        "name": "string",
        "language": "string",
        "filePath": "string",
        "entryPoint": "string",
        "timeout": number
    }
}
```

## Supported Languages

### JavaScript/Node.js
```javascript
// Example function
function add(input) {
    const { a, b } = JSON.parse(input);
    return JSON.stringify({ result: a + b });
}

// Make sure to handle the input argument
const result = add(process.argv[2]);
console.log(result);
```

### Python
```python
import sys
import json

def add(input_data):
    data = json.loads(input_data)
    return json.dumps({'result': data['a'] + data['b']})

# Make sure to handle the input argument
if __name__ == '__main__':
    result = add(sys.argv[1])
    print(result)
```

### Ruby
```ruby
require 'json'

def add(input)
    data = JSON.parse(input)
    { result: data['a'] + data['b'] }.to_json
end

# Make sure to handle the input argument
puts add(ARGV[0])
```

## Examples

### Register a JavaScript Function
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "addNumbers",
    "language": "javascript",
    "code": "function add(input) { const { a, b } = JSON.parse(input); return JSON.stringify({ result: a + b }); } const result = add(process.argv[2]); console.log(result);",
    "entryPoint": "add"
  }'
```

### Execute a Function
```bash
curl -X POST http://localhost:3000/execute/[functionId] \
  -H "Content-Type: application/json" \
  -d '{
    "a": 5,
    "b": 3
  }'
```

### List All Functions
```bash
curl http://localhost:3000/functions
```

## Error Handling

The server returns appropriate HTTP status codes and error messages:

- `200 OK`: Successful operation
- `404 Not Found`: Function not found
- `500 Internal Server Error`: Execution error or server error

Error responses follow this format:
```json
{
    "error": "Error message description"
}
```

Common error scenarios:
1. Function not found
2. Invalid input format
3. Execution timeout (default: 30 seconds)
4. Runtime errors in the function
5. Unsupported programming language

## Important Notes

1. **Security**: This is a basic implementation and should not be used in production without additional security measures.

2. **Input Sanitization**: Always validate and sanitize input before passing it to your functions.

3. **Timeouts**: Functions have a default timeout of 30 seconds.

4. **File System**: Functions are stored in the `./functions` directory by default.

5. **Dependencies**: Functions should be self-contained and not rely on external dependencies.

## Contributing

Feel free to submit issues and pull requests to improve the functionality of this FaaS server.

## License

This project is licensed under the MIT License - see the LICENSE file for details.