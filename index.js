const fs = require("node:fs");
const path = require("node:path");

let HLC = fs.readFileSync(path.join(__dirname, "test.nv")).toString();
let lines = HLC.trim().split("\n");

function parseLine(line) {
	const tokens = line.trim().split(/ +/); // Split by spaces
	let result = [];

	if (tokens[1] === "=") {
		// Handle assignment
		const variable = tokens[0];
		const expression = line.split("=").slice(1).join("=").trim();

		// Check if it's a literal (string, boolean, number)
		if (expression.startsWith('"') && expression.endsWith('"')) {
			// String literal
			result = [variable, ["=", [expression]]];
		} else if (["true", "false"].includes(expression)) {
			// Boolean literal
			result = [variable, ["=", [expression]]];
		} else if (
			!isNaN(parseFloat(expression)) &&
			!expression.match(/\+|\-|\*|\//g)
		) {
			// Number literal
			result = [variable, ["=", [expression]]];
		} else {
			// Otherwise, treat it as a mathematical expression
			result = [variable, ["=", parseToRPN(expression)]];
		}
	} else {
		let n = tokens[0];
		tokens.shift();
		result = [n, [parseToRPN(tokens.join(" "))]];
	}

	return result;
}

function parseToRPN(expression) {
	const operators = {
		"+": 1,
		"-": 1,
		"*": 2,
		"/": 2,
		">": 1,
	};

	const output = [];
	const operatorStack = [];

	const tokens = tokenize(expression);

	for (const token of tokens) {
		if (!isNaN(token)) {
			// If token is a number, add it to output
			output.push(token);
		} else if (token in operators) {
			// Operator: pop higher or equal precedence operators to output
			while (
				operatorStack.length &&
				operators[operatorStack[operatorStack.length - 1]] >=
					operators[token]
			) {
				output.push(operatorStack.pop());
			}
			operatorStack.push(token);
		} else if (token === "(") {
			// Open parenthesis: push to stack
			operatorStack.push(token);
		} else if (token === ")") {
			// Close parenthesis: pop to output until open parenthesis is found
			while (
				operatorStack.length &&
				operatorStack[operatorStack.length - 1] !== "("
			) {
				output.push(operatorStack.pop());
			}
			operatorStack.pop(); // Remove the "("
		} else {
			// must be a variable name by this point
			output.push(token);
		}
	}

	// Pop remaining operators to output
	while (operatorStack.length) {
		output.push(operatorStack.pop());
	}

	return output;
}

function tokenize(expression) {
	const regex = /\d+(\.\d+)?|[+\-*/>()]|\w+|".*?"/g; // Matches numbers, operators, parentheses, variables, or strings
	return expression.match(regex) || [];
}

function parseLogicalToRPN(expression) {
	const operators = {
		AND: 2,
		OR: 1,
		NOT: 3, // Higher precedence for unary NOT
	};

	const output = [];
	const operatorStack = [];

	const tokens = tokenizeLogical(expression);

	for (const token of tokens) {
		if (isBooleanLiteral(token)) {
			// Boolean literals (true, false) go directly to output
			output.push(token);
		} else if (token in operators) {
			// Operator: pop higher or equal precedence operators to output
			while (
				operatorStack.length &&
				operatorStack[operatorStack.length - 1] !== "(" &&
				operators[operatorStack[operatorStack.length - 1]] >=
					operators[token]
			) {
				output.push(operatorStack.pop());
			}
			operatorStack.push(token);
		} else if (token === "(") {
			// Open parenthesis: push to stack
			operatorStack.push(token);
		} else if (token === ")") {
			// Close parenthesis: pop to output until open parenthesis is found
			while (
				operatorStack.length &&
				operatorStack[operatorStack.length - 1] !== "("
			) {
				output.push(operatorStack.pop());
			}
			operatorStack.pop(); // Remove the "("
		}
	}

	// Pop remaining operators to output
	while (operatorStack.length) {
		output.push(operatorStack.pop());
	}

	return output;
}

function tokenizeLogical(expression) {
	const regex = /\b(?:true|false|AND|OR|NOT)\b|[()]/g; // Matches logical keywords and parentheses
	return expression.match(regex) || [];
}

function isBooleanLiteral(token) {
	return token === "true" || token === "false";
}

// Test cases for logical RPN
// console.log(parseLogicalToRPN("true AND false OR true"));

lines.forEach((line) => {
	if (line) console.log(JSON.stringify(parseLine(line), null));
});
