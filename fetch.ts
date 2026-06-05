import fs from "fs";
fetch("https://sudoku-api.vercel.app/api/dosuku")
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
