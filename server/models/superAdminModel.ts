import { getSimPool as pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

import { logSeededFile, getActiveSeedInfo, calculateFileHash, clearActiveSeedInfo } from '../services/sqliteService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface HierarchyInterface {
  id: number;
  table: string;
  dependencies: number[];
  group: number[];
}

const hierarchy: HierarchyInterface[] = [
  { id: 1, table: 'employees', dependencies: [9, 37, 16], group: [1] },
  { id: 2, table: 'care_packages', dependencies: [1], group: [5] },
  { id: 3, table: 'care_package_item_details', dependencies: [2, 7], group: [5] },
  { id: 4, table: 'member_care_packages', dependencies: [1, 17], group: [3] },
  { id: 5, table: 'member_care_package_details', dependencies: [4, 7], group: [3] },
  { id: 6, table: 'member_care_package_transaction_logs', dependencies: [1, 5, 7], group: [3] },
  { id: 7, table: 'services', dependencies: [1, 8], group: [3, 5] },
  { id: 8, table: 'service_categories', dependencies: [], group: [3, 5] },
  { id: 9, table: 'positions', dependencies: [], group: [1] },
  { id: 11, table: 'refunds', dependencies: [1], group: [8] },
  { id: 12, table: 'refund_items', dependencies: [11], group: [8] },
  { id: 16, table: 'statuses', dependencies: [], group: [1] },
  { id: 17, table: 'members', dependencies: [37, 19], group: [1] },
  { id: 18, table: 'membership_accounts', dependencies: [17, 19, 16], group: [0] },
  { id: 19, table: 'membership_types', dependencies: [1], group: [1] },
  { id: 20, table: 'payment_methods', dependencies: [], group: [8] },
  { id: 21, table: 'product_categories', dependencies: [], group: [6] },
  { id: 22, table: 'products', dependencies: [], group: [6] },
  { id: 23, table: 'roles', dependencies: [], group: [1] },
  { id: 24, table: 'translations', dependencies: [], group: [10] },
  { id: 25, table: 'user_to_role', dependencies: [23, 37], group: [1] },
  { id: 26, table: 'appointments', dependencies: [17, 1], group: [9] },
  { id: 27, table: 'member_voucher_details', dependencies: [29, 7], group: [7] },
  { id: 28, table: 'member_voucher_transaction_logs', dependencies: [29, 1], group: [7] },
  { id: 29, table: 'member_vouchers', dependencies: [35, 1, 17], group: [7] },
  { id: 30, table: 'payment_to_sale_transactions', dependencies: [20, 32, 1], group: [8] },
  { id: 31, table: 'sale_transaction_items', dependencies: [32, 4, 29], group: [8] },
  { id: 32, table: 'sale_transactions', dependencies: [17, 1], group: [8] },
  { id: 33, table: 'timetables', dependencies: [], group: [9] },
  { id: 34, table: 'voucher_template_details', dependencies: [35, 7, 8], group: [7] },
  { id: 35, table: 'voucher_templates', dependencies: [1], group: [7] },
  { id: 36, table: 'system_parameters', dependencies: [], group: [11] },
  { id: 37, table: 'user_auth', dependencies: [], group: [1] },
  { id: 38, table: 'employee_to_position', dependencies: [1, 9], group: [1] },
];

const csvFolderPath = path.join(__dirname, '..', '..', 'seed');

/**
 * Implements Kahn's Algorithm for Topological Sort.
 *
 * This algorithm is used to find a linear ordering of vertices in a directed acyclic graph (DAG)
 * such that for every directed edge U -> V, vertex U comes before V in the ordering.
 *
 * In the context of database seeding with foreign key constraints, this means:
 * - Each database table is a 'vertex' (node).
 * - A foreign key relationship from a parent table (U) to a child table (V) is a 'directed edge' U -> V,
 * meaning 'U must be inserted before V'.
 * - indegree tracks the number of parent tables that must be inserted before this table.
 * - 'adj' (or adjacents) lists the child tables that depend on this table.
 *
 * https://www.geeksforgeeks.org/topological-sorting-indegree-based-solution/
 */
class HierarchyNode {
  id: number;
  name: string;
  indegree: number;
  adj: number[];

  constructor(id: number, tableName: string) {
    this.id = id;
    this.name = tableName;
    this.indegree = 0;
    this.adj = [];
  }
}

