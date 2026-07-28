# EcoWatt AI — System Limitations & Future Scope

This document reviews the boundaries and design limitations of the current **EcoWatt AI** major project prototype, which are important to document in your thesis report and discuss during final viva presentations.

---

## 1. Synthetic IoT Feeds
*   **Limitation**: The system relies on a mathematical simulator to stand in for physical IoT smart meters and weather stations.
*   **Real-world Impact**: In actual microgrids, raw telemetry encounters packet drops, network latencies, sensor drift, and intermittent communication blackout states that require robust message brokers (e.g. MQTT/Kafka) and fault-tolerant ingestion buffers.
*   **Future Scope**: Wires backend REST endpoints to physical hardware (e.g. ESP32 microcontrollers measuring current and voltage via current transformers).

## 2. Injected Anomaly Labels
*   **Limitation**: The anomaly detector is evaluated against synthetic anomalies injected by our simulator (`is_anomaly` ground truth flag).
*   **Real-world Impact**: Real-world smart-grid anomalies (tampering, insulation breakdowns, phase unbalances) are rare, unlabeled, and require subject-matter experts to audit. The simulated labels represent an ideal case.
*   **Future Scope**: Incorporate active-learning loops where grid operators can flag false positives, retraining the Isolation Forest and adaptive residual boundaries on live feedback.

## 3. Advisory vs. Direct Actuation Controls
*   **Limitation**: The Demand-Response optimization engine is advisory. It generates optimization cards (e.g. recommending load-shifting or baseline adjustments) but does not actuate physical relays.
*   **Real-world Impact**: True smart building automation requires direct SCADA integration or PLC controllers to dynamically switch off non-essential HVAC zones or toggle battery charge circuits.
*   **Future Scope**: Integrate Zigbee/Modbus smart plug API callouts to automate battery charging or turn off redundant loads when peak rate alerts fire.

## 4. Discretized Reinforcement Learning
*   **Limitation**: The Q-learning battery agent uses a discretized state representation (144 states total) to ensure fast tabular training on standard CPUs.
*   **Real-world Impact**: Real battery storage systems manage continuous metrics: state of charge (SoC), voltage degradation, battery health index, and real-time electricity tariff pricing. Tabular models suffer from the "curse of dimensionality" as state dimensions scale.
*   **Future Scope**: Upgrade the tabular scheduler to a Deep Q-Network (DQN) or Proximal Policy Optimization (PPO) agent utilizing PyTorch neural networks to support continuous state spaces.

## 5. Static Carbon Emission Factors
*   **Limitation**: The carbon footprint calculator applies a static grid-average emission coefficient ($0.82 \text{ kg CO}_2\text{e/kWh}$).
*   **Real-world Impact**: Grid carbon intensity changes dynamically every hour depending on the active fuel mix (coal vs gas vs solar vs hydro). Calculating footprint based on a static average is a standard approximation but misses hourly marginal footprint details.
*   **Future Scope**: Connect to external live carbon APIs (e.g. Electricity Maps) to query dynamic carbon emission factors for the regional grid zone.
