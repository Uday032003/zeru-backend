const { initializeDB } = require("../db");

const getAllRestakers = async (req, res) => {
  try {
    const db = await initializeDB();
    const restakers = await db.all(`
      SELECT
      id,
      user_address,
      amount_restaked_steth,
      target_avs_operator_address,
      last_updated
      FROM restakers
      `);

    const updatedRestakers = restakers.map((i) => ({
      _id: i.id,
      userAddress: i.user_address,
      amountRestakedStETH: i.amount_restaked_steth,
      targetAVSOperatorAddress: i.target_avs_operator_address,
      lastUpdated: i.last_updated,
    }));
    res.json(updatedRestakers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch restakers" });
  }
};

module.exports = { getAllRestakers };