// Topological sorting with Kahn's algorithm
function getSeedingOrder(hierarchy: HierarchyInterface[]) {
  const graph: Map<number, HierarchyNode> = new Map();
  const tableNameMap = new Map();

  //  Initialize graph (nodes)
  hierarchy.forEach((tableInfo) => {
    if (graph.has(tableInfo.id)) {
      throw new Error(`Duplicate table ID detected: ${tableInfo.id} for table ${tableInfo.table}`);
    }
    const node = new HierarchyNode(tableInfo.id, tableInfo.table);
    graph.set(tableInfo.id, node);
    tableNameMap.set(tableInfo.table, tableInfo.id);
  });

  // Build edges
  hierarchy.forEach((tableInfo) => {
    const childNode = graph.get(tableInfo.id);
    if (!childNode) {
      throw new Error(`Internal error: Table ${tableInfo.table} (ID: ${tableInfo.id}) not found in graph.`);
    }

    tableInfo.dependencies.forEach((parentId) => {
      const parentNode = graph.get(parentId);
      if (!parentNode) {
        console.warn(
          `Warning: Parent table with ID '${parentId}' for '${tableInfo.table}' (ID: ${tableInfo.id}) not found in the provided hierarchy. This might indicate an incomplete or incorrect dependency definition.`
        );
        return;
      }
      // edge goes parent -> child
      // so child's indegree increses, parent's adj list includes the child
      parentNode.adj.push(childNode.id); // Parent points to child (by child's ID)
      childNode.indegree++; // Child depends on parent
    });
  });

  // Initialize queue with nodes having 0 indegree
  const queue: number[] = [];
  graph.forEach((node) => {
    if (node.indegree === 0) {
      queue.push(node.id); // Add ID to queue
    }
  });

  const seedingOrder = [];
  let _processedNodesCount = 0;

  while (queue.length > 0) {
    const currentTableId: number = queue.shift()!;
    const currentNode = graph.get(currentTableId);

    if (!currentNode) {
      console.error(`Internal error: Node with ID ${currentTableId} dequeued but not found in graph.`);
      continue;
    }

    seedingOrder.push(currentNode.name);
    _processedNodesCount++;

    // For each child
    currentNode.adj.forEach((childTableId) => {
      const childNode = graph.get(childTableId);
      if (childNode) {
        childNode.indegree--;
        if (childNode.indegree === 0) {
          queue.push(childNode.id);
        }
      }
    });
  }

  if (_processedNodesCount !== graph.size) {
    // If not all nodes were processed, there must be a cycle
    const remainingNodes = Array.from(graph.values())
      .filter((node) => node.indegree > 0)
      .map((node) => `${node.name} (ID: ${node.id})`);
    throw new Error(
      `Circular dependency detected in database schema. Cannot determine a valid seeding order. Remaining nodes (with non-zero in-degree): ${remainingNodes.join(
        ', '
      )}`
    );
  }

  return seedingOrder;
}

interface CsvRow {
  [key: string]: string | number | boolean | null;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        currentField += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  result.push(currentField);
  return result;
}

