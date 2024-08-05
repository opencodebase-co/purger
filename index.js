const axios = require('axios');
const chalk = require('chalk');
const config = require('./config.json');

const headers = {
  'Authorization': `Bearer ${config.apiKey}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

const fetchAllServers = async () => {
  console.log(chalk.blue('[WORKER] Fetching servers...'));
  let allServers = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    try {
      const response = await axios.get(`${config.panelUrl}/api/application/servers`, {
        headers,
        params: {
          page,
          per_page: perPage
        }
      });
      const servers = response.data.data;
      if (servers.length === 0) break;
      allServers = allServers.concat(servers);
      page += 1;
    } catch (error) {
      console.error(chalk.red('[WORKER] Error getting servers:'), error.message);
      break;
    }
  }

  console.log(chalk.green(`[WORKER] Fetched ${allServers.length} Servers.`));
  return allServers;
};

const deleteServer = async (serverId) => {
  console.log(chalk.yellow(`[WORKER] Deleting server ${serverId}...`));
  try {
    await axios.delete(`${config.panelUrl}/api/application/servers/${serverId}`, { headers });
    console.log(chalk.green(`[WORKER] Deleted ${serverId}`));
  } catch (error) {
    console.error(chalk.red(`[WORKER] Error deleting ${serverId}:`), error.message);
  }
};

const purgeServers = async () => {
  const servers = await fetchAllServers();
  if (servers.length === 0) {
    console.log(chalk.yellow('[WORKER] ❤ Finished ❤'));
    return;
  }
  for (const server of servers) {
    const serverName = server.attributes.name;
    const nodeId = server.attributes.node;
    console.log(chalk.cyan(`[WORKER] Processing: ${serverName} on node ${nodeId}`));
    if (config.nodeIds.includes(nodeId) && !serverName.includes(config.excludedNameKeyword)) {
      console.log(chalk.red(`[WORKER] Deleting: '${serverName}'`));
      await deleteServer(server.attributes.id);
    } else {
      console.log(chalk.green(`[WORKER] Not deleting: ${serverName} contains '${config.excludedNameKeyword}' or is not on a specified node.`));
    }
  }
};

const main = async () => {
  while (true) {
    console.log(chalk.blue('[WORKER] Initialising...'));
    console.log(chalk.blue('[WORKER] Made with ❤ by opencodebase.co.'));
    try {
      await purgeServers();
      console.log(chalk.green('[WORKER] Completed successfully.'));
    } catch (error) {
      console.error(chalk.red('[WORKER] Error:'), error);
    }
    console.log(chalk.blackBright('[WORKER] Waiting...'));
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
};

main().catch(error => console.error(chalk.red('[WORKER] Unexpected error:'), error));
