Project Description:
This project exposes restaking data on the EigenLayer protocol through a REST API. It uses Node.js, Express, and SQLite, and fetches data every 10 minutes from a public GraphQL subgraph related to Lido stETH deposits.

Setup Instructions:
(a) Clone the repository:
git clone https://github.com/Uday032003/zeru-backend.git
(b) Install dependencies:
npm install cors express graphql-request node-cron nodemon path sqlite sqlite3
(c) Run the server:
node server.js OR npm start (i add start tag in scripts in package.json)

API Endpoints:

- `GET /restakers` — Returns list of restakers and their stETH amount.
- `GET /validators` — Returns validator info: operator address, delegated stake, and status.
- `GET /rewards/:address` — Returns rewards and breakdown for a given wallet address.

Data Sources:

- **The Graph Subgraph**: https://gateway.thegraph.com/api/subgraphs/id/68g9WSC4QTUJmMpuSbgLNENrcYha4mPmXhWGCoupM7kB
- Data used:
  - `deposits`: to fetch stETH restaking details
  - `accounts`: to get validator and reward breakdown data

## Data Fetching

- On server start, data is fetched immediately from the subgraph.
- Then, data is re-fetched every 10 minutes using `node-cron`.
- All data is saved to a local SQLite database i created(`dataBata.db`).

