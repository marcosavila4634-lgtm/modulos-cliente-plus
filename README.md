# Módulos Cliente Plus

Laboratório para criar e testar novos módulos do Cliente Plus no seu computador,
antes de levá-los para o projeto oficial.

## Como ligar

1. No VS Code, abra o terminal: menu **Terminal → Novo Terminal**.
2. Digite e aperte Enter:

   ```
   npm run dev
   ```

3. Espere aparecer `[backend] rodando` e `Local: http://localhost:5173/`.
4. Abra no navegador: **http://localhost:5173**

Para desligar, clique no terminal e aperte **Ctrl + C**.

Toda alteração salva nos arquivos aparece na tela automaticamente.

Na primeira vez o backend demora um pouco mais para ligar, porque baixa o que
precisa da internet (Maven e bibliotecas). Depois fica rápido.

## Primeira vez em outro computador

1. Instale o **Java 21** (Eclipse Temurin). No terminal:

   ```
   winget install EclipseAdoptium.Temurin.21.JDK
   ```

   Depois **feche e abra o VS Code** de novo para ele enxergar o Java.

2. Antes do `npm run dev`, rode uma vez:

   ```
   npm install
   ```

Não precisa instalar o Maven: ele vem junto no projeto (`backend/mvnw`).

## Partes do projeto

| Pasta       | O que é                                                   |
| ----------- | --------------------------------------------------------- |
| `frontend/` | As telas que você vê no navegador                         |
| `backend/`  | A API em Java 21 + Quarkus + Maven, com banco H2          |

## Banco de dados

O backend usa um banco **H2 em memória**: ele existe só enquanto o backend
está ligado. Toda vez que liga, o banco é criado do zero e recebe os dados de
exemplo. Nada do que for alterado fica salvo depois de desligar.

- Tabelas: `backend/src/main/resources/db/migration/`
- Dados de exemplo: `backend/src/main/resources/db/dados-demo/`

Se você mudar e salvar um desses arquivos com o `npm run dev` ligado, o
backend reinicia sozinho com os dados novos.

Para ver as tabelas pelo navegador (com o `npm run dev` ligado): abra
**http://localhost:3001/q/dev-ui**, clique em **Agroal** e depois em
**Database view**.