async function readCSVFile(filePath: string): Promise<CsvRow[]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const data: CsvRow[] = [];
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let isFirstLine = true;

  return new Promise((resolve, reject) => {
    rl.on('line', (line) => {
      if (!line.trim()) {
        return;
      }

      const values = parseCsvLine(line);

      if (isFirstLine) {
        headers = values.map((header) => header.trim());
        isFirstLine = false;
      } else {
        if (values.length !== headers.length) {
          console.warn(
            `Skipping malformed row in ${filePath}: data columns (${values.length}) do not match header columns (${headers.length}).`
          );
          return;
        }
        const rowObject: CsvRow = {};
        headers.forEach((header, index) => {
          // Attempt to convert values for better data typing for PostgreSQL
          let value: string | number | boolean | null = values[index]?.trim() || '';
          if (value === 'NULL' || value === '') {
            // Treat empty strings or 'NULL' as actual null
            value = null;
          } else if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
            // Check if it's a number
            value = Number(value);
          } else if (value.toLowerCase() === 'true') {
            value = true;
          } else if (value.toLowerCase() === 'false') {
            value = false;
          }
          rowObject[header] = value;
        });
        data.push(rowObject);
      }
    });

    rl.on('close', () => {
      resolve(data);
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}

async function insertRowIntoPg(client: any, tableName: string, rowData: CsvRow) {
  const columns = Object.keys(rowData)
    .map((col) => `"${col}"`)
    .join(', ');

  const placeholders = Object.keys(rowData)
    .map((_, i) => `$${i + 1}`)
    .join(', ');

  const values = Object.values(rowData);

  const sql = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders})`;

  try {
    await client.query(sql, values);
    console.log(`Inserted into ${tableName}: ${JSON.stringify(rowData)}`);
  } catch (error: any) {
    console.error(`Error inserting into ${tableName} row ${JSON.stringify(rowData)}: ${error.message}`);
    throw error;
  }
}

interface AllTableData {
  [tableName: string]: CsvRow[];
}

async function performDbInserts(tablesToTruncate: string[], orderedTables: string[], allTableData: AllTableData) {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    for (const tableName of tablesToTruncate) {
      try {
        await client.query(`DELETE FROM "${tableName}";`);
        console.log(`  Deleted from table: "${tableName}"`);

        const sequenceNameResult = await client.query(`
          SELECT pg_get_serial_sequence('"${tableName}"', 'id') AS sequence_name;
        `);
        const sequenceName = sequenceNameResult.rows[0]?.sequence_name;

        if (sequenceName) {
          await client.query(`ALTER SEQUENCE ${sequenceName} RESTART WITH 1;`);
          console.log(`   Reset sequence "${sequenceName}" for "${tableName}".`);
        }
      } catch (error: any) {
        console.error(`Error clearing table "${tableName}": ${error.message}`);
        throw new Error(`Failed to clear table "${tableName}". Check foreign key constraints. Error: ${error.message}`);
      }
    }

    for (const tableName of orderedTables) {
      const dataForTable = allTableData[tableName];
      if (dataForTable && dataForTable.length > 0) {
        console.log(`--- Seeding ${dataForTable.length} rows into table: "${tableName}" ---`);
        for (const row of dataForTable) {
          await insertRowIntoPg(client, tableName, row);
        }

        const sequenceNameResult = await client.query(`
            SELECT pg_get_serial_sequence('"${tableName}"', 'id') AS sequence_name;
          `);
        const sequenceName = sequenceNameResult.rows[0]?.sequence_name;

        if (sequenceName) {
          await client.query(
            `SELECT setval('${sequenceName}', COALESCE((SELECT MAX(id) FROM "${tableName}"), 1), true);`
          );
          console.log(`   Updated sequence "${sequenceName}" for "${tableName}".`);
        } else {
          console.warn(`   Could not find sequence for table "${tableName}" on column "id". Skipping sequence update.`);
        }
      } else {
        console.log(`  No data file found or no rows parsed for table: "${tableName}", skipping.`);
      }
    }

    await client.query('COMMIT');
    console.log('All data inserted in correct hierarchical order successfully!');
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Database seeding failed due to an error. Rolling back transaction.');
    console.error(error.message);
    throw error;
  } finally {
    client.release();
  }
}

function getAncestors(targetTableId: number, fullHierarchy: HierarchyInterface[]) {
  const ancestors = new Set<number>();
  const stack: number[] = [targetTableId];

  const tableMap = new Map<number, HierarchyInterface>(fullHierarchy.map((t) => [t.id, t]));

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    if (!ancestors.has(currentId)) {
      ancestors.add(currentId);
      const tableInfo = tableMap.get(currentId);
      if (tableInfo) {
        tableInfo.dependencies.forEach((parentId) => {
          stack.push(parentId);
        });
      }
    }
  }
  return ancestors;
}

function getDescendants(startNodeId: number, fullHierarchy: HierarchyInterface[]): Set<number> {
  const descendants = new Set<number>();
  const queue: number[] = [startNodeId];

  const parentToChildrenMap = new Map<number, number[]>();
  fullHierarchy.forEach((childTableInfo) => {
    childTableInfo.dependencies.forEach((parentId) => {
      if (!parentToChildrenMap.has(parentId)) {
        parentToChildrenMap.set(parentId, []);
      }
      parentToChildrenMap.get(parentId)!.push(childTableInfo.id);
    });
  });

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (!descendants.has(currentId)) {
      descendants.add(currentId); // Add the current node itself
      const children = parentToChildrenMap.get(currentId) || [];
      children.forEach((childId) => {
        queue.push(childId);
      });
    }
  }
  return descendants;
}

async function mergeData(filePath1: string, filePath2: string, targetTable: string, fileName: string): Promise<string> {
  const mergedDataMap = new Map<string, CsvRow>();

  const preData = await readCSVFile(filePath1);
  const postData = await readCSVFile(filePath2);

  preData.forEach((row) => {
    if (row.id) {
      mergedDataMap.set(String(row.id), row);
    }
  });

  postData.forEach((row) => {
    if (row.id) {
      mergedDataMap.set(String(row.id), row);
    }
  });

  const mergedData = Array.from(mergedDataMap.values());

  if (mergedData.length === 0) {
    return '';
  }

  const headers = Object.keys(mergedData[0]);
  const csvHeader = headers.join(',') + '\n';
  const csvBody = mergedData
    .map((row) => {
      return headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',')) return `"${stringValue}"`;
          return stringValue;
        })
        .join(',');
    })
    .join('\n');

  const csvContent = csvHeader + csvBody;

  const mergedDir = path.join(csvFolderPath, 'merged', targetTable);
  if (!fs.existsSync(mergedDir)) {
    fs.mkdirSync(mergedDir, { recursive: true });
  }

  const mergedFilePath = path.join(mergedDir, `${fileName}.csv`);
  await fs.promises.writeFile(mergedFilePath, csvContent, 'utf-8');

  return mergedFilePath;
}

function getTablesByGroupId(groupId: number): Set<number> {
  const tableIds = new Set<number>();

  hierarchy.forEach((table) => {
    if (table.group.includes(groupId)) {
      tableIds.add(table.id);
    }
  });

  return tableIds;
}

interface tablePayload {
  table: string;
  file: string;
  type: 'pre' | 'post' | 'merged';
}

const insertDataModel = async (targetTable: string, tablePayload: tablePayload[]) => {
  try {
    const targetTableInfo = hierarchy.find((f) => f.table === targetTable);

    if (!targetTableInfo) {
      throw new Error(`No valid target table "${targetTable}" found in hierarchy. Exiting seeding process.`);
    }

    const requiredTableIdsForInsert = getAncestors(targetTableInfo.id, hierarchy);

    targetTableInfo.group.forEach((groupId) => {
      const tablesInGroup = getTablesByGroupId(groupId);
      tablesInGroup.forEach((id) => {
        requiredTableIdsForInsert.add(id);
      });
    });

    console.log(`Including tables from groups ${targetTableInfo.group.join(', ')}`);

    const filteredHierarchyForInsert: HierarchyInterface[] = hierarchy.filter((tableInfo) =>
      requiredTableIdsForInsert.has(tableInfo.id)
    );
    let sortedOrderForInsert = getSeedingOrder(filteredHierarchyForInsert);
    console.log('First Sorted Order', sortedOrderForInsert);

    let tablesToIgnore: string[] = [];

    const secondPass = [];
    // First loop - identify merged tables and check files
    for (let i = 0; i < sortedOrderForInsert.length; i++) {
      const tableName = sortedOrderForInsert[i];
      const payloadEntry = tablePayload.find((p) => p.table === tableName);

      if (!payloadEntry || !payloadEntry.file) {
        throw new Error(
          `Seeding process for "${targetTable}" failed: Missing file information for dependency "${tableName}".`
        );
      }

      const fileNameWithoutExtension = payloadEntry.file;
      let csvFile;

      if (payloadEntry.type !== 'merged') {
        csvFile = path.join(csvFolderPath, payloadEntry.type, tableName, `${fileNameWithoutExtension}.csv`);
        if (!fs.existsSync(csvFile)) {
          throw new Error(
            `Seeding process for "${targetTable}" failed: File not found for dependency "${tableName}" at ${csvFile}.`
          );
        }
      } else {
        const mergedFilePath = path.join(csvFolderPath, 'merged', tableName, `${fileNameWithoutExtension}.csv`);
        if (fs.existsSync(mergedFilePath)) {
          csvFile = mergedFilePath;
        } else {
          const preCsvPath = path.join(csvFolderPath, 'pre', tableName, `${fileNameWithoutExtension}.csv`);
          const postCsvPath = path.join(csvFolderPath, 'post', tableName, `${fileNameWithoutExtension}.csv`);

          if (!fs.existsSync(preCsvPath)) {
            throw new Error(`Merging failed for "${tableName}": "pre" file not found at ${preCsvPath}.`);
          }
          if (!fs.existsSync(postCsvPath)) {
            throw new Error(`Merging failed for "${tableName}": "post" file not found at ${postCsvPath}.`);
          }

          csvFile = await mergeData(preCsvPath, postCsvPath, tableName, fileNameWithoutExtension);
        }
        secondPass.push(tableName); // Add to secondPass for merged tables
      }

      const activeInfo = await getActiveSeedInfo(tableName, payloadEntry.type);
      const currentHash = await calculateFileHash(csvFile);

      if (activeInfo && activeInfo.file_content_hash === currentHash && payloadEntry.type !== 'merged') {
        tablesToIgnore.push(sortedOrderForInsert[i]);
      }
    }

    console.log('First Pass', tablesToIgnore);

    // Build a set of all tables that must be processed due to merged data dependencies
    const mustProcessTables = new Set<string>();

    // For each merged table, include all its descendants
    secondPass.forEach((mergedTable) => {
      const mergedTableInfo = hierarchy.find((h) => h.table === mergedTable);

      if (!mergedTableInfo) {
        throw new Error(`No valid table "${mergedTable}" found in hierarchy. Exiting seeding process.`);
      }

      // Get all tables that depend on this merged table
      const descendantIds = getAncestors(mergedTableInfo.id, hierarchy);

      // Add the merged table itself and all its descendants to the must-process set
      mustProcessTables.add(mergedTable);

      hierarchy.forEach((table) => {
        if (descendantIds.has(table.id)) {
          mustProcessTables.add(table.table);
        }
      });

      // Also add any tables from the same groups as the merged table
      // mergedTableInfo.group.forEach((groupId) => {
      //   hierarchy.forEach((table) => {
      //     if (table.group.includes(groupId)) {
      //       mustProcessTables.add(table.table);
      //     }
      //   });
      // });
    });

    // Remove any tables that must be processed from the ignore list
    tablesToIgnore = tablesToIgnore.filter((tableName) => !mustProcessTables.has(tableName));

    console.log('Must process tables due to merged data:', Array.from(mustProcessTables));
    console.log('Final ignored tables:', tablesToIgnore);

    const finalOrderToSeed =
      tablesToIgnore.length !== 0
        ? sortedOrderForInsert.filter((table) => !tablesToIgnore.includes(table))
        : sortedOrderForInsert;

    const allAffectedTableIds = new Set<number>();
    finalOrderToSeed.forEach((tableName) => {
      const tableInfo = hierarchy.find((t) => t.table === tableName);
      if (tableInfo) {
        const descendants = getDescendants(tableInfo.id, hierarchy);
        descendants.forEach((descendantId) => allAffectedTableIds.add(descendantId));
      }
    });

    const fullSortedOrder = getSeedingOrder(hierarchy);
    const tablesToTruncate: string[] = fullSortedOrder
      .filter((tableName) => {
        const id = hierarchy.find((t) => t.table === tableName && !tablesToIgnore.includes(tableName))?.id;
        return id !== undefined && allAffectedTableIds.has(id);
      })
      .reverse();

    console.log('Truncate Order', tablesToTruncate);

    const allTableData: AllTableData = {};

    for (const tableName of finalOrderToSeed) {
      const payloadEntry = tablePayload.find((f) => f.table === tableName);
      if (payloadEntry) {
        const fileNameWithoutExtension = payloadEntry.file;
        let csvFilePath;
        if (payloadEntry.type === 'merged') {
          csvFilePath = path.join(csvFolderPath, 'merged', tableName, `${fileNameWithoutExtension}.csv`);
        } else {
          csvFilePath = path.join(csvFolderPath, payloadEntry.type, tableName, `${fileNameWithoutExtension}.csv`);
        }

        if (fs.existsSync(csvFilePath)) {
          console.log(`Reading data for "${fileNameWithoutExtension}" from: ${csvFilePath}`);
          allTableData[tableName] = await readCSVFile(csvFilePath);
        } else {
          throw new Error(`No CSV file found for table "${tableName}" at ${csvFilePath}. Exiting seeding process.`);
        }
      }
    }

    await performDbInserts(tablesToTruncate, finalOrderToSeed, allTableData);

    for (const tableName of finalOrderToSeed) {
      const payloadEntry = tablePayload.find((f) => f.table === tableName);
      if (payloadEntry) {
        const fileNameWithoutExtension = payloadEntry.file;
        let csvFilePath;
        if (payloadEntry.type === 'merged') {
          csvFilePath = path.join(csvFolderPath, 'merged', tableName, `${fileNameWithoutExtension}.csv`);
        } else {
          csvFilePath = path.join(csvFolderPath, payloadEntry.type, tableName, `${fileNameWithoutExtension}.csv`);
        }
        try {
          if (fs.existsSync(csvFilePath)) {
            const fileHash = await calculateFileHash(csvFilePath);
            await logSeededFile(tableName, payloadEntry.type, fileNameWithoutExtension, fileHash);
          }
        } catch (logError: any) {
          console.error(
            `[saModel] Failed to log active seed status for ${payloadEntry.type}/${tableName}/${fileNameWithoutExtension}.csv: ${logError.message}`
          );
        }
      }
    }

    return {
      message: `Seeding for specific tables ${targetTable} completed.`,
      tables: finalOrderToSeed,
    };
  } catch (error: any) {
    console.error('Error in insertDataModel', error.message);
    throw error;
  }
};

const getPreDataModel = async (tableName: string, fileName: string) => {
  const filePath = path.join(csvFolderPath, 'pre', tableName, `${fileName}.csv`);
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`[saModel] Pre-data file not found for table "${tableName}" at ${filePath}.`);
    }

    const parsedCsvData: CsvRow[] = await readCSVFile(filePath);

    if (!parsedCsvData || (parsedCsvData.length === 0 && !fs.readFileSync(filePath, 'utf8').trim())) {
      throw new Error(`[saModel] Pre-data CSV for table "${tableName}" is empty.`);
    }

    if (!parsedCsvData || parsedCsvData.length === 0) {
      throw new Error(
        `[saModel] Pre-data CSV for table "${tableName}" yielded no data, or headers could not be parsed.`
      );
    }

    const headers = Object.keys(parsedCsvData[0]);
    if (headers.length === 0) {
      throw new Error(`[saModel] Could not derive headers for post-data table "${tableName}".`);
    }

    const spreadsheetHeaderRow = headers.map((header) => ({ value: String(header) }));
    const spreadsheetDataRows = parsedCsvData.map((row) =>
      headers.map((headerKey) => ({
        value: row[headerKey] === null || row[headerKey] === undefined ? '' : String(row[headerKey]),
      }))
    );

    const finalSpreadsheetData = [spreadsheetHeaderRow, ...spreadsheetDataRows];

    return finalSpreadsheetData;
  } catch (error) {
    console.error('Error in getPreDataModel', error);
    throw new Error('Error in getPreDataModel');
  }
};

const getPostDataModel = async (tableName: string, fileName: string) => {
  const filePath = path.join(csvFolderPath, 'post', tableName, `${fileName}.csv`);
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`[saModel] Post-data file not found for table "${tableName}" at ${filePath}.`);
    }

    const parsedCsvData: CsvRow[] = await readCSVFile(filePath);

    if (!parsedCsvData || (parsedCsvData.length === 0 && !fs.readFileSync(filePath, 'utf8').trim())) {
      throw new Error(`[saModel] Post-data CSV for table "${tableName}" is empty.`);
    }

    if (!parsedCsvData || parsedCsvData.length === 0) {
      throw new Error(
        `[saModel] Post-data CSV for table "${tableName}" yielded no data, or headers could not be parsed.`
      );
    }

    const headers = Object.keys(parsedCsvData[0]);
    if (headers.length === 0) {
      throw new Error(`[saModel] Could not derive headers for post-data table "${tableName}".`);
    }

    const spreadsheetHeaderRow = headers.map((header) => ({ value: String(header) }));
    const spreadsheetDataRows = parsedCsvData.map((row) =>
      headers.map((headerKey) => ({
        value: row[headerKey] === null || row[headerKey] === undefined ? '' : String(row[headerKey]),
      }))
    );

    const finalSpreadsheetData = [spreadsheetHeaderRow, ...spreadsheetDataRows];

    return finalSpreadsheetData;
  } catch (error) {
    console.error('Error in getPostDataModel', error);
    throw new Error('Error in getPostDataModel');
  }
};

const getMergedDataModel = async (tableName: string, fileName: string) => {
  const mergedDir = path.join(csvFolderPath, 'merged', tableName);
  const mergedFilePath = path.join(mergedDir, `${fileName}.csv`);

  try {
    // If merged file doesn't exist, create it from pre and post files.
    if (!fs.existsSync(mergedFilePath)) {
      const preCsvPath = path.join(csvFolderPath, 'pre', tableName, `${fileName}.csv`);
      const postCsvPath = path.join(csvFolderPath, 'post', tableName, `${fileName}.csv`);

      if (!fs.existsSync(preCsvPath) || !fs.existsSync(postCsvPath)) {
        throw new Error(
          `Cannot create merged file for "${tableName}/${fileName}" because either the 'pre' or 'post' version is missing.`
        );
      }
      // The mergeData function will create and save the file.
      await mergeData(preCsvPath, postCsvPath, tableName, fileName);
    }

    const parsedCsvData: CsvRow[] = await readCSVFile(mergedFilePath);

    if (!parsedCsvData || parsedCsvData.length === 0) {
      throw new Error(`[saModel] Merged data CSV for table "${tableName}" is empty or could not be parsed.`);
    }

    const headers = Object.keys(parsedCsvData[0]);
    const spreadsheetHeaderRow = headers.map((header) => ({ value: String(header) }));
    const spreadsheetDataRows = parsedCsvData.map((row) =>
      headers.map((headerKey) => ({
        value: row[headerKey] === null || row[headerKey] === undefined ? '' : String(row[headerKey]),
      }))
    );

    return [spreadsheetHeaderRow, ...spreadsheetDataRows];
  } catch (error: any) {
    console.error(`Error in getMergedDataModel for ${tableName}/${fileName}:`, error.message);
    throw error; // Re-throw the original error to be handled by the controller
  }
};

const getAllExistingTablesModel = async () => {
  try {
    const existingTables = [];
    const tableNamesFromHierarchy = hierarchy.map((m) => m.table);

    for (const tableName of tableNamesFromHierarchy) {
      const preFilePath = path.join(csvFolderPath, 'pre', tableName);
      const postFilePath = path.join(csvFolderPath, 'post', tableName);

      let preFileExists = false;
      let postFileExists = false;

      if (fs.existsSync(preFilePath)) {
        try {
          const files = await fs.promises.readdir(preFilePath);
          preFileExists = files.filter((file) => file.endsWith('.csv')).length > 0;
        } catch (err) {
          console.warn(`Could not read pre data directory for ${tableName}:`, err);
        }
      }

      if (fs.existsSync(postFilePath)) {
        try {
          const files = await fs.promises.readdir(postFilePath);
          postFileExists = files.filter((file) => file.endsWith('.csv')).length > 0;
        } catch (err) {
          console.warn(`Could not read post data directory for ${tableName}:`, err);
        }
      }

      existingTables.push({
        name: tableName,
        pre: preFileExists,
        post: postFileExists,
      });
    }

    return existingTables;
  } catch (error) {
    console.error('Error in getAllExistingTablesModel:', error);
    throw new Error('Error scanning for existing seed tables');
  }
};
const getCurrentSeedingOrderModel = async () => {
  try {
    const order = getSeedingOrder(hierarchy);
    return order;
  } catch (error: any) {
    console.error('Error in getCurrentSeedingOrderModel:', error.message);
    // Re-throw the error to be caught by the controller, including the detailed message
    throw new Error('Error calculating seeding order: ' + error.message);
  }
};

const getOrdersForTableModel = async (tableName: string) => {
  try {
    const targetTableInfo = hierarchy.find((f) => f.table === tableName);

    if (!targetTableInfo) {
      throw new Error(`No valid target table "${tableName}" found in hierarchy. Exiting seeding process.`);
    }

    const requiredTableIdsForInsert = getAncestors(targetTableInfo.id, hierarchy);
    targetTableInfo.group.forEach((groupId) => {
      const tablesInGroup = getTablesByGroupId(groupId);
      tablesInGroup.forEach((id) => {
        requiredTableIdsForInsert.add(id);
      });
    });
    const filteredHierarchyForInsert: HierarchyInterface[] = hierarchy.filter((tableInfo) =>
      requiredTableIdsForInsert.has(tableInfo.id)
    );
    const sortedOrderForInsert = getSeedingOrder(filteredHierarchyForInsert);

    const affectedTableIdsForTruncate = getDescendants(targetTableInfo.id, hierarchy);

    const fullSortedOrder = getSeedingOrder(hierarchy);
    const tablesToTruncate: string[] = fullSortedOrder
      .filter((name) => {
        const id = hierarchy.find((t) => t.table === name)?.id;
        return id !== undefined && affectedTableIdsForTruncate.has(id);
      })
      .reverse();

    return {
      sortedOrderForInsert,
      tablesToTruncate,
    };
  } catch (error) {
    console.error('Error in insertPostDataModel', error);
    throw new Error('Error in insertPostDataModel');
  }
};

export interface SeedFileStatus {
  name: string;
  hash: string | null;
  isLive: boolean;
}

const getPreDataFilesModel = async (tableName: string) => {
  const directoryPath = path.join(csvFolderPath, 'pre', tableName);
  const results: SeedFileStatus[] = [];

  try {
    if (!fs.existsSync(directoryPath)) {
      // console.log(`[saModel] Pre-data directory not found for table "${tableName}". Returning empty list.`);
      return []; // Expected behavior if directory doesn't exist
    }

    const files = await fs.promises.readdir(directoryPath);
    const csvFiles = files.filter((file) => file.endsWith('.csv'));

    if (csvFiles.length === 0) return [];

    const activeInfo = await getActiveSeedInfo(tableName, 'pre');

    for (const file of csvFiles) {
      const fileNameWithoutExtension = file.replace(/\.csv$/, '');
      const fullFilePath = path.join(directoryPath, file);
      let currentHash: string | null = null;
      let isLive = false;

      try {
        currentHash = await calculateFileHash(fullFilePath);
        if (
          activeInfo &&
          activeInfo.file_name === fileNameWithoutExtension &&
          activeInfo.file_content_hash === currentHash
        ) {
          isLive = true;
        }
      } catch (hashError: any) {
        console.warn(`[saModel] Could not calculate hash for pre/${tableName}/${file}: ${hashError.message}`);
        // Keep hash as null, isLive remains false
      }

      results.push({
        name: fileNameWithoutExtension,
        hash: currentHash,
        isLive: isLive,
      });
    }
    return results;
  } catch (error: any) {
    console.error(`[saModel] Error reading pre-data files for table "${tableName}":`, error.message);
    // Avoid throwing generic error, let controller handle specific http status
    throw new Error(`Failed to fetch pre-data files for table "${tableName}".`);
  }
};

const getPostDataFilesModel = async (tableName: string) => {
  const directoryPath = path.join(csvFolderPath, 'post', tableName);
  const results: SeedFileStatus[] = [];

  try {
    if (!fs.existsSync(directoryPath)) {
      // console.log(`[saModel] Post-data directory not found for table "${tableName}". Returning empty list.`);
      return [];
    }
    const files = await fs.promises.readdir(directoryPath);

    const csvFiles = files.filter((file) => file.endsWith('.csv'));

    if (csvFiles.length === 0) return [];

    const activeInfo = await getActiveSeedInfo(tableName, 'post');

    for (const file of csvFiles) {
      const fileNameWithoutExtension = file.replace(/\.csv$/, '');
      const fullFilePath = path.join(directoryPath, file);
      let currentHash: string | null = null;
      let isLive = false;

      try {
        currentHash = await calculateFileHash(fullFilePath);
        if (
          activeInfo &&
          activeInfo.file_name === fileNameWithoutExtension &&
          activeInfo.file_content_hash === currentHash
        ) {
          isLive = true;
        }
      } catch (hashError: any) {
        console.warn(`[saModel] Could not calculate hash for post/${tableName}/${file}: ${hashError.message}`);
      }

      results.push({
        name: fileNameWithoutExtension,
        hash: currentHash,
        isLive: isLive,
      });
    }
    return results;
  } catch (error: any) {
    console.error(`[saModel] Error reading post-data files for table "${tableName}":`, error.message);
    throw new Error(`Failed to fetch post-data files for table "${tableName}".`);
  }
};

const deleteSeedDataFileModel = async (
  dataType: 'pre' | 'post' | 'merged',
  tableName: string,
  fileName: string
): Promise<void> => {
  const directoryPath = path.join(csvFolderPath, dataType, tableName);
  const filePath = path.join(directoryPath, `${fileName}.csv`);

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${dataType}/${tableName}/${fileName}.csv`);
    }
    await fs.promises.unlink(filePath);
    console.log(`[saModel] Successfully deleted file: ${filePath}`);

    // Merged files don't have a "live" status in the same way, so we only clear for pre/post
    if (dataType === 'pre' || dataType === 'post') {
      const activeInfo = await getActiveSeedInfo(tableName, dataType);
      if (activeInfo && activeInfo.file_name === fileName) {
        await clearActiveSeedInfo(tableName, dataType);
        console.log(`[saModel] Cleared active seed status for deleted file: ${dataType}/${tableName}/${fileName}.csv`);
      }
    }
  } catch (error: any) {
    console.error(
      `[saModel] Error deleting ${dataType}-data file "${fileName}.csv" for table "${tableName}":`,
      error.message
    );
    if (error instanceof Error && error.message.startsWith('File not found')) {
      throw error;
    }
    // Rethrow with a more specific message if needed, or let the original error propagate
    throw new Error(`Failed to delete file ${dataType}/${tableName}/${fileName}.csv: ${error.message}`);
  }
};

const mergeDataFilesModel = async (tableName: string, fileName: string): Promise<string> => {
  const preCsvPath = path.join(csvFolderPath, 'pre', tableName, `${fileName}.csv`);
  const postCsvPath = path.join(csvFolderPath, 'post', tableName, `${fileName}.csv`);

  if (!fs.existsSync(preCsvPath)) {
    throw new Error(`Pre-data file not found for ${tableName}/${fileName}.`);
  }

  if (!fs.existsSync(postCsvPath)) {
    throw new Error(`Post-data file not found for ${tableName}/${fileName}.`);
  }

  // Use the existing mergeData function to combine files
  const mergedFilePath = await mergeData(preCsvPath, postCsvPath, tableName, fileName);

  if (!mergedFilePath) {
    throw new Error(`Failed to merge data files for ${tableName}/${fileName}.`);
  }

  return mergedFilePath;
};

export default {
  insertDataModel,
  getPreDataModel,
  getPostDataModel,
  getMergedDataModel,
  getAllExistingTablesModel,
  getCurrentSeedingOrderModel,
  getOrdersForTableModel,
  getPreDataFilesModel,
  getPostDataFilesModel,
  deleteSeedDataFileModel,
  mergeDataFilesModel,
};
