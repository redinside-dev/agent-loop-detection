const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'agent-state.json');

function loadAgentState() {
  if (!fs.existsSync(configPath)) {
    return [];
  }
  const data = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(data);
}

function computeStateHash(state) {
  return JSON.stringify(state);
}

function detectLoops(agentStates) {
  const seen = new Map();
  const loops = [];

  agentStates.forEach((state) => {
    const hash = computeStateHash(state);
    if (seen.has(state.id)) {
      const prev = seen.get(state.id);
      if (prev.hash === hash) {
        prev.count += 1;
        if (prev.count >= state.threshold) {
          loops.push({ agent: state.id, hash, count: prev.count });
        }
      } else {
        seen.set(state.id, { hash, count: 1, last: state.timestamp });
      }
    } else {
      seen.set(state.id, { hash, count: 1, last: state.timestamp });
    }
  });

  return loops;
}

function reportLoops(loops) {
  loops.forEach((loop) => {
    console.log(`Loop detected: Agent=${loop.agent} hash=${loop.hash} count=${loop.count}`);
  });
}

function main() {
  const state = loadAgentState();
  const loops = detectLoops(state);
  if (loops.length > 0) {
    reportLoops(loops);
  } else {
    console.log('No loops detected');
  }
}

if (require.main === module) {
  main();
}