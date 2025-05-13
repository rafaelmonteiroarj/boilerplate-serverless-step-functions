const { execSync } = require("child_process");

const stage = process.argv[2];

if (!stage) {
  console.error(
    "Erro: o parâmetro stage é obrigatório. Como usar: npm run destroy <stage(dev | pet | prd)>",
  );
  process.exit(1);
}

try {
  execSync(`sls remove --stage ${stage}`, { stdio: "inherit" });
} catch (err) {
  console.error("Destroy failed:", err);
  process.exit(1);
}
