import { getSimPool as pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface HierarchyInterface {
  id: number;
  table: string;
  dependencies: number[];
}

const hierarchy: HierarchyInterface[] = [
  { id: 1, table: 'employees', dependencies: [] },
  { id: 2, table: 'care_packages', dependencies: [1] },
  { id: 3, table: 'care_package_item_details', dependencies: [2] },
  { id: 4, table: 'member_care_packages', dependencies: [1] },
  { id: 5, table: 'member_care_package_details', dependencies: [4, 7] },
  { id: 6, table: 'member_care_package_transaction_logs', dependencies: [5, 7] },
  { id: 7, table: 'services', dependencies: [8] },
  { id: 8, table: 'service_categories', dependencies: [] },
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

const parseCsvLine = (line: string): string[] => {
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
};

const readCSVFile = async (filePath: string): Promise<CsvRow[]> => {
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
};

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

async function performDbInserts(orderedTables: string[], allTableData: AllTableData) {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    for (const tableName of orderedTables) {
      const dataForTable = allTableData[tableName];
      if (dataForTable && dataForTable.length > 0) {
        console.log(`--- Seeding ${dataForTable.length} rows into table: "${tableName}" ---`);
        for (const row of dataForTable) {
          await insertRowIntoPg(client, tableName, row);
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

const insertPreDataModel = async (tableName: string) => {
  try {
    const targetTableId = hierarchy.find((f) => f.table === tableName)?.id;

    if (!targetTableId) {
      throw new Error('No valid target tables found in hierarchy. Exiting seeding process.');
    }

    const requiredTableIds = getAncestors(targetTableId, hierarchy);
    const filteredHierarchy: HierarchyInterface[] = hierarchy.filter((tableInfo) => requiredTableIds.has(tableInfo.id));
    const sortedOrderForSubset = getSeedingOrder(filteredHierarchy);
    const allTableData: AllTableData = {};

    for (const tableName of sortedOrderForSubset) {
      const csvFilePath = path.join(csvFolderPath, 'pre', `${tableName}.csv`);
      if (fs.existsSync(csvFilePath)) {
        console.log(`Reading data for "${tableName}" from: ${csvFilePath}`);
        allTableData[tableName] = await readCSVFile(csvFilePath);
      } else {
        throw new Error(`No CSV file found for table "${tableName}" at ${csvFilePath}. Exiting seeding process.`);
      }
    }

    await performDbInserts(sortedOrderForSubset, allTableData);
    console.log(`Seeding for specific tables ${tableName} completed.`);
  } catch (error) {
    console.error('Error in insertPreDataModel', error);
    throw new Error('Error in insertPreDataModel');
  }
};

const insertPostDataModel = async (tableName: string) => {
  try {
    const targetTableId = hierarchy.find((f) => f.table === tableName)?.id;

    if (!targetTableId) {
      throw new Error('No valid target tables found in hierarchy. Exiting seeding process.');
    }

    const requiredTableIds = getAncestors(targetTableId, hierarchy);
    const filteredHierarchy: HierarchyInterface[] = hierarchy.filter((tableInfo) => requiredTableIds.has(tableInfo.id));
    const sortedOrderForSubset = getSeedingOrder(filteredHierarchy);
    const allTableData: AllTableData = {};

    for (const tableName of sortedOrderForSubset) {
      const csvFilePath = path.join(csvFolderPath, 'post', `${tableName}.csv`);
      if (fs.existsSync(csvFilePath)) {
        console.log(`Reading data for "${tableName}" from: ${csvFilePath}`);
        allTableData[tableName] = await readCSVFile(csvFilePath);
      } else {
        throw new Error(`No CSV file found for table "${tableName}" at ${csvFilePath}. Exiting seeding process.`);
      }
    }

    await performDbInserts(sortedOrderForSubset, allTableData);
    console.log(`Seeding for specific tables ${tableName} completed.`);
  } catch (error) {
    console.error('Error in insertPostDataModel', error);
    throw new Error('Error in insertPostDataModel');
  }
};

const getPreDataModel = async (tableName: string) => {
  const filePath = path.join(csvFolderPath, 'pre', `${tableName}.csv`);
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
    console.error('Error in getPreDataModel', error);
    throw new Error('Error in getPreDataModel');
  }
};

const getPostDataModel = async (tableName: string) => {
  const filePath = path.join(csvFolderPath, 'post', `${tableName}.csv`);
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

const getAllExistingTablesModel = async () => {
  try {
    const existingTables = [];
    const tableNamesFromHierarchy = hierarchy.map((m) => m.table);

    for (const tableName of tableNamesFromHierarchy) {
      const preFilePath = path.join(csvFolderPath, 'pre', `${tableName}.csv`);
      const postFilePath = path.join(csvFolderPath, 'post', `${tableName}.csv`);

      const preFileExists = fs.existsSync(preFilePath);
      const postFileExists = fs.existsSync(postFilePath);

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

export default {
  insertPreDataModel,
  insertPostDataModel,
  getPreDataModel,
  getPostDataModel,
  getAllExistingTablesModel,
};
