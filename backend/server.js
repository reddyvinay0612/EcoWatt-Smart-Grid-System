import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Helper sleep function for streaming simulation
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Endpoint: POST /api/chat
 * Streams responses back via Server-Sent Events (SSE) to support real-time token rendering
 * and tool-call indicators (analyst, search, python code execution).
 */
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message parameter.' });
  }

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const hasCreds = process.env.SNOWFLAKE_PAT && 
                   !process.env.SNOWFLAKE_PAT.includes('your_snowflake_personal_access_token') &&
                   process.env.SNOWFLAKE_ACCOUNT &&
                   !process.env.SNOWFLAKE_ACCOUNT.includes('xy12345');

  if (hasCreds) {
    try {
      const db = process.env.DATABASE || 'ECOWATT_DB';
      const schema = process.env.SCHEMA || 'ANALYTICS';
      const agent = process.env.AGENT_NAME || 'ECOWATT_AI_AGENT';
      
      const snowflakeUrl = `${process.env.SNOWFLAKE_HOST.replace(/\/$/, '')}/api/v2/databases/${db}/schemas/${schema}/agents/${agent}/run`;
      
      const snowflakePayload = {
        message: message,
        history: history || [],
        stream: true
      };

      const response = await fetch(snowflakeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SNOWFLAKE_PAT}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(snowflakePayload),
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`Snowflake REST API returned HTTP ${response.status}: ${response.statusText}`);
      }

      // Proxy the event stream directly from Snowflake to client
      response.body.on('data', (chunk) => {
        res.write(chunk);
      });

      response.body.on('end', () => {
        res.end();
      });

      response.body.on('error', (err) => {
        throw err;
      });

    } catch (err) {
      console.error('Snowflake Cortex connection failed, falling back to simulation:', err);
      // Stream error notice and fallback response
      res.write(`data: ${JSON.stringify({ type: 'text', text: `⚠️ *Connection fallback: Snowflake credentials failed (${err.message}). Rendering semantic simulation response...*\n\n` })}\n\n`);
      await sleep(500);
      await streamSimulationResponse(message, res);
    }
  } else {
    // Stream simulation response
    await streamSimulationResponse(message, res);
  }
});

/**
 * High-fidelity streaming simulator matching the Snowflake Cortex Agent responses
 */
