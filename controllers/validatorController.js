const { initializeDB } = require("../db");

const getAllValidators = async (req, res) => {
  try {
    const db = await initializeDB();
    const validators = await db.all(`
      SELECT
      validators.id AS id,
      validators.operator_address AS operator_address,
      validators.total_delegated_stake_steth AS total_delegated_stake_steth,
      validators.status AS status,
      slash_history.timestamp AS timestamp,
      validators.last_updated AS last_updated,
      slash_history.amount_steth AS amount_steth,
      slash_history.reason AS reason 
       FROM validators JOIN slash_history ON validators.id = slash_history.validator_id
       GROUP BY validators.id
       `);

    const updatedValidators = validators.map((i) => ({
      _id: i.id,
      operatorAddress: i.operator_address,
      totalDelegatedStakeStETH: i.total_delegated_stake_steth,
      slashHistory: [
        {
          timestamp: i.timestamp,
          amountStETH: i.amount_steth,
          reason: i.reason,
        },
      ],
      status: i.status,
      lastUpdated: i.last_updated,
    }));
    res.json(updatedValidators);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch validators" });
  }
};

module.exports = { getAllValidators };
