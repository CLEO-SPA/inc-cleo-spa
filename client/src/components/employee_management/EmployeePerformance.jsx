import { useState, useEffect } from "react";
import { Table, Box, Container, Button, Stack, Text, HStack, Spinner } from "@chakra-ui/react";
import { api } from "@/interceptors/axios";
import { Field } from "@/components/ui/field";
import { NativeSelectRoot, NativeSelectField } from "@/components/ui/native-select";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";

const EmployeePerformance = () => {

  const { employeeId } = useParams();
  // Get current month and year
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // State for selected month, year, and employee ID
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Month & Year Dropdown Options
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/em/empr/${employeeId}/${month}/${year}`);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId, month, year]);

  return (
    <>
    <Navbar />
    <Container maxW="container.xl" py={6}>
      <HStack justifyContent="space-between" mb={4}>
        <Stack>
          <Text fontSize="2xl" fontWeight="bold">
            Monthly Employee Sales Performance and Commission Report
          </Text>
        </Stack>
        <HStack>
          {/* <Button colorPalette="teal">
            <a href="/createDepartment">Export Data</a>
          </Button> */}
        </HStack>
      </HStack>

      {/* Select for month and year */}
      <Stack direction="row" spacing={4} mb={6}>
        <Field label="Month" width="320px">
          <NativeSelectRoot variant="subtle">
            <NativeSelectField
              placeholder="Select a month"
              name="month"
              value={month.toString()}
              items={months.map((m) => ({
                label: m.label,
                value: m.value.toString(),
              }))}
              onChange={(e) => setMonth(Number(e.target.value))}
            />
          </NativeSelectRoot>
        </Field>
        <Field label="Year">
          <NativeSelectRoot variant="subtle" width="320px">
            <NativeSelectField
              placeholder="Select a year"
              name="year"
              value={year.toString()}
              items={years.map((y) => ({
                label: y.label,
                value: y.value.toString(),
              }))}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </NativeSelectRoot>
        </Field>
      </Stack>

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <>
          {/* Employee Summary Table */}
          <Box rounded="md" overflowX="auto" shadow="sm" mb={6}>
            <Table.Root>
              <Table.Header>
                <Table.Row bg="bg.subtle">
                  <Table.ColumnHeader>Employee Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Employee Code</Table.ColumnHeader>
                  <Table.ColumnHeader>Month/Year</Table.ColumnHeader>
                  <Table.ColumnHeader>Total Performance</Table.ColumnHeader>
                  <Table.ColumnHeader>Total Commission</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>{data?.employee_name || "N/A"}</Table.Cell>
                  <Table.Cell>{data?.employee_code || "N/A"}</Table.Cell>
                  <Table.Cell>{months.find((m) => m.value === month)?.label}/{year}</Table.Cell>
                  <Table.Cell>{data?.total_performance || "0.00"}</Table.Cell>
                  <Table.Cell>{data?.total_commission || "0.00"}</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          </Box>

          {/* Daily Breakdown Table */}
          <Box rounded="md" overflowX="auto" shadow="sm">
            <Table.Root>
              <Table.Header>
                <Table.Row bg="bg.subtle">
                  <Table.ColumnHeader>Day</Table.ColumnHeader>
                  <Table.ColumnHeader>Service</Table.ColumnHeader>
                  <Table.ColumnHeader>Product</Table.ColumnHeader>
                  <Table.ColumnHeader>Open Member Account</Table.ColumnHeader>
                  <Table.ColumnHeader>Member Care Package Sales</Table.ColumnHeader>
                  <Table.ColumnHeader>Total Performance</Table.ColumnHeader>
                  <Table.ColumnHeader>Total Commission</Table.ColumnHeader>
                  <Table.ColumnHeader>Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data?.daily_breakdown && Object.keys(data.daily_breakdown).length > 0
                  ? Object.entries(data.daily_breakdown).map(([day, values]) => (
                    <Table.Row key={day}>
                      <Table.Cell>{day}</Table.Cell>
                      <Table.Cell>{values.Service || "0.00"}</Table.Cell>
                      <Table.Cell>{values.Product || "0.00"}</Table.Cell>
                      <Table.Cell>{values.Membership_Account || "0.00"}</Table.Cell>
                      <Table.Cell>{values.Member_Care_Package || "0.00"}</Table.Cell>
                      <Table.Cell>{values.total_performance || "0.00"}</Table.Cell>
                      <Table.Cell>{values.total_commission || "0.00"}</Table.Cell>
                      <Table.Cell>
                        <Stack direction="row">

                          <Button colorPalette="blue" variant="outline" size="xs">
                            <a href={`/empr/${employeeId}/${month}/${year}/${day}`}>
                              View Breakdown
                            </a>


                          </Button>
                        </Stack>
                      </Table.Cell>
                    </Table.Row>
                  ))
                  : (
                    <Table.Row>
                      <Table.Cell colSpan={8} textAlign="center">
                        No data available for this month and year.
                      </Table.Cell>
                    </Table.Row>
                  )}
              </Table.Body>
            </Table.Root>
          </Box>
        </>
      )}
    </Container>
    </>
  );
};

export default EmployeePerformance;
