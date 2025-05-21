## 📖 Sobre

Boilerplate de Step Functions para integração com AWS Lambda, incluindo envio de SMS via AWS SNS.

### Principais Funcionalidades

- 👥 **Criação de Pedidos**
  - Criação de novos pedidos
  - Validação de dados (incluindo número de telefone)
  - Persistência no DynamoDB
  - Disparo de SMS para o cliente


## 🏗 Arquitetura

O projeto segue uma arquitetura modular e enxuta, com as seguintes pastas principais:

```
src/
├── modules/
│   └── orders/
│       ├── core/
│       │   ├── model/
│       │   │   └── order.model.ts
│       │   └── use-cases/
│       │       ├── add-order.use-case.ts
│       │       └── get-order-by-id.use-case.ts
│       ├── http/
│       │   └── handlers/
│       │       ├── add-order.ts
│       │       ├── get-order-by-id.ts
│       │       ├── send-order-sms.ts
│       │       ├── dtos/
│       │       │   └── create-order.dto.ts
│       │       └── validation/
│       │           └── order.validation.ts
│       └── persistence/
│           └── repository/
│               └── order.repository.ts
├── shared/
│   ├── core/
│   │   ├── exception/
│   │   │   ├── domain.exception.ts
│   │   │   └── not-found-domain.exception.ts
│   │   └── model/
│   │       └── default.model.ts
│   └── modules/
│       ├── logging/
│       │   └── winston/
│       │       └── logger.ts
│       └── persistence/
│           └── dynamo.repository.ts
```

- **modules/orders**: Domínio de pedidos, com handlers, use-cases, models e repositórios.
- **shared/core**: Exceções e modelos base compartilhados.
- **shared/modules**: Utilitários compartilhados como logging e persistência.

## 🚀 Tecnologias

