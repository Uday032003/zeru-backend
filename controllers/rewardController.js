const { initializeDB } = require("../db");

const getAllRewards = async (req, res) => {
  try {
    const db = await initializeDB();
    const rewards = await db.all(`
      SELECT
      rewards.id AS id,
      rewards.wallet_address AS wallet_address,
      rewards.total_rewards_received_steth AS total_rewards_received_steth,
      rewards.last_updated AS last_updated,
      reward_breakdown.operator_address AS operator_address,
      reward_breakdown.amount_steth AS amount_steth,
      reward_breakdown.timestamp AS timestamps 
       FROM rewards JOIN reward_breakdown ON rewards.id = reward_breakdown.reward_id
       GROUP BY rewards.id
      `);

    const updatedRewards = rewards.map((i) => ({
      _id: i.id,
      walletAddress: i.wallet_address,
      totalRewardsReceivedStETH: i.total_rewards_received_steth,
      rewardsBreakdown: [
        {
          operatorAddress: i.operator_address,
          amountStETH: i.amount_steth,
          timestamps: i.timestamps,
        },
      ],
      lastUpdated: i.last_updated,
    }));
    res.json(updatedRewards);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
};

module.exports = { getAllRewards };
