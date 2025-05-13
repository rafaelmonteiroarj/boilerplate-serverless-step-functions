const { execSync } = require("child_process");

const stage = process.argv[2];

if (!stage) {
  console.error(
    "Erro: o parâmetro stage é obrigatório. Como usar: npm run deploy <stage(dev | pet | prd)>",
  );

  process.exit(1);
}

try {
  execSync(`sls deploy --stage ${stage}`, { stdio: "inherit" });
} catch (err) {
  console.error("Deployment failed:", err);
  process.exit(1);
}
