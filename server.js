const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const { initializeDB } = require("./db");
const restakerRoutes = require("./routes/restakers");
const validatorRoutes = require("./routes/validators");
const rewardRoutes = require("./routes/rewards");

const app = express();
app.use(express.json());
app.use(cors());

let db;
const initializeDBAndServer = async () => {
  try {
    db = await initializeDB();
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });

    await fetchData();
    cron.schedule("*/10 * * * *", fetchData);
  } catch (error) {
    console.log(`Database error is ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.use("/restakers", restakerRoutes);
app.use("/validators", validatorRoutes);
app.use("/rewards", rewardRoutes);

const endpoint =
  "https://gateway.thegraph.com/api/subgraphs/id/68g9WSC4QTUJmMpuSbgLNENrcYha4mPmXhWGCoupM7kB";

const query = `{
  deposits(where: {token_: {symbol: "stETH"}}) {
    depositor
    amount
    timestamp
    pool {
      id
    }
  }
  accounts {
    id
    deposits {
      timestamp
      amount
      pool {
        active
        cumulativeDepositCount
        id
      }
    }
  }
}
`;

const headers = {
  "Content-Type": "application/json",
  Authorization: "Bearer 3516924f428cd3917b3f845b7c4516fe",
};

const fetchData = async () => {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ query }),
    });
    const { data } = await response.json();
    const currentTime = Math.floor(Date.now() / 1000);

    for (const deposit of data.deposits) {
      const { depositor, amount, pool } = deposit;
      const { id } = pool;

      await db.run(
        `
        INSERT INTO restakers (user_address, amount_restaked_steth, target_avs_operator_address, last_updated)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_address) DO UPDATE SET
          amount_restaked_steth = excluded.amount_restaked_steth,
          target_avs_operator_address = excluded.target_avs_operator_address,
          last_updated = excluded.last_updated;
        `,
        [depositor, parseFloat(amount) / 1e18, id, currentTime]
      );
    }

    for (const account of data.accounts) {
      const { deposits, id } = account;
      const { amount, pool, timestamp } = deposits[0];
      const { active, cumulativeDepositCount } = pool;

      await db.run(
        `
        INSERT INTO validators (operator_address , total_delegated_stake_steth , status , last_updated)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(operator_address) DO UPDATE SET
          total_delegated_stake_steth = excluded.total_delegated_stake_steth,
          status = excluded.status,
          last_updated = excluded.last_updated;
        `,
        [
          pool.id,
          parseFloat(amount) / 1e18,
          active ? "active" : "inactive",
          currentTime,
        ]
      );

      await db.run(
        `
        INSERT INTO rewards (wallet_address  , total_rewards_received_steth , last_updated)
        VALUES (?, ?, ?)
        ON CONFLICT(wallet_address ) DO UPDATE SET
          total_rewards_received_steth = excluded.total_rewards_received_steth,
          last_updated = excluded.last_updated;
        `,
        [id, parseFloat(cumulativeDepositCount) / 1000, currentTime]
      );

      const validator = await db.get(
        `SELECT id FROM validators WHERE operator_address = ?`,
        [pool.id]
      );

      if (validator) {
        const validatorId = validator.id;

        await db.run(
          `
      INSERT INTO slash_history (validator_id, timestamp, amount_steth, reason)
      VALUES (?, ?, ?, ?)
      `,
          [
            validatorId,
            timestamp,
            parseFloat(cumulativeDepositCount) / 1000,
            active ? "Misconduct X" : "simulated",
          ]
        );
      }

      const reward = await db.get(
        `SELECT id FROM rewards WHERE wallet_address = ?`,
        [id]
      );

      if (reward) {
        const rewardId = reward.id;

        await db.run(
          `
      INSERT INTO reward_breakdown (reward_id, operator_address, amount_steth, timestamp)
      VALUES (?, ?, ?, ?)
      `,
          [rewardId, pool.id, parseFloat(amount) / 1e18, timestamp]
        );
      }
    }

    console.log("Restaker, Validators and Rewards data saved successfully.");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

module.exports = app;
