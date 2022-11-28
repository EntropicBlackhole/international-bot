
for (let i = 0; i < 100; i++) {
	var output = ""
	if (i % 3 == 0) output += 'Fizz';
	if (i % 5 == 0) output += 'Buzz';
	if (i % 7 == 0) output += 'Bang';
	if (i % 11 == 0) output += 'Bong';
	if (i % 13 == 0) output += 'Fezz';
	if (output == "") output = i;
	console.log(output)
}