- **Backend**
  - [Node.js](https://nodejs.org/) v22.12.0
  - [TypeScript](https://www.typescriptlang.org/)

- **Infraestrutura**
  - [DynamoDB](https://aws.amazon.com/dynamodb/)
  - [Serverless Framework](https://www.serverless.com/)
  - [AWS Lambda](https://aws.amazon.com/lambda/)
  - [Step Functions](https://aws.amazon.com/step-functions/)
  - [SNS (Simple Notification Service)](https://aws.amazon.com/sns/)

- **Qualidade**
  - [ESLint](https://eslint.org/)
  - [Prettier](https://prettier.io/)
  - [Husky](https://typicode.github.io/husky/)

## 🛠 Setup do Ambiente

### Pré-requisitos

- Node.js v22.12.0 (via nvm)
- PNPM
- AWS CLI configurado

### Instalação

1. **Configure o Node.js com NVM**
   ```bash
   nvm install v22.12.0
   nvm use v22.12.0
   ```

2. **Instale as dependências**
   ```bash
   npm install -g pnpm
   pnpm install
   ```

3. **Configure o ambiente**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

### Scripts Disponíveis

- 🚀 **Deploy**
  ```bash
  pnpm deploy:dev        # Deploy ambiente de desenvolvimento
  pnpm deploy:pet        # Deploy ambiente de teste
  pnpm deploy:prd        # Deploy produção
  ```

- 🧹 **Qualidade**
  ```bash
  pnpm lint              # Verifica código
  pnpm format            # Formata código
  ```

## 🔄 Fluxo de Orquestração (Step Functions)

O projeto utiliza AWS Step Functions para orquestrar processos entre Lambdas. O fluxo principal é:

```
[Create Order] -> [Send SMS] -> [Get Order] -> [Wait] -> [Finished]
```

- **Create Order**: Cria o pedido no DynamoDB.
- **Send SMS**: Dispara um SMS para o número informado no pedido usando AWS SNS.
- **Get Order**: Consulta o pedido criado.
- **Wait**: Espera 2 segundos.
- **Finished**: Finaliza o fluxo.
- **Tratamento de erros**: Todos os passos possuem catch para tratamento de falhas.

> O campo `phoneNumber` é opcional, mas se informado, o SMS será enviado após a criação do pedido.

### Exemplo de Payload de Criação de Pedido

```json
{
  "name": "Pedido 1",
  "description": "Descrição do pedido 1",
  "phoneNumber": "+5511999999999"
}
```

- O campo `phoneNumber` deve estar no formato internacional (ex: +5511999999999).

### Exemplo de Resposta do Step Function

```json
{
  "id": "...",
  "name": "Pedido 1",
  "description": "Descrição do pedido 1",
  "phoneNumber": "+5511999999999",
  "createdAt": "...",
  "updatedAt": "..."
}
```

## 📲 Envio de SMS

O envio de SMS é realizado pelo AWS SNS. O texto enviado pode ser customizado no handler `send-order-sms.ts`.

- O número de telefone deve ser válido e estar no formato internacional.
- O envio é feito automaticamente pelo Step Function após a criação do pedido.
- O status do envio pode ser acompanhado nos logs da função Lambda `SendOrderSms`.

### Testando o Envio de SMS

- Crie um pedido com o campo `phoneNumber` preenchido.
- Verifique nos logs da função Lambda se o SMS foi enviado com sucesso.
- Caso haja erro, o Step Function irá capturar e finalizar o fluxo.

## 🧪 Testando e Invocando Funções

- **Invocar AddOrder localmente:**
  ```bash
  npx serverless invoke local --function AddOrder --stage dev --data '{ "name": "Pedido 1", "description": "Descrição do pedido 1", "phoneNumber": "+5511999999999" }'
  ```

- **Invocar GetOrderById localmente:**
  ```bash
  npx serverless invoke local --function GetOrderById --stage dev --data '{ "id": "SEU_ID_DE_PEDIDO" }'
  ```

- **Invocar SendOrderSms localmente:**
  ```bash
  npx serverless invoke local --function SendOrderSms --stage dev --data '{ "id": "...", "name": "Pedido 1", "description": "Descrição do pedido 1", "phoneNumber": "+5511999999999" }'
  ```

- **Ver logs da função:**
  ```bash
  npx serverless logs -f SendOrderSms -s dev -r us-east-1 -t
  ```

## 🛠 Funções Lambda Disponíveis

- **AddOrder**: Cria um novo pedido.
- **GetOrderById**: Consulta um pedido pelo ID.
- **SendOrderSms**: Envia SMS para o telefone do pedido.

## 🐞 Debugando Funções Lambda Localmente

Você pode debugar handlers Lambda localmente usando o VSCode e o `ts-node`:

1. **Configuração do VSCode**
   - O arquivo `.vscode/launch.json` já está pronto para debug com TypeScript.
2. **Arquivo de entrada para debug**
   - Edite `.vscode/invoke.js` para apontar para o handler desejado e simular o evento.
3. **Coloque breakpoints**
   - Abra o handler desejado e adicione breakpoints no VSCode.
4. **Inicie o debug**
   - No VSCode, selecione "Debug Handler (ts-node)" e pressione F5.

## 🛡️ Troubleshooting e Dicas para SMS

- Certifique-se de que o número está no formato internacional.
- O envio de SMS pode estar sujeito a restrições de sandbox da AWS em contas novas.
- Verifique os logs da função Lambda para detalhes de erro.
- O SNS pode ter limites de envio por região/país.
- Para produção, solicite remoção do sandbox do SNS se necessário.

## ❓ FAQ Rápido sobre SMS

- **O SMS é cobrado?** Sim, consulte a [tabela de preços do SNS](https://aws.amazon.com/sns/sms-pricing/).
- **Posso customizar a mensagem?** Sim, altere o handler `send-order-sms.ts`.
- **Posso enviar para qualquer país?** Sim, desde que o número esteja no formato internacional e a AWS permita o envio para o destino.
- **Como monitorar entregas?** Use CloudWatch Logs e métricas do SNS.

## 📚 Referências

- [AWS SNS SMS Docs](https://docs.aws.amazon.com/sns/latest/dg/sms_publish-to-phone.html)
- [Serverless Framework Docs](https://www.serverless.com/framework/docs/)
- [Step Functions Docs](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)

---
