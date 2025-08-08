# One Body Prototype v2

A Vue.js version of [One Body v1 project](https://github.com/tairea/one-body)

## Database setup

Run `npm run database:seed`.

To reset the database, run `npm run database:clear`.

## Building recommendations

Generating recommendations are currently a manual process.

1. Dump the people in the database with `npm run recommendations:people-export -- people.json`.
1. Generate the recommendations with `npm run recommendations:build -- people.json recommendations.json`. [Ollama] must be running on your machine.
1. Import the recommendations with `npm run recommendations:import -- recommendations.json`.

This could be improved but is good enough for our demo right now.

[Ollama]: https://ollama.com/
