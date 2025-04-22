import React, { useState, useEffect } from 'react';
import { Tabs, Button, Card, Stack, Text, Table, Box } from "@chakra-ui/react";
import { LuShoppingCart, LuBath, LuBox, LuBadgeCheck } from "react-icons/lu";
import Navbar from '@/components/Navbar';
import { api } from '@/interceptors/axios';

const RevenueReport = () => {
  const [apiSuccess, setApiSuccess] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mCreditData, setMCreditData] = useState([]);
  const [MCPMergedData, setMCPMergedData] = useState([]); // New state for merged data member care package
  const [AdHocProductDATA, setAdHocProductDATA] = useState([]); // New state for adhoc product data
  const [AdHocServiceDATA, setAdHocServiceDATA] = useState([]); // New state for adhoc service data

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch the date range from the API when the component mounts
  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const response = await api.get("/iv/range");
        const data = response.data;
        setDateRange(data[0]);

        // Set the initial selected year and month to the earliest available date
        const earliestDate = new Date(data[0].earliest_invoice_created_at);
        setSelectedYear(earliestDate.getFullYear().toString());
        setSelectedMonth((earliestDate.getMonth() + 1).toString().padStart(2, '0'));
      } catch (error) {
        console.error("Error fetching date range:", error);
      }
    };

    fetchDateRange();
  }, []);

  // Function to handle month change
  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  // Function to handle year change
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // Function to fetch and merge data from additional APIs
  const fetchAndMergeData = async (month, year) => {
    try {
      // Define API URLs
      const mcpUrl = `/rev/mcp/payment/${month}/${year}/grouped`;
      const vipRefundUrl = `/ns/vip&refund/${month}/${year}/grouped`;

      // Fetch both APIs in parallel
      const [mcpResponse, vipRefundResponse] = await Promise.all([
        api.get(mcpUrl),
        api.get(vipRefundUrl),
      ]);

      // Extract data from responses
      const mcpData = mcpResponse.data;
      const vipRefundData = vipRefundResponse.data;

      // Merge data by matching days
      const MCPMergedData = mcpData.map(mcpItem => {
        const vipRefundItem = vipRefundData.find(vipItem => vipItem.day === mcpItem.day) || {
          vipsalesTotal: 0,
          refundTotal: 0
        };

        return {
          day: mcpItem.day,
          cash: mcpItem.cash,
          visaMaster: mcpItem.visaMaster,
          paynow: mcpItem.paynow,
          nets: mcpItem.nets,
          total: mcpItem.total,
          vipsalesTotal: vipRefundItem.vipsalesTotal,
          refundTotal: vipRefundItem.refundTotal
        };
      });

      return MCPMergedData;
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  };
  
  // Function to fetch AdHoc Product data from API
  const fetchadhocProductsData = async (month, year) => {
    try {
      const adhocProductURL = `/iv/adhoc/product/${month}/${year}/grouped`;

      // Remove Promise.all() since it's only one request
      const response = await api.get(adhocProductURL);

      return response.data; // Extract data from the response

    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  };

  // Function to fetch AdHoc Service data from API
  const fetchadhocServicesData = async (month, year) => {
    try {
      const adhocServiceURL = `/iv/adhoc/service/${month}/${year}/grouped`;

      // Remove Promise.all() since it's only one request
      const response = await api.get(adhocServiceURL);

      return response.data; // Extract data from the response

    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  };


  // Function to handle "Get Details" button click
  const handleSelect = async () => {
    if (!dateRange) return;

    const selectedYearNum = parseInt(selectedYear, 10);
    const selectedMonthNum = parseInt(selectedMonth, 10);

    const earliestDate = new Date(dateRange.earliest_invoice_created_at);
    const latestDate = new Date(dateRange.latest_invoice_created_at);

    const earliestYear = earliestDate.getFullYear();
    const earliestMonth = earliestDate.getMonth() + 1;

    const latestYear = latestDate.getFullYear();
    const latestMonth = latestDate.getMonth() + 1;

    const isWithinRange =
      (selectedYearNum > earliestYear ||
        (selectedYearNum === earliestYear && selectedMonthNum >= earliestMonth)) &&
      (selectedYearNum < latestYear ||
        (selectedYearNum === latestYear && selectedMonthNum <= latestMonth));

    if (isWithinRange) {
      setLoading(true);
      setApiSuccess(false); // Reset success state

      try {
        // Fetch revenue data
        const response = await api.get(`/iv/ma/m&y/${selectedMonth}/${selectedYear}/grouped`);

        const data = response.data;
        setMCreditData(data);

        // Fetch and merge additional data
        const MCPMergedData = await fetchAndMergeData(selectedMonth, selectedYear);
        setMCPMergedData(MCPMergedData);

        // Fetch adhoc product data
        const AdHocProductReturn = await fetchadhocProductsData(selectedMonth, selectedYear);
        setAdHocProductDATA(AdHocProductReturn);

        // Fetch adhoc service data
        const AdHocServiceReturn = await fetchadhocServicesData(selectedMonth, selectedYear);
        setAdHocServiceDATA(AdHocServiceReturn);

        setApiSuccess(true); // Mark API call as successful
      } catch (error) {
        console.error("Error fetching revenue data:", error);
        alert("Failed to fetch revenue data. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      alert(
        `You can select from ${earliestDate.toLocaleString("default", {
          month: "long",
        })} ${earliestYear} to ${latestDate.toLocaleString("default", {
          month: "long",
        })} ${latestYear}`
      );
    }
  };

  const monthName = selectedMonth ? monthNames[parseInt(selectedMonth) - 1] : null;

  return (
    <div>
      <Navbar />

      {/* cards */}
      <Stack gap="4" direction="column" wrap="wrap" align="center" justify="center" my="8">
        {/* First Card - Monthly Revenue Report */}
        <Card.Root width="30vw" height="150px" variant="elevated" bg="blue.100">
          <Card.Body gap="2">
            <Card.Title mb="2" textAlign="center">
              <Text fontWeight="bold" textStyle="2xl">Monthly Revenue Report</Text>
            </Card.Title>
          </Card.Body>
          <Card.Footer justifyContent="center">
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              {dateRange && (
                Array.from(
                  { length: new Date(dateRange.latest_invoice_created_at).getFullYear() - new Date(dateRange.earliest_invoice_created_at).getFullYear() + 1 },
                  (_, i) => new Date(dateRange.earliest_invoice_created_at).getFullYear() + i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))
              )}
            </select>

            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              {monthNames.map((month, index) => {
                const monthValue = (index + 1).toString().padStart(2, '0');

                const selectedYearNum = parseInt(selectedYear, 10);
                const selectedMonthNum = parseInt(monthValue, 10);

                let isDisabled = false;

                if (dateRange) {
                  const earliestDate = new Date(dateRange.earliest_invoice_created_at);
                  const latestDate = new Date(dateRange.latest_invoice_created_at);

                  const earliestYear = earliestDate.getFullYear();
                  const earliestMonth = earliestDate.getMonth() + 1;

                  const latestYear = latestDate.getFullYear();
                  const latestMonth = latestDate.getMonth() + 1;

                  isDisabled =
                    (selectedYearNum < earliestYear ||
                      (selectedYearNum === earliestYear && selectedMonthNum < earliestMonth)) ||
                    (selectedYearNum > latestYear ||
                      (selectedYearNum === latestYear && selectedMonthNum > latestMonth));
                }

                return (
                  <option
                    key={monthValue}
                    value={monthValue}
                    disabled={isDisabled}
                    className={isDisabled ? "text-gray-400 opacity-50" : "text-black"}
                  >
                    {month}
                  </option>
                );
              })}
            </select>

            <Button
              p="3"
              bg="purple.400"
              onClick={handleSelect}
              disabled={loading}
            >
              {loading ? "Loading..." : "Select"}
            </Button>
          </Card.Footer>
        </Card.Root>

        {/* Second Card - Selected Month Display */}
        <Card.Root width="30vw" variant="elevated" bg="blue.100">
          <Card.Body gap="2">
            <Card.Title mb="2" textAlign="center">
              <Text fontWeight="bold" textStyle="2xl">
                {apiSuccess ? `Selected Month: ${monthName}, ${selectedYear}` : "Selected Month: -"}
              </Text>
            </Card.Title>
          </Card.Body>
        </Card.Root>
      </Stack>

      {/* tabs */}
      <Tabs.Root defaultValue="products" variant="plain">
        <Tabs.List bg="bg.muted" rounded="l3" p="1">
          <Tabs.Trigger value="products" className="flex items-center gap-2 px-4 py-2">
            <LuShoppingCart />
            Products
          </Tabs.Trigger>
          <Tabs.Trigger value="services" className="flex items-center gap-2 px-4 py-2">
            <LuBath />
            Services
          </Tabs.Trigger>
          <Tabs.Trigger value="mc_package" className="flex items-center gap-2 px-4 py-2">
            <LuBox />
            Member Care Package
          </Tabs.Trigger>
          <Tabs.Trigger value="m_credit" className="flex items-center gap-2 px-4 py-2">
            <LuBadgeCheck />
            Member Credit
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" bg="blue.200" />
        </Tabs.List>

        {/* Tabs - Products */}
        <Tabs.Content value="products">
          <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" width="100%" mb="7">
            {AdHocProductDATA.length > 0 ? (
              <Table.Root
                size="sm"
                variant="outline"
                interactive
                width="90vw"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                overflow="hidden"
              >
                <Table.Header bg="gray.100">
                  <Table.Row>
                    {["Day", "Cash", "Visa/Master", "PayNow", "Nets", "Total", "Net Sales"].map((header) => (
                      <Table.ColumnHeader
                        key={header}
                        textAlign="center"
                        className="border-r border-b border-gray-400 text-center p-3 font-semibold text-lg"
                      >
                        {header}
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {AdHocProductDATA.map((item, index) => {
                    const rowValues = [item.cash, item.visaMaster, item.paynow, item.nets, item.total, item.netSales];
                    const hasNonZeroValue = rowValues.some(value => value !== 0);

                    return (
                      <Table.Row
                        key={index}
                        _hover={{ bg: "gray.50" }}
                        bg={hasNonZeroValue ? "#fff9e6" : "transparent"}
                      >
                        <Table.Cell
                          textAlign="center"
                          className="border-r border-b border-gray-400 text-center p-3 text-lg"
                        >
                          {item.day}
                        </Table.Cell>
                        {[...rowValues].map((cell, idx) => (
                          <Table.Cell
                            key={idx}
                            textAlign="end"
                            className="border-r border-b border-gray-400 text-center p-3 text-lg"
                          >
                            {Number.parseFloat(cell).toFixed(2)}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            ) : (
              <Text fontSize="lg">{apiSuccess ? "No records found" : "Please select Month and Year"}</Text>
            )}
          </Box>
        </Tabs.Content>

        {/* Tabs - Services */}
        <Tabs.Content value="services">
          <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" width="100%" mb="7">
            {AdHocServiceDATA.length > 0 ? (
              <Table.Root
                size="sm"
                variant="outline"
                interactive
                width="90vw"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                overflow="hidden"
              >
                <Table.Header bg="gray.100">
                  <Table.Row>
                    {["Day", "Cash", "Visa/Master", "PayNow", "Nets", "Total", "Net Sales"].map((header) => (
                      <Table.ColumnHeader
                        key={header}
                        textAlign="center"
                        className="border-r border-b border-gray-400 text-center p-3 font-semibold text-lg"
                      >
                        {header}
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {AdHocServiceDATA.map((item, index) => {
                    const rowValues = [item.cash, item.visaMaster, item.paynow, item.nets, item.total, item.netSales];
                    const hasNonZeroValue = rowValues.some(value => value !== 0);

                    return (
                      <Table.Row
                        key={index}
                        _hover={{ bg: "gray.50" }}
                        bg={hasNonZeroValue ? "#fff9e6" : "transparent"}
                      >
                        <Table.Cell
                          textAlign="center"
                          className="border-r border-b border-gray-400 text-center p-3 text-lg"
                        >
                          {item.day}
                        </Table.Cell>
                        {[...rowValues].map((cell, idx) => (
                          <Table.Cell
                            key={idx}
                            textAlign="end"
                            className="border-r border-b border-gray-400 text-center p-3 text-lg"
                          >
                            {Number.parseFloat(cell).toFixed(2)}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            ) : (
              <Text fontSize="lg">{apiSuccess ? "No records found" : "Please select Month and Year"}</Text>
            )}
          </Box>
        </Tabs.Content>

        {/* Tabs - Member Care Package */}
        <Tabs.Content value="mc_package">
          <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" width="100%" mb="7">
            {MCPMergedData.length > 0 ? (
              <Table.Root
                size="sm"
                variant="outline"
                interactive
                width="90vw"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                overflow="hidden"
              >
                <Table.Header bg="gray.100">
                  <Table.Row>
                    {["Day", "Cash", "Visa/Master", "PayNow", "Nets", "Total", "VIP", "Package Points", "Net Sales", "Refund"].map((header) => (
                      <Table.ColumnHeader
                        key={header}
                        textAlign="center"
                        className="border-r border-b border-gray-400 text-center p-3 font-semibold text-lg"
                      >
                        {header}
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {MCPMergedData.map((item, index) => {
                    const rowValues = [item.cash, item.visaMaster, item.paynow, item.nets, item.total, item.vipsalesTotal, item.total, item.vipsalesTotal, item.refundTotal];
                    const hasNonZeroValue = rowValues.some(value => value !== 0);

                    return (
                      <Table.Row
                        key={index}
                        _hover={{ bg: "gray.50" }}
                        bg={hasNonZeroValue ? "#fff9e6" : "transparent"}
                      >
                        <Table.Cell
                          textAlign="center"
                          className="border-r border-b border-gray-400 text-center p-3 text-lg"
                        >
                          {item.day}
                        </Table.Cell>
                        {[...rowValues].map((cell, idx) => (
                          <Table.Cell
                            key={idx}
                            textAlign="end"
                            className="border-r border-b border-gray-400 text-center p-3 text-lg"
                          >
                            {Number.parseFloat(cell).toFixed(2)}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            ) : (
              <Text fontSize="lg">{apiSuccess ? "No records found" : "Please select Month and Year"}</Text>
            )}
          </Box>
        </Tabs.Content>

        {/* Tabs - Member Credit */}
        <Tabs.Content value="m_credit">
          <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" width="100%" mb="7">
            {mCreditData.length > 0 ? (
              <Table.Root
                size="sm"
                variant="outline"
                interactive
                width="90vw"
                border="1px solid"
                borderColor="gray.300"
                borderRadius="md"
                overflow="hidden"
              >
                <Table.Header bg="gray.100">
                  <Table.Row>
                    {["Day", "Cash", "Visa/Master", "PayNow", "Nets", "Total", "Net Sales"].map((header) => (
                      <Table.ColumnHeader
                        key={header}
                        textAlign="center"
                        className="border-r border-b border-gray-400 text-center p-3 font-semibold text-lg"
                      >
                        {header}
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {mCreditData.map((item, index) => {
                    const rowValues = [item.cash, item.visaMaster, item.paynow, item.nets, item.total, item.netSales];
                    const hasNonZeroValue = rowValues.some(value => value !== 0);

                    return (
                      <Table.Row
                        key={index}
                        _hover={{ bg: "gray.50" }}
                        bg={hasNonZeroValue ? "#fff9e6" : "transparent"}
                      >
                        <Table.Cell
                          textAlign="center"
                          className="border-r border-b border-gray-400 text-center p-3 text-lg"
                        >
                        {item.day}
                        </Table.Cell>
                        {[...rowValues].map((cell, idx) => (
                          <Table.Cell
                            key={idx}
                            textAlign="end"
                            className="border-r border-b border-gray-400 text-center p-3 text-lg"
                          >
                            {Number.parseFloat(cell).toFixed(2)}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            ) : (
              <Text fontSize="lg">{apiSuccess ? "No records found" : "Please select Month and Year"}</Text>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default RevenueReport;