async function streamSimulationResponse(message, res) {
  const msg_lower = message.toLowerCase();

  if (msg_lower.includes('highest carbon') || msg_lower.includes('emissions today') || msg_lower.includes('facility')) {
    // 1. Stream tool-call start
    res.write(`data: ${JSON.stringify({ 
      type: 'tool', 
      tool: 'cortex_analyst', 
      status: 'running', 
      query: 'SELECT FACILITY_NAME, SUM(CARBON_EMISSION_KG) AS TOTAL_CO2 FROM ENERGY_METRICS GROUP BY FACILITY_NAME ORDER BY TOTAL_CO2 DESC LIMIT 1;' 
    })}\n\n`);
    await sleep(1200);

    // 2. Stream tool-call output
    res.write(`data: ${JSON.stringify({ 
      type: 'tool', 
      tool: 'cortex_analyst', 
      status: 'success', 
      result: [{ FACILITY_NAME: 'Factory Unit', TOTAL_CO2: 7072.4 }] 
    })}\n\n`);
    await sleep(600);

    // 3. Stream markdown explanation response
    const responseText = "### 📊 Cortex Analyst SQL Result\n\nAccording to aggregate telemetry query from `ENERGY_METRICS` view:\n\n" +
                         "- **Highest Emissions Node**: **Factory Unit** generated the highest carbon footprint today, totaling **7,072.4 kg CO2**.\n" +
                         "- **Emissions Source**: Highly carbon-intensive Grid energy power (~0.95 kg/kWh) used continuously across the plant compressor lines.\n" +
                         "- **Comparison**: The Data Center followed at **1,476.3 kg CO2** (which benefited from offset Wind/Solar load distribution during daylight hours).";
    await streamTextTokens(responseText, res);

  } else if (msg_lower.includes('optimize hvac') || msg_lower.includes('peak hours') || msg_lower.includes('hvac settings')) {
    // 1. Stream tool-call start
    res.write(`data: ${JSON.stringify({ 
      type: 'tool', 
      tool: 'cortex_search', 
      status: 'running', 
      query: 'HVAC setting optimization procedures peak demand control' 
    })}\n\n`);
    await sleep(1200);

    // 2. Stream tool-call output
    res.write(`data: ${JSON.stringify({ 
      type: 'tool', 
      tool: 'cortex_search', 
      status: 'success', 
      result: [{ DOC_ID: 'POL_001', TITLE: 'Standard Operating Protocol for Facility Cooling Control', CATEGORY: 'HVAC Optimization' }] 
    })}\n\n`);
    await sleep(600);

    // 3. Stream markdown explanation response
    const responseText = "### 📖 Cortex Search RAG Policy Result\n\nI searched the sustainability registry and retrieved HVAC protocol **POL_001**:\n\n" +
                         "- **Mandated Action**: During peak load hours (**12:00 PM to 4:00 PM**), HVAC cooling setpoints at the Data Center must be raised by **2°C** (from 21°C to 23°C).\n" +
                         "- **Telemetry Target**: Shifting this setpoint yields a cooling load reduction of approximately **12.5%** and avoids local peak tariff surcharges.\n" +
                         "- **Solar Exception Override**: If instantaneous solar output is above 500 kW, operators may override the setpoint to 22°C to maximize local consumption.";
    await streamTextTokens(responseText, res);

  } else if (msg_lower.includes('30-day savings') || msg_lower.includes('solar') || msg_lower.includes('projected')) {
    // 1. Stream tool-call start
    res.write(`data: ${JSON.stringify({ 
      type: 'tool', 
      tool: 'code_execution', 
      status: 'running', 
      query: 'def calculate_solar_offset_savings(daily_base=1250, increase_ratio=0.20, tariff_usd=0.12, days=30):\n    daily_solar_gain = daily_base * increase_ratio\n    daily_savings = daily_solar_gain * tariff_usd\n    total_savings = daily_savings * days\n    co2_reduction = daily_solar_gain * 0.95 * days\n    return total_savings, co2_reduction\n\nprint(calculate_solar_offset_savings())' 
    })}\n\n`);
    await sleep(1500);

    // 2. Stream tool-call output
    res.write(`data: ${JSON.stringify({ 
      type: 'tool', 
      tool: 'code_execution', 
      status: 'success', 
      result: { total_savings_usd: 900.0, total_co2_reduction_kg: 7125.0 } 
    })}\n\n`);
    await sleep(600);

    // 3. Stream markdown explanation response
    const responseText = "### 🐍 Python Code Execution Result\n\nCalculated projection based on 20% solar load increase simulation context:\n\n" +
                         "- **Daily Solar Shift**: Displacing grid power with an additional 20% solar capacity replaces **250 kWh** of grid draws per day.\n" +
                         "- **Financial Return**: At a standard utility rate of **$0.12/kWh**, this yields a cost saving of **$30.00/day**, translating to **$900.00 in savings** over 30 days.\n" +
                         "- **Carbon Mitigation**: Shifting this load prevents **7,125 kg of carbon emissions** over the month.";
    await streamTextTokens(responseText, res);

  } else {
    const fallbackText = "Hello! I am your **EcoWatt AI assistant**, connected to Snowflake Cortex.\n\n" +
                         "Ask me about monthly usage, average consumption, or anomalous spikes. You can also try these quick presets:\n" +
                         "- *'Which facility had the highest carbon emissions today?'*\n" +
                         "- *'How can we optimize HVAC settings during peak hours?'*\n" +
                         "- *'Calculate projected 30-day savings if solar usage increases by 20%.'*";
    await streamTextTokens(fallbackText, res);
  }

  // End event stream
  res.write('event: end\ndata: [DONE]\n\n');
  res.end();
}

/**
 * Splits string by space and streams words to simulate real-time token rendering
 */
async function streamTextTokens(text, res) {
  const tokens = text.split(' ');
  for (let i = 0; i < tokens.length; i++) {
    const chunkObj = {
      type: 'text',
      text: tokens[i] + (i < tokens.length - 1 ? ' ' : '')
    };
    res.write(`data: ${JSON.stringify(chunkObj)}\n\n`);
    // Adjust speed for organic reading pacing
    await sleep(20);
  }
}

app.listen(PORT, () => {
  console.log(`EcoWatt REST server listening on http://localhost:${PORT}`);
});
